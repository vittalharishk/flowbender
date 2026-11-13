"""Authentication router: register, login, refresh, logout, me, bootstrap, change-password."""

import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, get_current_user, require_roles
from ..auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    validate_password_strength,
    decode_token,
)
from ..models.core import Organization, User, UserSession, AuditLog
from ..schemas.core import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
    ChangePasswordRequest,
    BootstrapRequest,
    BootstrapResponse,
)

router = APIRouter()


def _create_session(user_id: uuid.UUID, refresh_token: str, expires_days: int = 7) -> UserSession:
    return UserSession(
        user_id=user_id,
        refresh_token_hash=hash_password(refresh_token[:32]),
        expires_at=datetime.now(timezone.utc) + timedelta(days=expires_days),
    )


@router.get("/bootstrap-status")
async def bootstrap_status(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(User))
    count = result.scalar_one()
    return {"needs_bootstrap": count == 0}


@router.post("/bootstrap", response_model=BootstrapResponse, status_code=status.HTTP_201_CREATED)
async def bootstrap(data: BootstrapRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(func.count()).select_from(User))
    if result.scalar_one() > 0:
        raise HTTPException(status_code=409, detail="System already bootstrapped")

    pw_error = validate_password_strength(data.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    org = Organization(name=data.org_name, slug=data.org_name.lower().replace(" ", "-"))
    db.add(org)
    await db.flush()

    user = User(
        organization_id=org.id,
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name or "",
        role="owner",
        is_active=True,
    )
    db.add(user)
    await db.flush()

    access_token = create_access_token(user.id, org.id, user.role)
    refresh_nonce = str(uuid.uuid4())
    refresh_token = create_refresh_token(user.id, user.id)
    session = _create_session(user.id, refresh_nonce)
    db.add(session)

    db.add(AuditLog(
        organization_id=org.id, user_id=user.id,
        action="bootstrap", table_name="users", record_id=str(user.id),
    ))
    await db.commit()

    return BootstrapResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        message="System bootstrapped successfully. You are now the Business Owner.",
    )


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    pw_error = validate_password_strength(data.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    org = Organization(name=data.org_name, slug=data.org_name.lower().replace(" ", "-"))
    db.add(org)
    await db.flush()

    user = User(
        organization_id=org.id,
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name or "",
        role="owner",
        is_active=True,
    )
    db.add(user)
    await db.flush()

    access_token = create_access_token(user.id, org.id, user.role)
    refresh_nonce = str(uuid.uuid4())
    refresh_token = create_refresh_token(user.id, user.id)
    session = _create_session(user.id, refresh_nonce)
    db.add(session)
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    user.last_login_at = datetime.now(timezone.utc)

    access_token = create_access_token(user.id, user.organization_id, user.role)
    refresh_nonce = str(uuid.uuid4())
    refresh_token = create_refresh_token(user.id, user.id)
    session = _create_session(user.id, refresh_nonce)
    db.add(session)

    db.add(AuditLog(
        organization_id=user.organization_id, user_id=user.id,
        action="login", table_name="users", record_id=str(user.id),
    ))
    await db.commit()

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    try:
        user_id = uuid.UUID(payload["sub"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")

    result = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=401, detail="User not found or disabled")

    access_token = create_access_token(user.id, user.organization_id, user.role)
    refresh_nonce = str(uuid.uuid4())
    new_refresh = create_refresh_token(user.id, user.id)

    return TokenResponse(access_token=access_token, refresh_token=new_refresh)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(
        select(UserSession).where(UserSession.user_id == current_user.user_id)
    )
    sessions = result.scalars().all()
    for s in sessions:
        await db.delete(s)

    db.add(AuditLog(
        organization_id=current_user.organization_id, user_id=current_user.user_id,
        action="logout", table_name="users", record_id=str(current_user.user_id),
    ))
    await db.commit()


@router.get("/me", response_model=UserResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    data: ChangePasswordRequest,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    result = await db.execute(select(User).where(User.id == current_user.user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")

    pw_error = validate_password_strength(data.new_password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    user.password_hash = hash_password(data.new_password)
    db.add(AuditLog(
        organization_id=current_user.organization_id, user_id=current_user.user_id,
        action="change_password", table_name="users", record_id=str(current_user.user_id),
    ))
    await db.commit()
    return {"message": "Password changed successfully"}

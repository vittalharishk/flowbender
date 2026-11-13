"""Authentication router: register, login, refresh, logout, me."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, get_current_user
from ..auth.utils import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    validate_password_strength,
    decode_token,
)
from ..models.core import Organization, User, UserSession
from ..schemas.core import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    RefreshRequest,
    UserResponse,
)

router = APIRouter()


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterRequest, db: AsyncSession = Depends(get_db)):
    # Validate password strength
    pw_error = validate_password_strength(data.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    # Check if email already exists
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create organization
    org = Organization(name=data.org_name)
    db.add(org)
    await db.flush()

    # Create user
    user = User(
        organization_id=org.id,
        email=data.email,
        password_hash=hash_password(data.password),
        first_name=data.first_name,
        last_name=data.last_name,
        role="owner",
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    await db.flush()

    # Create session
    session = UserSession(
        user_id=user.id,
        token_family=str(uuid.uuid4()),
    )
    db.add(session)
    await db.commit()
    await db.refresh(user)
    await db.refresh(session)

    access_token = create_access_token(user.id, org.id, user.role)
    refresh_token = create_refresh_token(user.id, session.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == data.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is disabled")

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)

    # Create session
    session = UserSession(
        user_id=user.id,
        token_family=str(uuid.uuid4()),
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    access_token = create_access_token(user.id, user.organization_id, user.role)
    refresh_token = create_refresh_token(user.id, session.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=TokenResponse)
async def refresh(data: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(data.refresh_token)

    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    try:
        user_id = uuid.UUID(payload["sub"])
        session_id = uuid.UUID(payload["session"])
    except (KeyError, ValueError):
        raise HTTPException(status_code=401, detail="Invalid refresh token payload")

    # Verify session exists
    result = await db.execute(
        select(UserSession).where(
            UserSession.id == session_id,
            UserSession.user_id == user_id,
            UserSession.is_active == True,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=401, detail="Session expired or revoked")

    # Get user
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or disabled")

    access_token = create_access_token(user.id, user.organization_id, user.role)
    refresh_token = create_refresh_token(user.id, session.id)

    return TokenResponse(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(get_current_user),
):
    # Deactivate all sessions for this user
    result = await db.execute(
        select(UserSession).where(
            UserSession.user_id == current_user.user_id,
            UserSession.is_active == True,
        )
    )
    sessions = result.scalars().all()
    for session in sessions:
        session.is_active = False
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

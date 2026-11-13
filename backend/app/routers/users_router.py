"""Users router: CRUD for users within an organization, plus deactivation and project access."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_admin, require_owner, require_any
from ..auth.utils import hash_password, validate_password_strength
from ..services.crud import CRUDBase
from ..models.core import User, AuditLog
from ..models.teams import UserProjectAccess
from ..schemas.core import UserCreate, UserUpdate, UserResponse
from ..schemas.teams import (
    UserProjectAccessCreate,
    UserProjectAccessUpdate,
    UserProjectAccessResponse,
)

router = APIRouter()
crud = CRUDBase(User)


@router.get("/", response_model=list[UserResponse])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit)
    return items


@router.get("/{item_id}", response_model=UserResponse)
async def get_user(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    pw_error = validate_password_strength(data.password)
    if pw_error:
        raise HTTPException(status_code=400, detail=pw_error)

    existing = await db.execute(
        select(User).where(User.email == data.email, User.organization_id == current_user.organization_id)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Email already registered in this organization")

    user = await crud.create(
        db, data, current_user.organization_id,
        password_hash=hash_password(data.password),
    )

    db.add(AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.user_id,
        action="create_user",
        table_name="users",
        record_id=str(user.id),
        new_values={"email": data.email, "role": data.role},
    ))
    await db.commit()
    return user


@router.patch("/{item_id}", response_model=UserResponse)
async def update_user(
    item_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    item = await crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    if data.role == "owner" and current_user.role != "owner":
        raise HTTPException(status_code=403, detail="Only the owner can assign the owner role")

    old_values = {"role": item.role, "is_active": item.is_active}
    updated = await crud.update(db, item, data)

    db.add(AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.user_id,
        action="update_user",
        table_name="users",
        record_id=str(item_id),
        old_values=old_values,
        new_values=data.model_dump(exclude_unset=True),
    ))
    await db.commit()
    return updated


@router.post("/{item_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_owner),
):
    if item_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    item = await crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    item.is_active = False
    db.add(item)
    db.add(AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.user_id,
        action="deactivate_user",
        table_name="users",
        record_id=str(item_id),
    ))
    await db.commit()
    await db.refresh(item)
    return item


@router.post("/{item_id}/reactivate", response_model=UserResponse)
async def reactivate_user(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_owner),
):
    item = await crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    item.is_active = True
    db.add(item)
    db.add(AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.user_id,
        action="reactivate_user",
        table_name="users",
        record_id=str(item_id),
    ))
    await db.commit()
    await db.refresh(item)
    return item


@router.get("/{item_id}/access", response_model=list[UserProjectAccessResponse])
async def get_user_project_access(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    user = await crud.get(db, item_id, current_user.organization_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(UserProjectAccess).where(
            UserProjectAccess.user_id == item_id,
            UserProjectAccess.is_active == True,
        )
    )
    return result.scalars().all()


@router.put("/{item_id}/access", response_model=UserProjectAccessResponse)
async def set_user_project_access(
    item_id: UUID,
    data: UserProjectAccessCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    user = await crud.get(db, item_id, current_user.organization_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    result = await db.execute(
        select(UserProjectAccess).where(
            UserProjectAccess.user_id == item_id,
            UserProjectAccess.project_id == data.project_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.access_level = data.access_level
        existing.module_permissions = data.module_permissions
        existing.is_active = True
        existing.granted_by = current_user.user_id
        db.add(existing)
        await db.commit()
        await db.refresh(existing)
        return existing

    access = UserProjectAccess(
        user_id=item_id,
        project_id=data.project_id,
        access_level=data.access_level,
        module_permissions=data.module_permissions,
        granted_by=current_user.user_id,
    )
    db.add(access)
    db.add(AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.user_id,
        action="grant_project_access",
        table_name="user_project_access",
        record_id=str(item_id),
        new_values={"project_id": str(data.project_id), "access_level": data.access_level},
    ))
    await db.commit()
    await db.refresh(access)
    return access


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    deleted = await crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

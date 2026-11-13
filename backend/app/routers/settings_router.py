"""Settings router — Notifications + User Preferences."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.settings import Notification, UserPreference
from ..schemas.settings import (
    NotificationUpdate,
    NotificationResponse,
    UserPreferenceCreate,
    UserPreferenceResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
notification_crud = CRUDBase(Notification)
preference_crud = CRUDBase(UserPreference)


# ── Notifications ──────────────────────────────────────────────────────────


@router.get("/notifications", response_model=list[NotificationResponse])
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await notification_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"user_id": current_user.user_id},
    )
    return items


@router.patch("/notifications/{notification_id}", response_model=NotificationResponse)
async def update_notification(
    notification_id: UUID,
    data: NotificationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await notification_crud.get(db, notification_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Notification not found")
    return await notification_crud.update(db, item, data)


# ── User Preferences ──────────────────────────────────────────────────────


@router.get("/preferences", response_model=list[UserPreferenceResponse])
async def list_preferences(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    """List preferences for the current user.

    UserPreference is keyed by user_id (no organization_id column), so we
    query via the crud helper's ``filters`` to scope by user.  The
    ``organization_id`` argument required by ``get_multi`` is still passed
    (it is a no-op because UserPreference lacks that column).
    """
    from sqlalchemy import select

    stmt = (
        select(UserPreference)
        .where(UserPreference.user_id == current_user.user_id)
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/preferences/{pref_id}", response_model=UserPreferenceResponse)
async def get_preference(
    pref_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    from sqlalchemy import select

    stmt = select(UserPreference).where(
        UserPreference.id == pref_id,
        UserPreference.user_id == current_user.user_id,
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Preference not found")
    return item


@router.post(
    "/preferences",
    response_model=UserPreferenceResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_preference(
    data: UserPreferenceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    db_obj = UserPreference(
        user_id=current_user.user_id,
        **data.model_dump(),
    )
    db.add(db_obj)
    await db.commit()
    await db.refresh(db_obj)
    return db_obj


@router.delete("/preferences/{pref_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_preference(
    pref_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    from sqlalchemy import select

    stmt = select(UserPreference).where(
        UserPreference.id == pref_id,
        UserPreference.user_id == current_user.user_id,
    )
    result = await db.execute(stmt)
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Preference not found")
    await db.delete(item)
    await db.commit()

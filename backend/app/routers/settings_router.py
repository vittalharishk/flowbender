"""Settings router — Notifications, User Preferences, and Audit Logs."""

from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_admin, require_any
from ..models.settings import Notification, UserPreference
from ..models.core import AuditLog, Organization, User
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


# ── Audit Logs ────────────────────────────────────────────────────────────


@router.get("/audit-logs")
async def list_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    action: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    stmt = select(AuditLog).where(AuditLog.organization_id == current_user.organization_id)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if table_name:
        stmt = stmt.where(AuditLog.table_name == table_name)
    stmt = stmt.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(stmt)
    logs = result.scalars().all()

    user_ids = {log.user_id for log in logs if log.user_id}
    user_map: dict[str, str] = {}
    if user_ids:
        user_result = await db.execute(select(User.id, User.email).where(User.id.in_(user_ids)))
        user_map = {str(row.id): row.email for row in user_result.all()}

    return [
        {
            "id": log.id,
            "user_id": str(log.user_id) if log.user_id else None,
            "user_email": user_map.get(str(log.user_id), "—") if log.user_id else "system",
            "action": log.action,
            "table_name": log.table_name,
            "record_id": log.record_id,
            "old_values": log.old_values,
            "new_values": log.new_values,
            "created_at": log.created_at.isoformat() if log.created_at else None,
        }
        for log in logs
    ]


# ── Organization Settings ─────────────────────────────────────────────────


@router.get("/organization")
async def get_organization(
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")
    return {
        "id": str(org.id),
        "name": org.name,
        "slug": org.slug,
        "legal_name": org.legal_name,
        "gst_number": org.gst_number,
        "pan_number": org.pan_number,
        "default_currency": org.default_currency,
        "settings": org.settings,
    }


@router.patch("/organization")
async def update_organization(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_admin),
):
    result = await db.execute(select(Organization).where(Organization.id == current_user.organization_id))
    org = result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=404, detail="Organization not found")

    allowed_fields = {"name", "legal_name", "gst_number", "pan_number", "default_currency", "settings"}
    for key, value in data.items():
        if key in allowed_fields and hasattr(org, key):
            setattr(org, key, value)

    db.add(org)
    db.add(AuditLog(
        organization_id=current_user.organization_id,
        user_id=current_user.user_id,
        action="update_organization",
        table_name="organizations",
        record_id=str(org.id),
        new_values={k: v for k, v in data.items() if k in allowed_fields},
    ))
    await db.commit()
    return {"message": "Organization updated"}

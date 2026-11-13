"""Schedule router: ScheduleEntry + ShootDay CRUD."""

from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..services.crud import CRUDBase
from ..models.schedule import ScheduleEntry, ShootDay
from ..schemas.schedule import (
    ScheduleEntryCreate, ScheduleEntryUpdate, ScheduleEntryResponse,
    ShootDayCreate, ShootDayUpdate, ShootDayResponse,
)

router = APIRouter()

entry_crud = CRUDBase(ScheduleEntry)
shoot_day_crud = CRUDBase(ShootDay)


# ---------------------------------------------------------------------------
# Schedule Entries
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[ScheduleEntryResponse])
async def list_schedule_entries(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    filters = {}
    if date_from:
        filters["date_from"] = date_from
    if date_to:
        filters["date_to"] = date_to
    items, total = await entry_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id,
        filters=filters if filters else None,
    )
    return items


@router.get("/{item_id}", response_model=ScheduleEntryResponse)
async def get_schedule_entry(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await entry_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=ScheduleEntryResponse, status_code=status.HTTP_201_CREATED)
async def create_schedule_entry(
    data: ScheduleEntryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await entry_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=ScheduleEntryResponse)
async def update_schedule_entry(
    item_id: UUID,
    data: ScheduleEntryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await entry_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await entry_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_schedule_entry(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await entry_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ---------------------------------------------------------------------------
# Shoot Days
# ---------------------------------------------------------------------------

@router.get("/shoot-days/", response_model=list[ShootDayResponse])
async def list_shoot_days(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    filters = {}
    if date_from:
        filters["date_from"] = date_from
    if date_to:
        filters["date_to"] = date_to
    items, total = await shoot_day_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id,
        filters=filters if filters else None,
    )
    return items


@router.get("/shoot-days/{item_id}", response_model=ShootDayResponse)
async def get_shoot_day(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await shoot_day_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/shoot-days/", response_model=ShootDayResponse, status_code=status.HTTP_201_CREATED)
async def create_shoot_day(
    data: ShootDayCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await shoot_day_crud.create(db, data, current_user.organization_id)


@router.patch("/shoot-days/{item_id}", response_model=ShootDayResponse)
async def update_shoot_day(
    item_id: UUID,
    data: ShootDayUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await shoot_day_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await shoot_day_crud.update(db, item, data)


@router.delete("/shoot-days/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_shoot_day(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await shoot_day_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

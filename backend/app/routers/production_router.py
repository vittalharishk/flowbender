"""Production Task CRUD router with sub-routes for checklist, DPR, calendar."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.production import (
    ProductionTask,
    PreProdChecklistItem,
    DprReport,
    CalendarEvent,
)
from ..schemas.production import (
    ProductionTaskCreate,
    ProductionTaskUpdate,
    ProductionTaskResponse,
    PreProdChecklistItemCreate,
    PreProdChecklistItemResponse,
    DprReportCreate,
    DprReportUpdate,
    DprReportResponse,
    CalendarEventCreate,
    CalendarEventUpdate,
    CalendarEventResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
task_crud = CRUDBase(ProductionTask)
checklist_crud = CRUDBase(PreProdChecklistItem)
dpr_crud = CRUDBase(DprReport)
calendar_crud = CRUDBase(CalendarEvent)

# ── Production Tasks ────────────────────────────────────────────────────────


@router.get("/", response_model=list[ProductionTaskResponse])
async def list_tasks(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await task_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=ProductionTaskResponse)
async def get_task(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await task_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=ProductionTaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    data: ProductionTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await task_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=ProductionTaskResponse)
async def update_task(
    item_id: UUID,
    data: ProductionTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await task_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await task_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await task_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Pre-Production Checklist ────────────────────────────────────────────────


@router.get("/checklist/", response_model=list[PreProdChecklistItemResponse])
async def list_checklist_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await checklist_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/checklist/{item_id}", response_model=PreProdChecklistItemResponse)
async def get_checklist_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await checklist_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/checklist/", response_model=PreProdChecklistItemResponse, status_code=status.HTTP_201_CREATED)
async def create_checklist_item(
    data: PreProdChecklistItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await checklist_crud.create(db, data, current_user.organization_id)


@router.delete("/checklist/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_checklist_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await checklist_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── DPR Reports ─────────────────────────────────────────────────────────────


@router.get("/dpr/", response_model=list[DprReportResponse])
async def list_dpr_reports(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await dpr_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/dpr/{item_id}", response_model=DprReportResponse)
async def get_dpr_report(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await dpr_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/dpr/", response_model=DprReportResponse, status_code=status.HTTP_201_CREATED)
async def create_dpr_report(
    data: DprReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await dpr_crud.create(db, data, current_user.organization_id)


@router.patch("/dpr/{item_id}", response_model=DprReportResponse)
async def update_dpr_report(
    item_id: UUID,
    data: DprReportUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await dpr_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await dpr_crud.update(db, item, data)


@router.delete("/dpr/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_dpr_report(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await dpr_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Calendar Events ─────────────────────────────────────────────────────────


@router.get("/calendar/", response_model=list[CalendarEventResponse])
async def list_calendar_events(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await calendar_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/calendar/{item_id}", response_model=CalendarEventResponse)
async def get_calendar_event(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await calendar_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/calendar/", response_model=CalendarEventResponse, status_code=status.HTTP_201_CREATED)
async def create_calendar_event(
    data: CalendarEventCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await calendar_crud.create(db, data, current_user.organization_id)


@router.patch("/calendar/{item_id}", response_model=CalendarEventResponse)
async def update_calendar_event(
    item_id: UUID,
    data: CalendarEventUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await calendar_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await calendar_crud.update(db, item, data)


@router.delete("/calendar/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_calendar_event(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await calendar_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

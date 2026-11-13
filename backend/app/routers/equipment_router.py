"""Equipment CRUD router with sub-routes for allocations and maintenance."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.assets import EquipmentItem, EquipmentAllocation, EquipmentMaintenance
from ..schemas.assets import (
    EquipmentItemCreate,
    EquipmentItemUpdate,
    EquipmentItemResponse,
    EquipmentAllocationCreate,
    EquipmentAllocationResponse,
    EquipmentMaintenanceCreate,
    EquipmentMaintenanceResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
equip_crud = CRUDBase(EquipmentItem)
alloc_crud = CRUDBase(EquipmentAllocation)
maint_crud = CRUDBase(EquipmentMaintenance)

# ── Equipment Items ─────────────────────────────────────────────────────────


@router.get("/", response_model=list[EquipmentItemResponse])
async def list_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await equip_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=EquipmentItemResponse)
async def get_equipment(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await equip_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=EquipmentItemResponse, status_code=status.HTTP_201_CREATED)
async def create_equipment(
    data: EquipmentItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await equip_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=EquipmentItemResponse)
async def update_equipment(
    item_id: UUID,
    data: EquipmentItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await equip_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await equip_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_equipment(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await equip_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Allocations ─────────────────────────────────────────────────────────────


@router.get("/allocations/", response_model=list[EquipmentAllocationResponse])
async def list_allocations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await alloc_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/allocations/{item_id}", response_model=EquipmentAllocationResponse)
async def get_allocation(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await alloc_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/allocations/", response_model=EquipmentAllocationResponse, status_code=status.HTTP_201_CREATED)
async def create_allocation(
    data: EquipmentAllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await alloc_crud.create(db, data, current_user.organization_id)


@router.delete("/allocations/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_allocation(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await alloc_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Maintenance ─────────────────────────────────────────────────────────────


@router.get("/maintenance/", response_model=list[EquipmentMaintenanceResponse])
async def list_maintenance(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await maint_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/maintenance/{item_id}", response_model=EquipmentMaintenanceResponse)
async def get_maintenance(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await maint_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/maintenance/", response_model=EquipmentMaintenanceResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance(
    data: EquipmentMaintenanceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await maint_crud.create(db, data, current_user.organization_id)


@router.delete("/maintenance/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await maint_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

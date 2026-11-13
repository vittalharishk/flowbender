"""Vehicles, Caravans, Drivers, and Stunts router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.crew_departments import (
    ProductionVehicle,
    VehicleAllocation,
    Caravan,
    CaravanAllocation,
    DriverProfile,
    DriverAssignment,
    StuntPlan,
    StuntEquipment,
)
from ..schemas.crew_departments import (
    ProductionVehicleCreate,
    ProductionVehicleUpdate,
    ProductionVehicleResponse,
    VehicleAllocationCreate,
    VehicleAllocationResponse,
    CaravanCreate,
    CaravanUpdate,
    CaravanResponse,
    CaravanAllocationCreate,
    CaravanAllocationResponse,
    DriverProfileCreate,
    DriverProfileUpdate,
    DriverProfileResponse,
    DriverAssignmentCreate,
    DriverAssignmentResponse,
    StuntPlanCreate,
    StuntPlanUpdate,
    StuntPlanResponse,
    StuntEquipmentCreate,
    StuntEquipmentUpdate,
    StuntEquipmentResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
vehicle_crud = CRUDBase(ProductionVehicle)
vehicle_alloc_crud = CRUDBase(VehicleAllocation)
caravan_crud = CRUDBase(Caravan)
caravan_alloc_crud = CRUDBase(CaravanAllocation)
driver_crud = CRUDBase(DriverProfile)
driver_assign_crud = CRUDBase(DriverAssignment)
stunt_crud = CRUDBase(StuntPlan)
stunt_equip_crud = CRUDBase(StuntEquipment)


# ── Vehicles ───────────────────────────────────────────────────────────────


@router.get("/vehicles/", response_model=list[ProductionVehicleResponse])
async def list_vehicles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await vehicle_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/vehicles/{vehicle_id}", response_model=ProductionVehicleResponse)
async def get_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await vehicle_crud.get(db, vehicle_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return item


@router.post("/vehicles/", response_model=ProductionVehicleResponse, status_code=status.HTTP_201_CREATED)
async def create_vehicle(
    data: ProductionVehicleCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await vehicle_crud.create(db, data, current_user.organization_id)


@router.patch("/vehicles/{vehicle_id}", response_model=ProductionVehicleResponse)
async def update_vehicle(
    vehicle_id: UUID,
    data: ProductionVehicleUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await vehicle_crud.get(db, vehicle_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return await vehicle_crud.update(db, item, data)


@router.delete("/vehicles/{vehicle_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vehicle(
    vehicle_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await vehicle_crud.delete(db, vehicle_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Vehicle not found")


# ── Vehicle Allocations ────────────────────────────────────────────────────


@router.get("/vehicles/{vehicle_id}/allocations", response_model=list[VehicleAllocationResponse])
async def list_vehicle_allocations(
    vehicle_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await vehicle_alloc_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"vehicle_id": vehicle_id},
    )
    return items


@router.post(
    "/vehicles/{vehicle_id}/allocations",
    response_model=VehicleAllocationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_vehicle_allocation(
    vehicle_id: UUID,
    data: VehicleAllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    vehicle = await vehicle_crud.get(db, vehicle_id, current_user.organization_id)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return await vehicle_alloc_crud.create(db, data, current_user.organization_id)


# ── Caravans ───────────────────────────────────────────────────────────────


@router.get("/caravans/", response_model=list[CaravanResponse])
async def list_caravans(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await caravan_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/caravans/{caravan_id}", response_model=CaravanResponse)
async def get_caravan(
    caravan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await caravan_crud.get(db, caravan_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Caravan not found")
    return item


@router.post("/caravans/", response_model=CaravanResponse, status_code=status.HTTP_201_CREATED)
async def create_caravan(
    data: CaravanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await caravan_crud.create(db, data, current_user.organization_id)


@router.patch("/caravans/{caravan_id}", response_model=CaravanResponse)
async def update_caravan(
    caravan_id: UUID,
    data: CaravanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await caravan_crud.get(db, caravan_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Caravan not found")
    return await caravan_crud.update(db, item, data)


@router.delete("/caravans/{caravan_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_caravan(
    caravan_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await caravan_crud.delete(db, caravan_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Caravan not found")


# ── Caravan Allocations ────────────────────────────────────────────────────


@router.get("/caravans/{caravan_id}/allocations", response_model=list[CaravanAllocationResponse])
async def list_caravan_allocations(
    caravan_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await caravan_alloc_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"caravan_id": caravan_id},
    )
    return items


@router.post(
    "/caravans/{caravan_id}/allocations",
    response_model=CaravanAllocationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_caravan_allocation(
    caravan_id: UUID,
    data: CaravanAllocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    caravan = await caravan_crud.get(db, caravan_id, current_user.organization_id)
    if not caravan:
        raise HTTPException(status_code=404, detail="Caravan not found")
    return await caravan_alloc_crud.create(db, data, current_user.organization_id)


# ── Drivers ────────────────────────────────────────────────────────────────


@router.get("/drivers/", response_model=list[DriverProfileResponse])
async def list_drivers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await driver_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/drivers/{driver_id}", response_model=DriverProfileResponse)
async def get_driver(
    driver_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await driver_crud.get(db, driver_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Driver not found")
    return item


@router.post("/drivers/", response_model=DriverProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_driver(
    data: DriverProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await driver_crud.create(db, data, current_user.organization_id)


@router.patch("/drivers/{driver_id}", response_model=DriverProfileResponse)
async def update_driver(
    driver_id: UUID,
    data: DriverProfileUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await driver_crud.get(db, driver_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Driver not found")
    return await driver_crud.update(db, item, data)


@router.delete("/drivers/{driver_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_driver(
    driver_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await driver_crud.delete(db, driver_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Driver not found")


# ── Driver Assignments ─────────────────────────────────────────────────────


@router.get("/drivers/{driver_id}/assignments", response_model=list[DriverAssignmentResponse])
async def list_driver_assignments(
    driver_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await driver_assign_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"driver_id": driver_id},
    )
    return items


@router.post(
    "/drivers/{driver_id}/assignments",
    response_model=DriverAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_driver_assignment(
    driver_id: UUID,
    data: DriverAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    driver = await driver_crud.get(db, driver_id, current_user.organization_id)
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
    return await driver_assign_crud.create(db, data, current_user.organization_id)


# ── Stunts ─────────────────────────────────────────────────────────────────


@router.get("/stunts/", response_model=list[StuntPlanResponse])
async def list_stunts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await stunt_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/stunts/{stunt_id}", response_model=StuntPlanResponse)
async def get_stunt(
    stunt_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await stunt_crud.get(db, stunt_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Stunt plan not found")
    return item


@router.post("/stunts/", response_model=StuntPlanResponse, status_code=status.HTTP_201_CREATED)
async def create_stunt(
    data: StuntPlanCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await stunt_crud.create(db, data, current_user.organization_id)


@router.patch("/stunts/{stunt_id}", response_model=StuntPlanResponse)
async def update_stunt(
    stunt_id: UUID,
    data: StuntPlanUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await stunt_crud.get(db, stunt_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Stunt plan not found")
    return await stunt_crud.update(db, item, data)


@router.delete("/stunts/{stunt_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stunt(
    stunt_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await stunt_crud.delete(db, stunt_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Stunt plan not found")


# ── Stunt Equipment ────────────────────────────────────────────────────────


@router.get("/stunts/equipment/", response_model=list[StuntEquipmentResponse])
async def list_stunt_equipment(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await stunt_equip_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.post(
    "/stunts/equipment/",
    response_model=StuntEquipmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_stunt_equipment(
    data: StuntEquipmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await stunt_equip_crud.create(db, data, current_user.organization_id)


@router.patch("/stunts/equipment/{equipment_id}", response_model=StuntEquipmentResponse)
async def update_stunt_equipment(
    equipment_id: UUID,
    data: StuntEquipmentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await stunt_equip_crud.get(db, equipment_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Stunt equipment not found")
    return await stunt_equip_crud.update(db, item, data)


@router.delete("/stunts/equipment/{equipment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_stunt_equipment(
    equipment_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await stunt_equip_crud.delete(db, equipment_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Stunt equipment not found")

"""Distribution Extension router — Territories, Digital, Satellite, Audio."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.distribution_ext import (
    DistributionTerritory, DigitalDistribution,
    SatelliteDistribution, AudioDistribution,
)
from ..schemas.distribution_ext import (
    DistributionTerritoryCreate, DistributionTerritoryUpdate, DistributionTerritoryResponse,
    DigitalDistributionCreate, DigitalDistributionUpdate, DigitalDistributionResponse,
    SatelliteDistributionCreate, SatelliteDistributionUpdate, SatelliteDistributionResponse,
    AudioDistributionCreate, AudioDistributionUpdate, AudioDistributionResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
territory_crud = CRUDBase(DistributionTerritory)
digital_crud = CRUDBase(DigitalDistribution)
satellite_crud = CRUDBase(SatelliteDistribution)
audio_crud = CRUDBase(AudioDistribution)


# ── Territories ────────────────────────────────────────────────────────────

@router.get("/territories/", response_model=list[DistributionTerritoryResponse])
async def list_territories(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await territory_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/territories/{id}", response_model=DistributionTerritoryResponse)
async def get_territory(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await territory_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Territory not found")
    return obj

@router.post("/territories/", response_model=DistributionTerritoryResponse, status_code=201)
async def create_territory(data: DistributionTerritoryCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await territory_crud.create(db, data, current_user.organization_id)

@router.patch("/territories/{id}", response_model=DistributionTerritoryResponse)
async def update_territory(id: UUID, data: DistributionTerritoryUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await territory_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Territory not found")
    return await territory_crud.update(db, obj, data)

@router.delete("/territories/{id}", status_code=204)
async def delete_territory(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await territory_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Territory not found")


# ── Digital ────────────────────────────────────────────────────────────────

@router.get("/digital/", response_model=list[DigitalDistributionResponse])
async def list_digital(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await digital_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/digital/{id}", response_model=DigitalDistributionResponse)
async def get_digital(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await digital_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Digital distribution not found")
    return obj

@router.post("/digital/", response_model=DigitalDistributionResponse, status_code=201)
async def create_digital(data: DigitalDistributionCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await digital_crud.create(db, data, current_user.organization_id)

@router.patch("/digital/{id}", response_model=DigitalDistributionResponse)
async def update_digital(id: UUID, data: DigitalDistributionUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await digital_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Digital distribution not found")
    return await digital_crud.update(db, obj, data)

@router.delete("/digital/{id}", status_code=204)
async def delete_digital(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await digital_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Digital distribution not found")


# ── Satellite ──────────────────────────────────────────────────────────────

@router.get("/satellite/", response_model=list[SatelliteDistributionResponse])
async def list_satellite(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await satellite_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/satellite/{id}", response_model=SatelliteDistributionResponse)
async def get_satellite(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await satellite_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Satellite distribution not found")
    return obj

@router.post("/satellite/", response_model=SatelliteDistributionResponse, status_code=201)
async def create_satellite(data: SatelliteDistributionCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await satellite_crud.create(db, data, current_user.organization_id)

@router.patch("/satellite/{id}", response_model=SatelliteDistributionResponse)
async def update_satellite(id: UUID, data: SatelliteDistributionUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await satellite_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Satellite distribution not found")
    return await satellite_crud.update(db, obj, data)

@router.delete("/satellite/{id}", status_code=204)
async def delete_satellite(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await satellite_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Satellite distribution not found")


# ── Audio ──────────────────────────────────────────────────────────────────

@router.get("/audio/", response_model=list[AudioDistributionResponse])
async def list_audio(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await audio_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/audio/{id}", response_model=AudioDistributionResponse)
async def get_audio(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await audio_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Audio distribution not found")
    return obj

@router.post("/audio/", response_model=AudioDistributionResponse, status_code=201)
async def create_audio(data: AudioDistributionCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await audio_crud.create(db, data, current_user.organization_id)

@router.patch("/audio/{id}", response_model=AudioDistributionResponse)
async def update_audio(id: UUID, data: AudioDistributionUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await audio_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Audio distribution not found")
    return await audio_crud.update(db, obj, data)

@router.delete("/audio/{id}", status_code=204)
async def delete_audio(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await audio_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Audio distribution not found")

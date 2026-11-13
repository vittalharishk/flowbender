"""Film Locations CRUD router with sub-routes for scouting, agreements, payments."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.crew_departments import (
    FilmLocation,
    LocationScouting,
    LocationAgreement,
    LocationPayment,
)
from ..schemas.crew_departments import (
    FilmLocationCreate,
    FilmLocationUpdate,
    FilmLocationResponse,
    LocationScoutingCreate,
    LocationScoutingResponse,
    LocationAgreementCreate,
    LocationAgreementUpdate,
    LocationAgreementResponse,
    LocationPaymentCreate,
    LocationPaymentResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
location_crud = CRUDBase(FilmLocation)
scouting_crud = CRUDBase(LocationScouting)
agreement_crud = CRUDBase(LocationAgreement)
payment_crud = CRUDBase(LocationPayment)

# ── Film Locations ──────────────────────────────────────────────────────────


@router.get("/", response_model=list[FilmLocationResponse])
async def list_locations(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await location_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=FilmLocationResponse)
async def get_location(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await location_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=FilmLocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    data: FilmLocationCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await location_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=FilmLocationResponse)
async def update_location(
    item_id: UUID,
    data: FilmLocationUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await location_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await location_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await location_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Location Scouting ───────────────────────────────────────────────────────


@router.get("/scouting/", response_model=list[LocationScoutingResponse])
async def list_scouting(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await scouting_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/scouting/{item_id}", response_model=LocationScoutingResponse)
async def get_scouting(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await scouting_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/scouting/", response_model=LocationScoutingResponse, status_code=status.HTTP_201_CREATED)
async def create_scouting(
    data: LocationScoutingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await scouting_crud.create(db, data, current_user.organization_id)


@router.delete("/scouting/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_scouting(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await scouting_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Location Agreements ─────────────────────────────────────────────────────


@router.get("/agreements/", response_model=list[LocationAgreementResponse])
async def list_agreements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await agreement_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/agreements/{item_id}", response_model=LocationAgreementResponse)
async def get_agreement(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await agreement_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/agreements/", response_model=LocationAgreementResponse, status_code=status.HTTP_201_CREATED)
async def create_agreement(
    data: LocationAgreementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await agreement_crud.create(db, data, current_user.organization_id)


@router.patch("/agreements/{item_id}", response_model=LocationAgreementResponse)
async def update_agreement(
    item_id: UUID,
    data: LocationAgreementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await agreement_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await agreement_crud.update(db, item, data)


@router.delete("/agreements/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agreement(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await agreement_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Location Payments ───────────────────────────────────────────────────────


@router.get("/payments/", response_model=list[LocationPaymentResponse])
async def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await payment_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.post("/payments/", response_model=LocationPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: LocationPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await payment_crud.create(db, data, current_user.organization_id)

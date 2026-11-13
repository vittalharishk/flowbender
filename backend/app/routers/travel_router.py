"""Travel router — Trip CRUD + TravelPayment sub-routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.crew_departments import Trip, TravelPayment
from ..schemas.crew_departments import (
    TripCreate,
    TripUpdate,
    TripResponse,
    TravelPaymentCreate,
    TravelPaymentResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
trip_crud = CRUDBase(Trip)
payment_crud = CRUDBase(TravelPayment)


# ── Trips ──────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[TripResponse])
async def list_trips(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await trip_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{trip_id}", response_model=TripResponse)
async def get_trip(
    trip_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await trip_crud.get(db, trip_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Trip not found")
    return item


@router.post("/", response_model=TripResponse, status_code=status.HTTP_201_CREATED)
async def create_trip(
    data: TripCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await trip_crud.create(db, data, current_user.organization_id)


@router.patch("/{trip_id}", response_model=TripResponse)
async def update_trip(
    trip_id: UUID,
    data: TripUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await trip_crud.get(db, trip_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Trip not found")
    return await trip_crud.update(db, item, data)


@router.delete("/{trip_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_trip(
    trip_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await trip_crud.delete(db, trip_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Trip not found")


# ── Travel Payments ────────────────────────────────────────────────────────


@router.get("/{trip_id}/payments", response_model=list[TravelPaymentResponse])
async def list_travel_payments(
    trip_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await payment_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"trip_id": trip_id},
    )
    return items


@router.post(
    "/{trip_id}/payments",
    response_model=TravelPaymentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_travel_payment(
    trip_id: UUID,
    data: TravelPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    trip = await trip_crud.get(db, trip_id, current_user.organization_id)
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return await payment_crud.create(db, data, current_user.organization_id)

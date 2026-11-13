"""Hotel, Booking, and Payment CRUD router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.crew_departments import Hotel, HotelBooking, HotelPayment
from ..schemas.crew_departments import (
    HotelCreate,
    HotelResponse,
    HotelBookingCreate,
    HotelBookingUpdate,
    HotelBookingResponse,
    HotelPaymentCreate,
    HotelPaymentResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
hotel_crud = CRUDBase(Hotel)
booking_crud = CRUDBase(HotelBooking)
payment_crud = CRUDBase(HotelPayment)

# ── Hotels ──────────────────────────────────────────────────────────────────


@router.get("/", response_model=list[HotelResponse])
async def list_hotels(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await hotel_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/{item_id}", response_model=HotelResponse)
async def get_hotel(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await hotel_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=HotelResponse, status_code=status.HTTP_201_CREATED)
async def create_hotel(
    data: HotelCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await hotel_crud.create(db, data, current_user.organization_id)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_hotel(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await hotel_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Hotel Bookings ──────────────────────────────────────────────────────────


@router.get("/bookings/", response_model=list[HotelBookingResponse])
async def list_bookings(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await booking_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/bookings/{item_id}", response_model=HotelBookingResponse)
async def get_booking(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await booking_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/bookings/", response_model=HotelBookingResponse, status_code=status.HTTP_201_CREATED)
async def create_booking(
    data: HotelBookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await booking_crud.create(db, data, current_user.organization_id)


@router.patch("/bookings/{item_id}", response_model=HotelBookingResponse)
async def update_booking(
    item_id: UUID,
    data: HotelBookingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await booking_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await booking_crud.update(db, item, data)


@router.delete("/bookings/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_booking(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await booking_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Hotel Payments ──────────────────────────────────────────────────────────


@router.get("/payments/", response_model=list[HotelPaymentResponse])
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


@router.post("/payments/", response_model=HotelPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: HotelPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await payment_crud.create(db, data, current_user.organization_id)

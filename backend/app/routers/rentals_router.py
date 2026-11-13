"""Rental Vendor, Record, and Payment CRUD router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.crew_departments import RentalVendor, RentalRecord, RentalPayment
from ..schemas.crew_departments import (
    RentalVendorCreate,
    RentalVendorUpdate,
    RentalVendorResponse,
    RentalRecordCreate,
    RentalRecordUpdate,
    RentalRecordResponse,
    RentalPaymentCreate,
    RentalPaymentResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
vendor_crud = CRUDBase(RentalVendor)
record_crud = CRUDBase(RentalRecord)
payment_crud = CRUDBase(RentalPayment)

# ── Rental Vendors ──────────────────────────────────────────────────────────


@router.get("/vendors/", response_model=list[RentalVendorResponse])
async def list_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await vendor_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/vendors/{item_id}", response_model=RentalVendorResponse)
async def get_vendor(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await vendor_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/vendors/", response_model=RentalVendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    data: RentalVendorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await vendor_crud.create(db, data, current_user.organization_id)


@router.patch("/vendors/{item_id}", response_model=RentalVendorResponse)
async def update_vendor(
    item_id: UUID,
    data: RentalVendorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await vendor_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await vendor_crud.update(db, item, data)


@router.delete("/vendors/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await vendor_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Rental Records ──────────────────────────────────────────────────────────


@router.get("/", response_model=list[RentalRecordResponse])
async def list_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await record_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=RentalRecordResponse)
async def get_record(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await record_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=RentalRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_record(
    data: RentalRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await record_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=RentalRecordResponse)
async def update_record(
    item_id: UUID,
    data: RentalRecordUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await record_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await record_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_record(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await record_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Rental Payments ─────────────────────────────────────────────────────────


@router.get("/payments/", response_model=list[RentalPaymentResponse])
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


@router.post("/payments/", response_model=RentalPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: RentalPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await payment_crud.create(db, data, current_user.organization_id)

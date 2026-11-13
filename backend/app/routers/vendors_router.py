"""Vendors router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.finance import Vendor
from ..schemas.finance import VendorCreate, VendorUpdate, VendorResponse
from ..services.crud import CRUDBase

router = APIRouter()
crud = CRUDBase(Vendor)


@router.get("/", response_model=list[VendorResponse])
async def list_vendors(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await crud.get(db, vendor_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return item


@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    data: VendorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await crud.create(db, data, current_user.organization_id)


@router.patch("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: UUID,
    data: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await crud.get(db, vendor_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return await crud.update(db, item, data)


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vendor(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await crud.delete(db, vendor_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Vendor not found")

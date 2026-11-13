"""Receivables router — Consolidated receivables and payments."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.distribution_ext import Receivable, ReceivablePayment
from ..schemas.distribution_ext import (
    ReceivableCreate, ReceivableUpdate, ReceivableResponse,
    ReceivablePaymentCreate, ReceivablePaymentResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
recv_crud = CRUDBase(Receivable)
recv_pay_crud = CRUDBase(ReceivablePayment)


@router.get("/", response_model=list[ReceivableResponse])
async def list_receivables(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None, source_type: str | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    filters = {}
    if source_type:
        filters["source_type"] = source_type
    items, _ = await recv_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id, filters=filters or None)
    return items

@router.get("/{id}", response_model=ReceivableResponse)
async def get_receivable(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await recv_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Receivable not found")
    return obj

@router.post("/", response_model=ReceivableResponse, status_code=201)
async def create_receivable(data: ReceivableCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await recv_crud.create(db, data, current_user.organization_id)

@router.patch("/{id}", response_model=ReceivableResponse)
async def update_receivable(id: UUID, data: ReceivableUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await recv_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Receivable not found")
    return await recv_crud.update(db, obj, data)

@router.delete("/{id}", status_code=204)
async def delete_receivable(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await recv_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Receivable not found")


# ── Payments ───────────────────────────────────────────────────────────────

@router.get("/payments/", response_model=list[ReceivablePaymentResponse])
async def list_payments(
    receivable_id: UUID, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await recv_pay_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, filters={"receivable_id": receivable_id})
    return items

@router.post("/payments/", response_model=ReceivablePaymentResponse, status_code=201)
async def create_payment(data: ReceivablePaymentCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await recv_pay_crud.create(db, data, current_user.organization_id)

"""Expenses CRUD router: ProductionExpense, ExpensePayment, OfficeRental, OfficeRentPayment, MaintenanceRecord."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.crew_departments import (
    ProductionExpense,
    ExpensePayment,
    OfficeRental,
    OfficeRentPayment,
    MaintenanceRecord,
)
from ..schemas.crew_departments import (
    ProductionExpenseCreate,
    ProductionExpenseUpdate,
    ProductionExpenseResponse,
    ExpensePaymentCreate,
    ExpensePaymentResponse,
    OfficeRentalCreate,
    OfficeRentalUpdate,
    OfficeRentalResponse,
    OfficeRentPaymentCreate,
    OfficeRentPaymentResponse,
    MaintenanceRecordCreate,
    MaintenanceRecordResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
expense_crud = CRUDBase(ProductionExpense)
expense_pay_crud = CRUDBase(ExpensePayment)
office_crud = CRUDBase(OfficeRental)
office_pay_crud = CRUDBase(OfficeRentPayment)
maintenance_crud = CRUDBase(MaintenanceRecord)

# ── Production Expenses ─────────────────────────────────────────────────────


@router.get("/", response_model=list[ProductionExpenseResponse])
async def list_expenses(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await expense_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=ProductionExpenseResponse)
async def get_expense(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await expense_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=ProductionExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    data: ProductionExpenseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await expense_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=ProductionExpenseResponse)
async def update_expense(
    item_id: UUID,
    data: ProductionExpenseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await expense_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await expense_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await expense_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Expense Payments ────────────────────────────────────────────────────────


@router.get("/payments/", response_model=list[ExpensePaymentResponse])
async def list_expense_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await expense_pay_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.post("/payments/", response_model=ExpensePaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_expense_payment(
    data: ExpensePaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await expense_pay_crud.create(db, data, current_user.organization_id)


# ── Office Rentals ──────────────────────────────────────────────────────────


@router.get("/office-rentals/", response_model=list[OfficeRentalResponse])
async def list_office_rentals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await office_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/office-rentals/{item_id}", response_model=OfficeRentalResponse)
async def get_office_rental(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await office_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/office-rentals/", response_model=OfficeRentalResponse, status_code=status.HTTP_201_CREATED)
async def create_office_rental(
    data: OfficeRentalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await office_crud.create(db, data, current_user.organization_id)


@router.patch("/office-rentals/{item_id}", response_model=OfficeRentalResponse)
async def update_office_rental(
    item_id: UUID,
    data: OfficeRentalUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await office_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await office_crud.update(db, item, data)


@router.delete("/office-rentals/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_office_rental(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await office_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Office Rent Payments ────────────────────────────────────────────────────


@router.get("/office-payments/", response_model=list[OfficeRentPaymentResponse])
async def list_office_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await office_pay_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.post("/office-payments/", response_model=OfficeRentPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_office_payment(
    data: OfficeRentPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await office_pay_crud.create(db, data, current_user.organization_id)


# ── Maintenance Records ────────────────────────────────────────────────────


@router.get("/maintenance/", response_model=list[MaintenanceRecordResponse])
async def list_maintenance_records(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await maintenance_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/maintenance/{item_id}", response_model=MaintenanceRecordResponse)
async def get_maintenance_record(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await maintenance_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/maintenance/", response_model=MaintenanceRecordResponse, status_code=status.HTTP_201_CREATED)
async def create_maintenance_record(
    data: MaintenanceRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await maintenance_crud.create(db, data, current_user.organization_id)


@router.delete("/maintenance/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_maintenance_record(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await maintenance_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

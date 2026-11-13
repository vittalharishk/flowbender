"""Business router — Investors, Loans, Branding, Tranches, OST, Burn."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.business import (
    Investor, InvestorProject, InvestmentTransaction,
    Loan, LoanRepayment,
    BrandingDeal, BrandingDeliverable, BrandingPayment,
    FundingTranche, OstReceivable, OstPayment, BurnRecord,
)
from ..schemas.business import (
    InvestorCreate, InvestorUpdate, InvestorResponse,
    InvestorProjectCreate, InvestorProjectUpdate, InvestorProjectResponse,
    InvestmentTransactionCreate, InvestmentTransactionResponse,
    LoanCreate, LoanUpdate, LoanResponse,
    LoanRepaymentCreate, LoanRepaymentResponse,
    BrandingDealCreate, BrandingDealUpdate, BrandingDealResponse,
    BrandingDeliverableCreate, BrandingDeliverableUpdate, BrandingDeliverableResponse,
    BrandingPaymentCreate, BrandingPaymentResponse,
    FundingTrancheCreate, FundingTrancheUpdate, FundingTrancheResponse,
    OstReceivableCreate, OstReceivableUpdate, OstReceivableResponse,
    OstPaymentCreate, OstPaymentResponse,
    BurnRecordCreate, BurnRecordResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
investor_crud = CRUDBase(Investor)
investor_project_crud = CRUDBase(InvestorProject)
invest_txn_crud = CRUDBase(InvestmentTransaction)
loan_crud = CRUDBase(Loan)
loan_repayment_crud = CRUDBase(LoanRepayment)
branding_crud = CRUDBase(BrandingDeal)
branding_deliv_crud = CRUDBase(BrandingDeliverable)
branding_payment_crud = CRUDBase(BrandingPayment)
tranche_crud = CRUDBase(FundingTranche)
ost_crud = CRUDBase(OstReceivable)
ost_payment_crud = CRUDBase(OstPayment)
burn_crud = CRUDBase(BurnRecord)


# ── Investors ──────────────────────────────────────────────────────────────

@router.get("/investors/", response_model=list[InvestorResponse])
async def list_investors(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await investor_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit)
    return items

@router.get("/investors/{id}", response_model=InvestorResponse)
async def get_investor(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await investor_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Investor not found")
    return obj

@router.post("/investors/", response_model=InvestorResponse, status_code=201)
async def create_investor(data: InvestorCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await investor_crud.create(db, data, current_user.organization_id)

@router.patch("/investors/{id}", response_model=InvestorResponse)
async def update_investor(id: UUID, data: InvestorUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await investor_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Investor not found")
    return await investor_crud.update(db, obj, data)

@router.delete("/investors/{id}", status_code=204)
async def delete_investor(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await investor_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Investor not found")


# ── Investor Projects ──────────────────────────────────────────────────────

@router.get("/investor-projects/", response_model=list[InvestorProjectResponse])
async def list_investor_projects(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await investor_project_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.post("/investor-projects/", response_model=InvestorProjectResponse, status_code=201)
async def create_investor_project(data: InvestorProjectCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await investor_project_crud.create(db, data, current_user.organization_id)

@router.patch("/investor-projects/{id}", response_model=InvestorProjectResponse)
async def update_investor_project(id: UUID, data: InvestorProjectUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await investor_project_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return await investor_project_crud.update(db, obj, data)


# ── Loans ──────────────────────────────────────────────────────────────────

@router.get("/loans/", response_model=list[LoanResponse])
async def list_loans(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await loan_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/loans/{id}", response_model=LoanResponse)
async def get_loan(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await loan_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Loan not found")
    return obj

@router.post("/loans/", response_model=LoanResponse, status_code=201)
async def create_loan(data: LoanCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    extra = {}
    if data.outstanding_principal is None:
        extra["outstanding_principal"] = data.principal
    return await loan_crud.create(db, data, current_user.organization_id, **extra)

@router.patch("/loans/{id}", response_model=LoanResponse)
async def update_loan(id: UUID, data: LoanUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await loan_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Loan not found")
    return await loan_crud.update(db, obj, data)

@router.delete("/loans/{id}", status_code=204)
async def delete_loan(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await loan_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Loan not found")


# ── Loan Repayments ────────────────────────────────────────────────────────

@router.get("/loan-repayments/", response_model=list[LoanRepaymentResponse])
async def list_loan_repayments(
    loan_id: UUID, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await loan_repayment_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, filters={"loan_id": loan_id})
    return items

@router.post("/loan-repayments/", response_model=LoanRepaymentResponse, status_code=201)
async def create_loan_repayment(data: LoanRepaymentCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await loan_repayment_crud.create(db, data, current_user.organization_id)


# ── Branding ───────────────────────────────────────────────────────────────

@router.get("/branding/", response_model=list[BrandingDealResponse])
async def list_branding(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await branding_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/branding/{id}", response_model=BrandingDealResponse)
async def get_branding(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await branding_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return obj

@router.post("/branding/", response_model=BrandingDealResponse, status_code=201)
async def create_branding(data: BrandingDealCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await branding_crud.create(db, data, current_user.organization_id)

@router.patch("/branding/{id}", response_model=BrandingDealResponse)
async def update_branding(id: UUID, data: BrandingDealUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await branding_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return await branding_crud.update(db, obj, data)

@router.delete("/branding/{id}", status_code=204)
async def delete_branding(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await branding_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Not found")


# ── Tranches ───────────────────────────────────────────────────────────────

@router.get("/tranches/", response_model=list[FundingTrancheResponse])
async def list_tranches(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await tranche_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.post("/tranches/", response_model=FundingTrancheResponse, status_code=201)
async def create_tranche(data: FundingTrancheCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await tranche_crud.create(db, data, current_user.organization_id)

@router.patch("/tranches/{id}", response_model=FundingTrancheResponse)
async def update_tranche(id: UUID, data: FundingTrancheUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await tranche_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return await tranche_crud.update(db, obj, data)

@router.delete("/tranches/{id}", status_code=204)
async def delete_tranche(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await tranche_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Not found")


# ── OST ────────────────────────────────────────────────────────────────────

@router.get("/ost/", response_model=list[OstReceivableResponse])
async def list_ost(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await ost_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.post("/ost/", response_model=OstReceivableResponse, status_code=201)
async def create_ost(data: OstReceivableCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await ost_crud.create(db, data, current_user.organization_id)

@router.patch("/ost/{id}", response_model=OstReceivableResponse)
async def update_ost(id: UUID, data: OstReceivableUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await ost_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Not found")
    return await ost_crud.update(db, obj, data)

@router.get("/ost-payments/", response_model=list[OstPaymentResponse])
async def list_ost_payments(
    receivable_id: UUID, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await ost_payment_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, filters={"receivable_id": receivable_id})
    return items

@router.post("/ost-payments/", response_model=OstPaymentResponse, status_code=201)
async def create_ost_payment(data: OstPaymentCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await ost_payment_crud.create(db, data, current_user.organization_id)


# ── Burn ───────────────────────────────────────────────────────────────────

@router.get("/burn/", response_model=list[BurnRecordResponse])
async def list_burn(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await burn_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.post("/burn/", response_model=BurnRecordResponse, status_code=201)
async def create_burn(data: BurnRecordCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await burn_crud.create(db, data, current_user.organization_id)

"""Business module schemas: Investors, Loans, Branding, Tranches, OST, Burn."""

from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Investors ──────────────────────────────────────────────────────────────

class InvestorCreate(BaseModel):
    name: str
    investor_type: str = "individual"
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    notes: Optional[str] = None

class InvestorUpdate(BaseModel):
    name: Optional[str] = None
    investor_type: Optional[str] = None
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    notes: Optional[str] = None
    is_active: Optional[bool] = None

class InvestorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    investor_type: str
    company: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[dict] = None
    notes: Optional[str] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime


# ── Investor Projects ──────────────────────────────────────────────────────

class InvestorProjectCreate(BaseModel):
    investor_id: UUID
    project_id: UUID
    investment_amount: Decimal = Decimal("0")
    committed_amount: Decimal = Decimal("0")
    received_amount: Decimal = Decimal("0")
    returned_amount: Decimal = Decimal("0")
    investment_type: str = "equity"
    investment_date: Optional[date] = None
    agreement_ref: Optional[str] = None
    status: str = "proposed"
    notes: Optional[str] = None

class InvestorProjectUpdate(BaseModel):
    investment_amount: Optional[Decimal] = None
    committed_amount: Optional[Decimal] = None
    received_amount: Optional[Decimal] = None
    returned_amount: Optional[Decimal] = None
    investment_type: Optional[str] = None
    investment_date: Optional[date] = None
    agreement_ref: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class InvestorProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    investor_id: UUID
    project_id: UUID
    investment_amount: Decimal
    committed_amount: Decimal
    received_amount: Decimal
    returned_amount: Decimal
    investment_type: str
    investment_date: Optional[date] = None
    agreement_ref: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Investment Transactions ────────────────────────────────────────────────

class InvestmentTransactionCreate(BaseModel):
    investor_project_id: UUID
    transaction_type: str
    amount: Decimal
    transaction_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None

class InvestmentTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    investor_project_id: UUID
    transaction_type: str
    amount: Decimal
    transaction_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


# ── Loans ──────────────────────────────────────────────────────────────────

class LoanCreate(BaseModel):
    project_id: Optional[UUID] = None
    lender: str
    borrower: str
    principal: Decimal
    annual_interest_rate: Decimal
    interest_method: str = "simple"
    compounding_frequency: Optional[str] = None
    start_date: date
    maturity_date: date
    outstanding_principal: Optional[Decimal] = None
    agreement_ref: Optional[str] = None
    collateral: Optional[str] = None
    notes: Optional[str] = None

class LoanUpdate(BaseModel):
    project_id: Optional[UUID] = None
    lender: Optional[str] = None
    borrower: Optional[str] = None
    principal: Optional[Decimal] = None
    annual_interest_rate: Optional[Decimal] = None
    interest_method: Optional[str] = None
    compounding_frequency: Optional[str] = None
    start_date: Optional[date] = None
    maturity_date: Optional[date] = None
    outstanding_principal: Optional[Decimal] = None
    accrued_interest: Optional[Decimal] = None
    paid_interest: Optional[Decimal] = None
    status: Optional[str] = None
    agreement_ref: Optional[str] = None
    collateral: Optional[str] = None
    notes: Optional[str] = None

class LoanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: Optional[UUID] = None
    lender: str
    borrower: str
    principal: Decimal
    annual_interest_rate: Decimal
    interest_method: str
    compounding_frequency: Optional[str] = None
    start_date: date
    maturity_date: date
    outstanding_principal: Decimal
    accrued_interest: Decimal
    paid_interest: Decimal
    status: str
    agreement_ref: Optional[str] = None
    collateral: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Loan Repayments ────────────────────────────────────────────────────────

class LoanRepaymentCreate(BaseModel):
    loan_id: UUID
    payment_date: date
    principal_amount: Decimal = Decimal("0")
    interest_amount: Decimal = Decimal("0")
    total_amount: Decimal
    reference: Optional[str] = None
    notes: Optional[str] = None

class LoanRepaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    loan_id: UUID
    payment_date: date
    principal_amount: Decimal
    interest_amount: Decimal
    total_amount: Decimal
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


# ── Branding Deals ─────────────────────────────────────────────────────────

class BrandingDealCreate(BaseModel):
    project_id: UUID
    brand: str
    placement_type: str
    scene_reference: Optional[str] = None
    agreement_value: Decimal
    status: str = "draft"
    agreement_ref: Optional[str] = None
    notes: Optional[str] = None

class BrandingDealUpdate(BaseModel):
    brand: Optional[str] = None
    placement_type: Optional[str] = None
    scene_reference: Optional[str] = None
    agreement_value: Optional[Decimal] = None
    invoiced_amount: Optional[Decimal] = None
    received_amount: Optional[Decimal] = None
    outstanding_amount: Optional[Decimal] = None
    status: Optional[str] = None
    agreement_ref: Optional[str] = None
    notes: Optional[str] = None

class BrandingDealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    brand: str
    placement_type: str
    scene_reference: Optional[str] = None
    agreement_value: Decimal
    invoiced_amount: Decimal
    received_amount: Decimal
    outstanding_amount: Decimal
    status: str
    agreement_ref: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Branding Deliverables ──────────────────────────────────────────────────

class BrandingDeliverableCreate(BaseModel):
    deal_id: UUID
    description: str
    due_date: Optional[date] = None
    status: str = "pending"

class BrandingDeliverableUpdate(BaseModel):
    description: Optional[str] = None
    due_date: Optional[date] = None
    status: Optional[str] = None
    completed_date: Optional[date] = None

class BrandingDeliverableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    deal_id: UUID
    description: str
    due_date: Optional[date] = None
    status: str
    completed_date: Optional[date] = None


# ── Branding Payments ──────────────────────────────────────────────────────

class BrandingPaymentCreate(BaseModel):
    deal_id: UUID
    amount: Decimal
    payment_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None

class BrandingPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    deal_id: UUID
    amount: Decimal
    payment_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


# ── Funding Tranches ───────────────────────────────────────────────────────

class FundingTrancheCreate(BaseModel):
    project_id: UUID
    funding_source: str
    investor_id: Optional[UUID] = None
    loan_id: Optional[UUID] = None
    tranche_number: int
    planned_amount: Decimal
    approved_amount: Decimal = Decimal("0")
    release_conditions: Optional[str] = None
    planned_release_date: Optional[date] = None
    status: str = "planned"
    supporting_docs: Optional[dict] = None

class FundingTrancheUpdate(BaseModel):
    funding_source: Optional[str] = None
    investor_id: Optional[UUID] = None
    loan_id: Optional[UUID] = None
    tranche_number: Optional[int] = None
    planned_amount: Optional[Decimal] = None
    approved_amount: Optional[Decimal] = None
    released_amount: Optional[Decimal] = None
    received_amount: Optional[Decimal] = None
    release_conditions: Optional[str] = None
    planned_release_date: Optional[date] = None
    actual_release_date: Optional[date] = None
    status: Optional[str] = None
    supporting_docs: Optional[dict] = None

class FundingTrancheResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    funding_source: str
    investor_id: Optional[UUID] = None
    loan_id: Optional[UUID] = None
    tranche_number: int
    planned_amount: Decimal
    approved_amount: Decimal
    released_amount: Decimal
    received_amount: Decimal
    release_conditions: Optional[str] = None
    planned_release_date: Optional[date] = None
    actual_release_date: Optional[date] = None
    status: str
    supporting_docs: Optional[dict] = None
    created_at: datetime
    updated_at: datetime


# ── OST Receivables ────────────────────────────────────────────────────────

class OstReceivableCreate(BaseModel):
    project_id: UUID
    music_label: str
    agreement_ref: Optional[str] = None
    contract_value: Decimal
    status: str = "active"
    notes: Optional[str] = None

class OstReceivableUpdate(BaseModel):
    music_label: Optional[str] = None
    agreement_ref: Optional[str] = None
    contract_value: Optional[Decimal] = None
    invoiced_amount: Optional[Decimal] = None
    received_amount: Optional[Decimal] = None
    outstanding_amount: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class OstReceivableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    music_label: str
    agreement_ref: Optional[str] = None
    contract_value: Decimal
    invoiced_amount: Decimal
    received_amount: Decimal
    outstanding_amount: Decimal
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── OST Payments ───────────────────────────────────────────────────────────

class OstPaymentCreate(BaseModel):
    receivable_id: UUID
    amount: Decimal
    payment_date: date
    milestone: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None

class OstPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    receivable_id: UUID
    amount: Decimal
    payment_date: date
    milestone: Optional[str] = None
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


# ── Burn Records ───────────────────────────────────────────────────────────

class BurnRecordCreate(BaseModel):
    project_id: UUID
    department: Optional[str] = None
    period_start: date
    period_end: date
    budget: Decimal = Decimal("0")
    actual_spend: Decimal = Decimal("0")
    committed_spend: Decimal = Decimal("0")
    variance: Decimal = Decimal("0")
    forecast_completion_cost: Optional[Decimal] = None
    notes: Optional[str] = None

class BurnRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    department: Optional[str] = None
    period_start: date
    period_end: date
    budget: Decimal
    actual_spend: Decimal
    committed_spend: Decimal
    variance: Decimal
    forecast_completion_cost: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime

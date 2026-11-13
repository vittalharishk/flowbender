"""Finance module schemas."""

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Project Budget ──────────────────────────────────────────────────────────

class ProjectBudgetCreate(BaseModel):
    project_id: UUID
    total_budget: float
    status: str = "draft"
    notes: Optional[str] = None


class ProjectBudgetUpdate(BaseModel):
    total_budget: Optional[float] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ProjectBudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    total_budget: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Department Budget ───────────────────────────────────────────────────────

class DepartmentBudgetCreate(BaseModel):
    project_budget_id: UUID
    project_id: UUID
    department: str
    allocated: float
    committed: float = 0
    spent: float = 0


class DepartmentBudgetUpdate(BaseModel):
    allocated: Optional[float] = None
    committed: Optional[float] = None
    spent: Optional[float] = None
    notes: Optional[str] = None


class DepartmentBudgetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_budget_id: UUID
    project_id: UUID
    department: str
    allocated: float
    committed: float
    spent: float
    created_at: datetime
    updated_at: datetime


# ── Budget Revisions ────────────────────────────────────────────────────────

class BudgetRevisionCreate(BaseModel):
    project_budget_id: UUID
    revision_number: int
    previous_total: float
    new_total: float
    reason: Optional[str] = None


class BudgetRevisionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_budget_id: UUID
    revision_number: int
    previous_total: float
    new_total: float
    reason: Optional[str] = None
    created_at: datetime


# ── Budget Line Items ───────────────────────────────────────────────────────

class BudgetLineItemCreate(BaseModel):
    project_id: UUID
    category: str
    description: Optional[str] = None
    allocated: float = 0
    committed: float = 0
    spent: float = 0


class BudgetLineItemUpdate(BaseModel):
    project_id: Optional[UUID] = None
    category: Optional[str] = None
    description: Optional[str] = None
    allocated: Optional[float] = None
    committed: Optional[float] = None
    spent: Optional[float] = None


class BudgetLineItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    category: str
    description: Optional[str] = None
    allocated: float
    committed: float
    spent: float
    created_at: datetime
    updated_at: datetime


# ── Purchase Orders ─────────────────────────────────────────────────────────

class PurchaseOrderCreate(BaseModel):
    project_id: UUID
    po_number: Optional[str] = None
    vendor_id: Optional[UUID] = None
    vendor_name: str
    department: Optional[str] = None
    items: Optional[list[dict[str, Any]]] = None
    subtotal: float
    discount_percent: float = 0
    tax_amount: float = 0
    total_amount: float
    status: str = "draft"
    delivery_date: Optional[date] = None


class PurchaseOrderUpdate(BaseModel):
    project_id: Optional[UUID] = None
    po_number: Optional[str] = None
    vendor_id: Optional[UUID] = None
    vendor_name: Optional[str] = None
    department: Optional[str] = None
    items: Optional[list[dict[str, Any]]] = None
    subtotal: Optional[float] = None
    discount_percent: Optional[float] = None
    tax_amount: Optional[float] = None
    total_amount: Optional[float] = None
    status: Optional[str] = None
    delivery_date: Optional[date] = None


class PurchaseOrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    po_number: Optional[str] = None
    vendor_id: Optional[UUID] = None
    vendor_name: str
    department: Optional[str] = None
    items: Optional[list[dict[str, Any]]] = None
    subtotal: float
    discount_percent: float
    tax_amount: float
    total_amount: float
    status: str
    delivery_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime


# ── Vendors ─────────────────────────────────────────────────────────────────

class VendorCreate(BaseModel):
    name: str
    category: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: float = 0
    status: str = "active"


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: Optional[float] = None
    status: Optional[str] = None


class VendorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: Optional[str] = None
    contact_person: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    gst_number: Optional[str] = None
    pan_number: Optional[str] = None
    payment_terms: Optional[str] = None
    credit_limit: float
    status: str
    created_at: datetime
    updated_at: datetime


# ── Insurance Policies ──────────────────────────────────────────────────────

class InsurancePolicyCreate(BaseModel):
    project_id: UUID
    policy_number: Optional[str] = None
    provider: str
    type: str
    coverage_amount: float
    premium: float
    deductible: float = 0
    start_date: date
    end_date: date
    beneficiary: Optional[str] = None


class InsurancePolicyUpdate(BaseModel):
    project_id: Optional[UUID] = None
    policy_number: Optional[str] = None
    provider: Optional[str] = None
    type: Optional[str] = None
    coverage_amount: Optional[float] = None
    premium: Optional[float] = None
    deductible: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    beneficiary: Optional[str] = None


class InsurancePolicyResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    policy_number: Optional[str] = None
    provider: str
    type: str
    coverage_amount: float
    premium: float
    deductible: float
    start_date: date
    end_date: date
    beneficiary: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Insurance Claims ────────────────────────────────────────────────────────

class InsuranceClaimCreate(BaseModel):
    policy_id: UUID
    claim_number: Optional[str] = None
    incident_date: date
    description: str
    claim_amount: float
    filed_by: Optional[str] = None


class InsuranceClaimUpdate(BaseModel):
    status: Optional[str] = None
    approved_amount: Optional[float] = None
    notes: Optional[str] = None


class InsuranceClaimResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    policy_id: UUID
    claim_number: Optional[str] = None
    incident_date: date
    description: str
    claim_amount: float
    filed_by: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Expense Items ───────────────────────────────────────────────────────────

class ExpenseItemCreate(BaseModel):
    project_id: UUID
    category: str
    description: Optional[str] = None
    amount: float
    vendor_id: Optional[UUID] = None
    status: str = "pending"


class ExpenseItemUpdate(BaseModel):
    project_id: Optional[UUID] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    vendor_id: Optional[UUID] = None
    status: Optional[str] = None


class ExpenseItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    category: str
    description: Optional[str] = None
    amount: float
    vendor_id: Optional[UUID] = None
    status: str
    created_at: datetime
    updated_at: datetime

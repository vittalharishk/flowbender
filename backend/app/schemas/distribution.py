"""Distribution module schemas."""

from datetime import date, datetime
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Rights Deals ────────────────────────────────────────────────────────────

class RightsDealCreate(BaseModel):
    project_id: UUID
    territory: str
    distributor: str
    rights_type: str
    status: str = "open"
    minimum_guarantee: float = 0
    advance_received: float = 0
    delivery_status: str = "pending"
    notes: Optional[str] = None


class RightsDealUpdate(BaseModel):
    project_id: Optional[UUID] = None
    territory: Optional[str] = None
    distributor: Optional[str] = None
    rights_type: Optional[str] = None
    status: Optional[str] = None
    minimum_guarantee: Optional[float] = None
    advance_received: Optional[float] = None
    delivery_status: Optional[str] = None
    notes: Optional[str] = None


class RightsDealResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    territory: str
    distributor: str
    rights_type: str
    status: str
    minimum_guarantee: float
    advance_received: float
    delivery_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Distribution Agreements ─────────────────────────────────────────────────

class DistributionAgreementCreate(BaseModel):
    project_id: UUID
    distributor_name: str
    channel: str
    territories: list[str]
    languages: Optional[list[str]] = None
    agreement_value: float = 0
    advance_paid: float = 0
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str = "draft"
    revenue_sharing: Optional[dict[str, Any]] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None


class DistributionAgreementUpdate(BaseModel):
    project_id: Optional[UUID] = None
    distributor_name: Optional[str] = None
    channel: Optional[str] = None
    territories: Optional[list[str]] = None
    languages: Optional[list[str]] = None
    agreement_value: Optional[float] = None
    advance_paid: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None
    revenue_sharing: Optional[dict[str, Any]] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None


class DistributionAgreementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    distributor_name: str
    channel: str
    territories: list[str]
    languages: Optional[list[str]] = None
    agreement_value: float
    advance_paid: float
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: str
    revenue_sharing: Optional[dict[str, Any]] = None
    payment_terms: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Distribution Releases ───────────────────────────────────────────────────

class DistributionReleaseCreate(BaseModel):
    project_id: UUID
    agreement_id: Optional[UUID] = None
    release_date: date
    territory: Optional[str] = None
    release_type: str = "theatrical"
    status: str = "planned"
    screens_count: Optional[int] = None
    notes: Optional[str] = None


class DistributionReleaseUpdate(BaseModel):
    project_id: Optional[UUID] = None
    agreement_id: Optional[UUID] = None
    release_date: Optional[date] = None
    territory: Optional[str] = None
    release_type: Optional[str] = None
    status: Optional[str] = None
    screens_count: Optional[int] = None
    notes: Optional[str] = None


class DistributionReleaseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    agreement_id: Optional[UUID] = None
    release_date: date
    territory: Optional[str] = None
    release_type: str
    status: str
    screens_count: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Distribution Revenue ────────────────────────────────────────────────────

class DistributionRevenueCreate(BaseModel):
    project_id: UUID
    agreement_id: Optional[UUID] = None
    release_id: Optional[UUID] = None
    source: Optional[str] = None
    territory: Optional[str] = None
    amount: float
    collection_date: date
    gst_amount: float = 0
    net_amount: float
    payment_status: str = "pending"
    notes: Optional[str] = None


class DistributionRevenueUpdate(BaseModel):
    project_id: Optional[UUID] = None
    agreement_id: Optional[UUID] = None
    release_id: Optional[UUID] = None
    source: Optional[str] = None
    territory: Optional[str] = None
    amount: Optional[float] = None
    collection_date: Optional[date] = None
    gst_amount: Optional[float] = None
    net_amount: Optional[float] = None
    payment_status: Optional[str] = None
    notes: Optional[str] = None


class DistributionRevenueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    agreement_id: Optional[UUID] = None
    release_id: Optional[UUID] = None
    source: Optional[str] = None
    territory: Optional[str] = None
    amount: float
    collection_date: date
    gst_amount: float
    net_amount: float
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Distribution Settlements ────────────────────────────────────────────────

class DistributionSettlementCreate(BaseModel):
    project_id: UUID
    agreement_id: Optional[UUID] = None
    counterparty_name: str
    settlement_type: str
    period_start: date
    period_end: date
    gross_amount: float
    deductions: Optional[dict[str, Any]] = None
    net_amount: float
    advance_adjusted: float = 0
    amount_payable: float
    payment_status: str = "pending"
    notes: Optional[str] = None


class DistributionSettlementUpdate(BaseModel):
    paid_amount: Optional[float] = None
    payment_status: Optional[str] = None
    payment_date: Optional[date] = None
    payment_ref: Optional[str] = None
    notes: Optional[str] = None


class DistributionSettlementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    agreement_id: Optional[UUID] = None
    counterparty_name: str
    settlement_type: str
    period_start: date
    period_end: date
    gross_amount: float
    deductions: Optional[dict[str, Any]] = None
    net_amount: float
    advance_adjusted: float
    amount_payable: float
    payment_status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

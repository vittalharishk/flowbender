"""Distribution extension schemas: Territories, Digital, Satellite, Audio, Receivables."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Distribution Territories ───────────────────────────────────────────────

class DistributionTerritoryCreate(BaseModel):
    project_id: UUID
    territory: str
    country: Optional[str] = None
    region: Optional[str] = None
    rights_category: str
    exclusivity: str = "non-exclusive"
    rights_holder: Optional[str] = None
    licensee: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    agreement_ref: Optional[str] = None
    restrictions: Optional[str] = None
    revenue_terms: Optional[str] = None

class DistributionTerritoryUpdate(BaseModel):
    territory: Optional[str] = None
    country: Optional[str] = None
    region: Optional[str] = None
    rights_category: Optional[str] = None
    exclusivity: Optional[str] = None
    rights_holder: Optional[str] = None
    licensee: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    agreement_ref: Optional[str] = None
    restrictions: Optional[str] = None
    revenue_terms: Optional[str] = None
    status: Optional[str] = None

class DistributionTerritoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    territory: str
    country: Optional[str] = None
    region: Optional[str] = None
    rights_category: str
    exclusivity: str
    rights_holder: Optional[str] = None
    licensee: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    agreement_ref: Optional[str] = None
    restrictions: Optional[str] = None
    revenue_terms: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Digital Distribution ───────────────────────────────────────────────────

class DigitalDistributionCreate(BaseModel):
    project_id: UUID
    platform: str
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    license_start: Optional[date] = None
    license_end: Optional[date] = None
    release_date: Optional[date] = None
    contract_value: Decimal = Decimal("0")
    minimum_guarantee: Decimal = Decimal("0")
    revenue_share_pct: Optional[Decimal] = None
    notes: Optional[str] = None

class DigitalDistributionUpdate(BaseModel):
    platform: Optional[str] = None
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    license_start: Optional[date] = None
    license_end: Optional[date] = None
    release_date: Optional[date] = None
    contract_value: Optional[Decimal] = None
    minimum_guarantee: Optional[Decimal] = None
    revenue_share_pct: Optional[Decimal] = None
    actual_receipts: Optional[Decimal] = None
    outstanding: Optional[Decimal] = None
    deliverables: Optional[dict] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class DigitalDistributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    platform: str
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    license_start: Optional[date] = None
    license_end: Optional[date] = None
    release_date: Optional[date] = None
    contract_value: Decimal
    minimum_guarantee: Decimal
    revenue_share_pct: Optional[Decimal] = None
    actual_receipts: Decimal
    outstanding: Decimal
    deliverables: Optional[dict] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Satellite Distribution ─────────────────────────────────────────────────

class SatelliteDistributionCreate(BaseModel):
    project_id: UUID
    broadcaster: str
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    rights_start: Optional[date] = None
    rights_end: Optional[date] = None
    contract_value: Decimal = Decimal("0")
    notes: Optional[str] = None

class SatelliteDistributionUpdate(BaseModel):
    broadcaster: Optional[str] = None
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    rights_start: Optional[date] = None
    rights_end: Optional[date] = None
    contract_value: Optional[Decimal] = None
    telecast_dates: Optional[dict] = None
    invoiced_amount: Optional[Decimal] = None
    collected_amount: Optional[Decimal] = None
    outstanding: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class SatelliteDistributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    broadcaster: str
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    rights_start: Optional[date] = None
    rights_end: Optional[date] = None
    contract_value: Decimal
    telecast_dates: Optional[dict] = None
    invoiced_amount: Decimal
    collected_amount: Decimal
    outstanding: Decimal
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Audio Distribution ─────────────────────────────────────────────────────

class AudioDistributionCreate(BaseModel):
    project_id: UUID
    music_label: str
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    contract_value: Decimal = Decimal("0")
    revenue_share_pct: Optional[Decimal] = None
    notes: Optional[str] = None

class AudioDistributionUpdate(BaseModel):
    music_label: Optional[str] = None
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    contract_value: Optional[Decimal] = None
    revenue_share_pct: Optional[Decimal] = None
    collected_amount: Optional[Decimal] = None
    outstanding: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class AudioDistributionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    music_label: str
    territory: Optional[str] = None
    language: Optional[str] = None
    agreement_ref: Optional[str] = None
    contract_value: Decimal
    revenue_share_pct: Optional[Decimal] = None
    collected_amount: Decimal
    outstanding: Decimal
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Receivables ────────────────────────────────────────────────────────────

class ReceivableCreate(BaseModel):
    project_id: UUID
    source_type: str
    source_id: Optional[str] = None
    customer: str
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Decimal
    notes: Optional[str] = None

class ReceivableUpdate(BaseModel):
    customer: Optional[str] = None
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Optional[Decimal] = None
    received_amount: Optional[Decimal] = None
    outstanding_amount: Optional[Decimal] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class ReceivableResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    source_type: str
    source_id: Optional[str] = None
    customer: str
    invoice_number: Optional[str] = None
    invoice_date: Optional[date] = None
    due_date: Optional[date] = None
    amount: Decimal
    received_amount: Decimal
    outstanding_amount: Decimal
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Receivable Payments ────────────────────────────────────────────────────

class ReceivablePaymentCreate(BaseModel):
    receivable_id: UUID
    amount: Decimal
    payment_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None

class ReceivablePaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    receivable_id: UUID
    amount: Decimal
    payment_date: date
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime

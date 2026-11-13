"""Crew schemas: Members, Assignments, Remuneration, Payments."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Crew Member
# ---------------------------------------------------------------------------

class CrewMemberBase(BaseModel):
    project_id: UUID
    name: str
    department: str
    role: str
    email: Optional[str] = None
    phone: Optional[str] = None
    contract_status: str = "pending"
    day_rate: float = 0
    total_days: int = 0
    notes: Optional[str] = None


class CrewMemberCreate(CrewMemberBase):
    pass


class CrewMemberUpdate(BaseModel):
    project_id: Optional[UUID] = None
    name: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    contract_status: Optional[str] = None
    day_rate: Optional[float] = None
    total_days: Optional[int] = None
    notes: Optional[str] = None


class CrewMemberResponse(CrewMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Crew Assignment
# ---------------------------------------------------------------------------

class CrewAssignmentBase(BaseModel):
    crew_member_id: UUID
    project_id: UUID
    department: str
    role: str
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class CrewAssignmentCreate(CrewAssignmentBase):
    pass


class CrewAssignmentResponse(CrewAssignmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Remuneration Agreement
# ---------------------------------------------------------------------------

class RemunerationAgreementBase(BaseModel):
    crew_member_id: UUID
    project_id: UUID
    rate_type: str
    rate_amount: float
    total_days: int
    total_payable: float
    payment_schedule: Optional[str] = None


class RemunerationAgreementCreate(RemunerationAgreementBase):
    pass


class RemunerationAgreementResponse(RemunerationAgreementBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Crew Payment
# ---------------------------------------------------------------------------

class CrewPaymentBase(BaseModel):
    crew_member_id: UUID
    project_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    status: str = "pending"
    notes: Optional[str] = None


class CrewPaymentCreate(CrewPaymentBase):
    pass


class CrewPaymentResponse(CrewPaymentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime

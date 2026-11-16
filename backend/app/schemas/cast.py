"""Cast schemas: Members, Contracts, Candidates, Character Profiles."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Cast Member
# ---------------------------------------------------------------------------

class CastMemberBase(BaseModel):
    project_id: UUID
    name: str
    character: str
    character_description: Optional[str] = None
    category: str = "supporting"
    email: Optional[str] = None
    phone: Optional[str] = None
    agency: Optional[str] = None
    languages: Optional[list[str]] = None
    contract_status: str = "pending"
    total_fee: float = 0
    notes: Optional[str] = None


class CastMemberCreate(CastMemberBase):
    pass


class CastMemberUpdate(BaseModel):
    project_id: Optional[UUID] = None
    name: Optional[str] = None
    character: Optional[str] = None
    character_description: Optional[str] = None
    category: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    agency: Optional[str] = None
    languages: Optional[list[str]] = None
    contract_status: Optional[str] = None
    total_fee: Optional[float] = None
    notes: Optional[str] = None


class CastMemberResponse(CastMemberBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Cast Contract
# ---------------------------------------------------------------------------

class CastContractBase(BaseModel):
    cast_member_id: UUID
    project_id: UUID
    amount: float
    status: Optional[str] = None
    milestones: Optional[list] = None


class CastContractCreate(CastContractBase):
    pass


class CastContractResponse(CastContractBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Cast Candidate
# ---------------------------------------------------------------------------

class CastCandidateBase(BaseModel):
    project_id: UUID
    character_profile_id: Optional[UUID] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    status: str = "pending"
    audition_date: Optional[date] = None
    notes: Optional[str] = None


class CastCandidateCreate(CastCandidateBase):
    pass


class CastCandidateResponse(CastCandidateBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None


# ---------------------------------------------------------------------------
# Character Profile
# ---------------------------------------------------------------------------

class CharacterProfileBase(BaseModel):
    project_id: UUID
    name: str
    description: Optional[str] = None
    tier: Optional[str] = None
    linked_cast_ids: Optional[list] = None


class CharacterProfileCreate(CharacterProfileBase):
    pass


class CharacterProfileResponse(CharacterProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: Optional[datetime] = None

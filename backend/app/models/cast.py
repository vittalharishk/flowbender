"""Cast and Casting models: CastMember, CastContract, CastCandidate, etc."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    func,
)
from .compat import PortableUUID, PortableJSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "CastMember",
    "CastContract",
    "CastCandidate",
    "CharacterProfile",
    "ArtistAvailability",
    "CastDecisionLogEntry",
]


class CastMember(Base):
    __tablename__ = "cast_members"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    character: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    character_description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    avatar_url: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    initials: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    agency: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    languages: Mapped[Optional[list]] = mapped_column(PortableJSON(), nullable=True)
    contract_status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    payment_status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    total_fee: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True
    )
    paid_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True, server_default="0"
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    joined_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="cast_members")  # noqa: F821
    contracts: Mapped[list[CastContract]] = relationship(
        back_populates="cast_member", cascade="all, delete-orphan"
    )
    availabilities: Mapped[list[ArtistAvailability]] = relationship(
        back_populates="cast_member", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_cast_members_organization_id", "organization_id"),
        Index("ix_cast_members_project_id", "project_id"),
    )


class CastContract(Base):
    __tablename__ = "cast_contracts"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    cast_member_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("cast_members.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True
    )
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    milestones: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    # Relationships
    cast_member: Mapped[CastMember] = relationship(back_populates="contracts")

    __table_args__ = (
        Index("ix_cast_contracts_organization_id", "organization_id"),
        Index("ix_cast_contracts_cast_member_id", "cast_member_id"),
    )


class CharacterProfile(Base):
    __tablename__ = "character_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    tier: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    linked_cast_ids: Mapped[Optional[list]] = mapped_column(PortableJSON(), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    candidates: Mapped[list[CastCandidate]] = relationship(
        back_populates="character_profile"
    )

    __table_args__ = (
        Index("ix_character_profiles_organization_id", "organization_id"),
        Index("ix_character_profiles_project_id", "project_id"),
    )


class CastCandidate(Base):
    __tablename__ = "cast_candidates"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    character_profile_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(),
        ForeignKey("character_profiles.id", ondelete="SET NULL"),
        nullable=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    audition_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    character_profile: Mapped[Optional[CharacterProfile]] = relationship(
        back_populates="candidates"
    )
    decision_logs: Mapped[list[CastDecisionLogEntry]] = relationship(
        back_populates="candidate"
    )

    __table_args__ = (
        Index("ix_cast_candidates_organization_id", "organization_id"),
        Index("ix_cast_candidates_project_id", "project_id"),
    )


class ArtistAvailability(Base):
    __tablename__ = "artist_availabilities"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    cast_member_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("cast_members.id", ondelete="CASCADE"),
        nullable=False,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    # Relationships
    cast_member: Mapped[CastMember] = relationship(back_populates="availabilities")

    __table_args__ = (
        Index("ix_artist_availabilities_organization_id", "organization_id"),
        Index("ix_artist_availabilities_cast_member_id", "cast_member_id"),
        Index("ix_artist_availabilities_date", "date"),
    )


class CastDecisionLogEntry(Base):
    __tablename__ = "cast_decision_log_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    candidate_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("cast_candidates.id", ondelete="CASCADE"),
        nullable=False,
    )
    decision: Mapped[str] = mapped_column(String(100), nullable=False)
    decided_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    candidate: Mapped[CastCandidate] = relationship(back_populates="decision_logs")

    __table_args__ = (
        Index("ix_cast_decision_log_organization_id", "organization_id"),
        Index("ix_cast_decision_log_candidate_id", "candidate_id"),
    )

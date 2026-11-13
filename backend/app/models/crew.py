"""Crew models: CrewMember, CrewAssignment, RemunerationAgreement, CrewPaymentRecord."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import JSON as JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "CrewMember",
    "CrewAssignment",
    "RemunerationAgreement",
    "CrewPaymentRecord",
]


class CrewMember(Base):
    __tablename__ = "crew_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    initials: Mapped[Optional[str]] = mapped_column(String(10), nullable=True)
    profile_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    department: Mapped[Optional[str]] = mapped_column(
        Enum(
            "direction",
            "production",
            "camera",
            "art",
            "costume",
            "makeup",
            "sound",
            "lighting",
            "vfx",
            "editing",
            "di",
            "dubbing",
            "production-design",
            "transport",
            "accounts",
            "publicity",
            name="crew_department_enum",
        ),
        nullable=True,
    )
    role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    agency: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contract_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    payment_status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    day_rate: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True
    )
    total_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    days_worked: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, server_default="0"
    )
    total_paid: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True, server_default="0"
    )
    availability: Mapped[Optional[str]] = mapped_column(
        Enum(
            "available",
            "on-set",
            "on-leave",
            "unavailable",
            name="crew_availability_enum",
        ),
        nullable=True,
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
    project: Mapped["Project"] = relationship(back_populates="crew_members")  # noqa: F821
    assignments: Mapped[list[CrewAssignment]] = relationship(
        back_populates="crew_member", cascade="all, delete-orphan"
    )
    remuneration_agreements: Mapped[list[RemunerationAgreement]] = relationship(
        back_populates="crew_member", cascade="all, delete-orphan"
    )
    payment_records: Mapped[list[CrewPaymentRecord]] = relationship(
        back_populates="crew_member", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_crew_members_organization_id", "organization_id"),
        Index("ix_crew_members_project_id", "project_id"),
        Index("ix_crew_members_department", "department"),
    )


class CrewAssignment(Base):
    __tablename__ = "crew_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    crew_member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crew_members.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    role: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    crew_member: Mapped[CrewMember] = relationship(back_populates="assignments")

    __table_args__ = (
        Index("ix_crew_assignments_organization_id", "organization_id"),
        Index("ix_crew_assignments_crew_member_id", "crew_member_id"),
    )


class RemunerationAgreement(Base):
    __tablename__ = "remuneration_agreements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    crew_member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crew_members.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    rate_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    rate_amount: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True
    )
    total_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_payable: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True
    )
    payment_schedule: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True)

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
    crew_member: Mapped[CrewMember] = relationship(
        back_populates="remuneration_agreements"
    )

    __table_args__ = (
        Index("ix_remuneration_agreements_organization_id", "organization_id"),
        Index("ix_remuneration_agreements_crew_member_id", "crew_member_id"),
    )


class CrewPaymentRecord(Base):
    __tablename__ = "crew_payment_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    crew_member_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("crew_members.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    amount: Mapped[Decimal] = mapped_column(
        Numeric(precision=18, scale=2), nullable=False
    )
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    crew_member: Mapped[CrewMember] = relationship(back_populates="payment_records")

    __table_args__ = (
        Index("ix_crew_payment_records_organization_id", "organization_id"),
        Index("ix_crew_payment_records_crew_member_id", "crew_member_id"),
    )

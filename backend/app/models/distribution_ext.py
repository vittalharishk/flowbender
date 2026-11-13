"""Distribution expansion models: Territories, Digital, Satellite, Audio, Receivables."""

from __future__ import annotations

import uuid
from datetime import datetime, date
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Numeric,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .compat import PortableUUID, PortableJSON

__all__ = [
    "DistributionTerritory",
    "DigitalDistribution",
    "SatelliteDistribution",
    "AudioDistribution",
    "Receivable",
    "ReceivablePayment",
]


class DistributionTerritory(Base):
    __tablename__ = "distribution_territories"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    territory: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    region: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    rights_category: Mapped[str] = mapped_column(String(100), nullable=False)
    exclusivity: Mapped[str] = mapped_column(String(50), nullable=False, server_default="non-exclusive")
    rights_holder: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    licensee: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    restrictions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revenue_terms: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_dist_territory_org", "organization_id"),
        Index("ix_dist_territory_project", "project_id"),
    )


class DigitalDistribution(Base):
    __tablename__ = "digital_distributions"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    platform: Mapped[str] = mapped_column(String(100), nullable=False)
    territory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    license_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    license_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    contract_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    minimum_guarantee: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    revenue_share_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    actual_receipts: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    outstanding: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    deliverables: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_digital_dist_org", "organization_id"),
        Index("ix_digital_dist_project", "project_id"),
    )


class SatelliteDistribution(Base):
    __tablename__ = "satellite_distributions"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    broadcaster: Mapped[str] = mapped_column(String(255), nullable=False)
    territory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    rights_start: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    rights_end: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    contract_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    telecast_dates: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    invoiced_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    collected_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    outstanding: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_satellite_dist_org", "organization_id"),
        Index("ix_satellite_dist_project", "project_id"),
    )


class AudioDistribution(Base):
    __tablename__ = "audio_distributions"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    music_label: Mapped[str] = mapped_column(String(255), nullable=False)
    territory: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contract_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    revenue_share_pct: Mapped[Optional[Decimal]] = mapped_column(Numeric(5, 2), nullable=True)
    collected_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    outstanding: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_audio_dist_org", "organization_id"),
        Index("ix_audio_dist_project", "project_id"),
    )


class Receivable(Base):
    """Consolidated receivables across all income sources."""
    __tablename__ = "receivables"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    customer: Mapped[str] = mapped_column(String(255), nullable=False)
    invoice_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    invoice_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    received_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="open")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    payments: Mapped[list[ReceivablePayment]] = relationship(back_populates="receivable", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_receivables_org", "organization_id"),
        Index("ix_receivables_project", "project_id"),
        Index("ix_receivables_source", "source_type", "source_id"),
    )


class ReceivablePayment(Base):
    __tablename__ = "receivable_payments"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    receivable_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("receivables.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    receivable: Mapped[Receivable] = relationship(back_populates="payments")

    __table_args__ = (Index("ix_recv_payments_recv", "receivable_id"),)

from __future__ import annotations

"""Distribution models for Flowbender."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSON, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "RightsDeal",
    "DistributionAgreement",
    "DistributionRelease",
    "DistributionRevenue",
    "DistributionSettlement",
]


# ---------------------------------------------------------------------------
# Rights & Deals
# ---------------------------------------------------------------------------


class RightsDeal(Base):
    __tablename__ = "rights_deals"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False
    )
    territory: Mapped[Optional[str]] = mapped_column(String(100))
    distributor: Mapped[Optional[str]] = mapped_column(String(255))
    rights_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # theatrical / satellite / digital / audio / dubbed / remake / broadcast / ancillary
    status: Mapped[str] = mapped_column(
        String(30), default="open", nullable=False
    )  # open / negotiating / signed / expired / terminated / closed
    minimum_guarantee: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    advance_received: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    delivery_status: Mapped[str] = mapped_column(
        String(20), default="pending", nullable=False
    )  # pending / partial / complete
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_rights_deals_org", "organization_id"),
        Index("ix_rights_deals_project", "project_id"),
        Index("ix_rights_deals_status", "status"),
        Index("ix_rights_deals_territory", "territory"),
    )


# ---------------------------------------------------------------------------
# Agreements
# ---------------------------------------------------------------------------


class DistributionAgreement(Base):
    __tablename__ = "distribution_agreements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False
    )
    distributor_name: Mapped[Optional[str]] = mapped_column(String(255))
    channel: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # theatrical / ott / satellite / digital / audio
    territories: Mapped[Optional[dict]] = mapped_column(JSON)
    languages: Mapped[Optional[dict]] = mapped_column(JSON)
    agreement_value: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    advance_paid: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False
    )  # draft / negotiating / pending-approval / active / expired / terminated / cancelled
    revenue_sharing: Mapped[Optional[dict]] = mapped_column(JSON)
    payment_terms: Mapped[Optional[str]] = mapped_column(Text)
    document_urls: Mapped[Optional[dict]] = mapped_column(JSON)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    releases: Mapped[list["DistributionRelease"]] = relationship(back_populates="agreement")
    revenues: Mapped[list["DistributionRevenue"]] = relationship(back_populates="agreement")
    settlements: Mapped[list["DistributionSettlement"]] = relationship(back_populates="agreement")

    __table_args__ = (
        Index("ix_distribution_agreements_org", "organization_id"),
        Index("ix_distribution_agreements_project", "project_id"),
        Index("ix_distribution_agreements_status", "status"),
        Index("ix_distribution_agreements_channel", "channel"),
    )


# ---------------------------------------------------------------------------
# Releases
# ---------------------------------------------------------------------------


class DistributionRelease(Base):
    __tablename__ = "distribution_releases"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False
    )
    agreement_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distribution_agreements.id"), nullable=True
    )
    release_date: Mapped[Optional[date]] = mapped_column(Date)
    territory: Mapped[Optional[str]] = mapped_column(String(100))
    release_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # theatrical / ott / satellite / digital
    status: Mapped[str] = mapped_column(
        String(30), default="planned", nullable=False
    )  # planned / confirmed / released / completed / cancelled
    screens_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    agreement: Mapped[Optional["DistributionAgreement"]] = relationship(
        back_populates="releases"
    )
    revenues: Mapped[list["DistributionRevenue"]] = relationship(back_populates="release")

    __table_args__ = (
        Index("ix_distribution_releases_org", "organization_id"),
        Index("ix_distribution_releases_project", "project_id"),
        Index("ix_distribution_releases_agreement", "agreement_id"),
        Index("ix_distribution_releases_status", "status"),
    )


# ---------------------------------------------------------------------------
# Revenue
# ---------------------------------------------------------------------------


class DistributionRevenue(Base):
    __tablename__ = "distribution_revenues"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False
    )
    agreement_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distribution_agreements.id"), nullable=True
    )
    release_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distribution_releases.id"), nullable=True
    )
    source: Mapped[Optional[str]] = mapped_column(String(100))
    territory: Mapped[Optional[str]] = mapped_column(String(100))
    amount: Mapped[Decimal] = mapped_column(Numeric(16, 2), nullable=False)
    collection_date: Mapped[Optional[date]] = mapped_column(Date)
    gst_amount: Mapped[Decimal] = mapped_column(Numeric(16, 2), default=0)
    net_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    payment_status: Mapped[str] = mapped_column(
        String(30), default="pending", nullable=False
    )  # pending / partial / received / overdue
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    agreement: Mapped[Optional["DistributionAgreement"]] = relationship(
        back_populates="revenues"
    )
    release: Mapped[Optional["DistributionRelease"]] = relationship(
        back_populates="revenues"
    )

    __table_args__ = (
        Index("ix_distribution_revenues_org", "organization_id"),
        Index("ix_distribution_revenues_project", "project_id"),
        Index("ix_distribution_revenues_agreement", "agreement_id"),
        Index("ix_distribution_revenues_payment_status", "payment_status"),
    )


# ---------------------------------------------------------------------------
# Settlements
# ---------------------------------------------------------------------------


class DistributionSettlement(Base):
    __tablename__ = "distribution_settlements"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False
    )
    agreement_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distribution_agreements.id"), nullable=True
    )
    counterparty_name: Mapped[Optional[str]] = mapped_column(String(255))
    settlement_type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # producer / distributor / exhibitor
    period_start: Mapped[Optional[date]] = mapped_column(Date)
    period_end: Mapped[Optional[date]] = mapped_column(Date)
    gross_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    deductions: Mapped[Optional[dict]] = mapped_column(JSON)
    net_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    advance_adjusted: Mapped[Decimal] = mapped_column(Numeric(16, 2), default=0)
    amount_payable: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(16, 2), default=0)
    payment_status: Mapped[str] = mapped_column(
        String(30), default="pending", nullable=False
    )  # pending / partial / paid / disputed
    payment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    agreement: Mapped[Optional["DistributionAgreement"]] = relationship(
        back_populates="settlements"
    )

    __table_args__ = (
        Index("ix_distribution_settlements_org", "organization_id"),
        Index("ix_distribution_settlements_project", "project_id"),
        Index("ix_distribution_settlements_agreement", "agreement_id"),
        Index("ix_distribution_settlements_payment_status", "payment_status"),
    )

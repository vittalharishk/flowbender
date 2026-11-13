"""Business management models: Investors, Loans, Branding, Burn, Tranches, OST Receivables."""

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
    "Investor",
    "InvestorProject",
    "InvestmentTransaction",
    "Loan",
    "LoanRepayment",
    "BrandingDeal",
    "BrandingDeliverable",
    "BrandingPayment",
    "FundingTranche",
    "OstReceivable",
    "OstPayment",
    "BurnRecord",
]


class Investor(Base):
    __tablename__ = "investors"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    investor_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default="individual")
    company: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    address: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    projects: Mapped[list[InvestorProject]] = relationship(back_populates="investor", cascade="all, delete-orphan")

    __table_args__ = (Index("ix_investors_org", "organization_id"),)


class InvestorProject(Base):
    __tablename__ = "investor_projects"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    investor_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("investors.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    investment_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    committed_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    received_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    returned_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    investment_type: Mapped[str] = mapped_column(String(50), nullable=False, server_default="equity")
    investment_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="proposed")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    investor: Mapped[Investor] = relationship(back_populates="projects")

    __table_args__ = (
        UniqueConstraint("investor_id", "project_id", name="uq_investor_project"),
        Index("ix_investor_projects_project", "project_id"),
    )


class InvestmentTransaction(Base):
    __tablename__ = "investment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    investor_project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("investor_projects.id", ondelete="CASCADE"), nullable=False)
    transaction_type: Mapped[str] = mapped_column(String(50), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (Index("ix_invest_txn_ip", "investor_project_id"),)


class Loan(Base):
    __tablename__ = "loans"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)
    lender: Mapped[str] = mapped_column(String(255), nullable=False)
    borrower: Mapped[str] = mapped_column(String(255), nullable=False)
    principal: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    annual_interest_rate: Mapped[Decimal] = mapped_column(Numeric(8, 4), nullable=False)
    interest_method: Mapped[str] = mapped_column(String(50), nullable=False, server_default="simple")
    compounding_frequency: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    maturity_date: Mapped[date] = mapped_column(Date, nullable=False)
    outstanding_principal: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    accrued_interest: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    paid_interest: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    collateral: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    repayments: Mapped[list[LoanRepayment]] = relationship(back_populates="loan", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_loans_org", "organization_id"),
        Index("ix_loans_project", "project_id"),
    )


class LoanRepayment(Base):
    __tablename__ = "loan_repayments"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    loan_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("loans.id", ondelete="CASCADE"), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    principal_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    interest_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    total_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    loan: Mapped[Loan] = relationship(back_populates="repayments")

    __table_args__ = (Index("ix_loan_repayments_loan", "loan_id"),)


class BrandingDeal(Base):
    __tablename__ = "branding_deals"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    brand: Mapped[str] = mapped_column(String(255), nullable=False)
    placement_type: Mapped[str] = mapped_column(String(100), nullable=False)
    scene_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    agreement_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    invoiced_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    received_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="draft")
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    deliverables: Mapped[list[BrandingDeliverable]] = relationship(back_populates="deal", cascade="all, delete-orphan")
    payments: Mapped[list[BrandingPayment]] = relationship(back_populates="deal", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_branding_org", "organization_id"),
        Index("ix_branding_project", "project_id"),
    )


class BrandingDeliverable(Base):
    __tablename__ = "branding_deliverables"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    deal_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("branding_deals.id", ondelete="CASCADE"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="pending")
    completed_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    deal: Mapped[BrandingDeal] = relationship(back_populates="deliverables")


class BrandingPayment(Base):
    __tablename__ = "branding_payments"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    deal_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("branding_deals.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    deal: Mapped[BrandingDeal] = relationship(back_populates="payments")


class FundingTranche(Base):
    __tablename__ = "funding_tranches"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    funding_source: Mapped[str] = mapped_column(String(255), nullable=False)
    investor_id: Mapped[Optional[uuid.UUID]] = mapped_column(PortableUUID(), ForeignKey("investors.id", ondelete="SET NULL"), nullable=True)
    loan_id: Mapped[Optional[uuid.UUID]] = mapped_column(PortableUUID(), ForeignKey("loans.id", ondelete="SET NULL"), nullable=True)
    tranche_number: Mapped[int] = mapped_column(nullable=False)
    planned_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    approved_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    released_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    received_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    release_conditions: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    planned_release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    actual_release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="planned")
    supporting_docs: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_tranches_org", "organization_id"),
        Index("ix_tranches_project", "project_id"),
    )


class OstReceivable(Base):
    __tablename__ = "ost_receivables"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    music_label: Mapped[str] = mapped_column(String(255), nullable=False)
    agreement_ref: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    contract_value: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    invoiced_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    received_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    outstanding_amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    payments: Mapped[list[OstPayment]] = relationship(back_populates="receivable", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_ost_org", "organization_id"),
        Index("ix_ost_project", "project_id"),
    )


class OstPayment(Base):
    __tablename__ = "ost_payments"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    receivable_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("ost_receivables.id", ondelete="CASCADE"), nullable=False)
    amount: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False)
    payment_date: Mapped[date] = mapped_column(Date, nullable=False)
    milestone: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    receivable: Mapped[OstReceivable] = relationship(back_populates="payments")


class BurnRecord(Base):
    __tablename__ = "burn_records"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    department: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    budget: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    actual_spend: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    committed_spend: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    variance: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    forecast_completion_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(18, 2), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        Index("ix_burn_org", "organization_id"),
        Index("ix_burn_project", "project_id"),
    )

from __future__ import annotations

"""Finance models for Flowbender."""

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
from .compat import PortableUUID, PortableJSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "ProjectBudget",
    "DepartmentBudget",
    "BudgetRevision",
    "BudgetLineItem",
    "PurchaseOrder",
    "Vendor",
    "InsurancePolicy",
    "InsuranceClaim",
    "ExpenseItem",
    "PayrollEntry",
]


# ---------------------------------------------------------------------------
# Budgets
# ---------------------------------------------------------------------------


class ProjectBudget(Base):
    __tablename__ = "project_budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    total_budget: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False
    )  # draft / submitted / dept-approved / finance-approved / producer-approved
    approved_by: Mapped[Optional[str]] = mapped_column(String(255))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    department_budgets: Mapped[list["DepartmentBudget"]] = relationship(
        back_populates="project_budget"
    )
    revisions: Mapped[list["BudgetRevision"]] = relationship(back_populates="project_budget")

    __table_args__ = (
        Index("ix_project_budgets_org", "organization_id"),
        Index("ix_project_budgets_project", "project_id"),
        Index("ix_project_budgets_status", "status"),
    )


class DepartmentBudget(Base):
    __tablename__ = "department_budgets"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_budget_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("project_budgets.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    department: Mapped[Optional[str]] = mapped_column(String(100))
    allocated: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    committed: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    spent: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    project_budget: Mapped["ProjectBudget"] = relationship(
        back_populates="department_budgets"
    )

    __table_args__ = (
        Index("ix_department_budgets_org", "organization_id"),
        Index("ix_department_budgets_budget", "project_budget_id"),
        Index("ix_department_budgets_project", "project_id"),
        Index("ix_department_budgets_dept", "department"),
    )


class BudgetRevision(Base):
    __tablename__ = "budget_revisions"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_budget_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("project_budgets.id"), nullable=False
    )
    revision_number: Mapped[int] = mapped_column(Integer, nullable=False)
    previous_total: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    new_total: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    reason: Mapped[Optional[str]] = mapped_column(Text)
    approved_by: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    project_budget: Mapped["ProjectBudget"] = relationship(back_populates="revisions")

    __table_args__ = (
        Index("ix_budget_revisions_org", "organization_id"),
        Index("ix_budget_revisions_budget", "project_budget_id"),
    )


class BudgetLineItem(Base):
    __tablename__ = "budget_line_items"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    category: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    allocated: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    committed: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    spent: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_budget_line_items_org", "organization_id"),
        Index("ix_budget_line_items_project", "project_id"),
        Index("ix_budget_line_items_category", "category"),
    )


# ---------------------------------------------------------------------------
# Purchase Orders & Vendors
# ---------------------------------------------------------------------------


class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    po_number: Mapped[Optional[str]] = mapped_column(String(100))
    vendor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(), ForeignKey("vendors.id"), nullable=True
    )
    vendor_name: Mapped[Optional[str]] = mapped_column(String(255))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    items: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    subtotal: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    discount_percent: Mapped[float] = mapped_column(Float, default=0)
    discount_amount: Mapped[Decimal] = mapped_column(Numeric(16, 2), default=0)
    tax_amount: Mapped[Decimal] = mapped_column(Numeric(16, 2), default=0)
    total_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False
    )  # draft / submitted / approved / rejected / completed / cancelled
    approved_by: Mapped[Optional[str]] = mapped_column(String(255))
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    delivery_date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vendor: Mapped[Optional["Vendor"]] = relationship(back_populates="purchase_orders")

    __table_args__ = (
        Index("ix_purchase_orders_org", "organization_id"),
        Index("ix_purchase_orders_project", "project_id"),
        Index("ix_purchase_orders_vendor", "vendor_id"),
        Index("ix_purchase_orders_status", "status"),
        Index("ix_purchase_orders_po_number", "po_number"),
    )


class Vendor(Base):
    __tablename__ = "vendors"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    contact_person: Mapped[Optional[str]] = mapped_column(String(255))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    address: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    gst_number: Mapped[Optional[str]] = mapped_column(String(50))
    pan_number: Mapped[Optional[str]] = mapped_column(String(50))
    bank_details: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    payment_terms: Mapped[Optional[str]] = mapped_column(String(255))
    credit_limit: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    outstanding_balance: Mapped[Decimal] = mapped_column(Numeric(16, 2), default=0)
    status: Mapped[str] = mapped_column(
        String(30), default="active", nullable=False
    )  # active / inactive / blacklisted
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    purchase_orders: Mapped[list["PurchaseOrder"]] = relationship(back_populates="vendor")

    __table_args__ = (
        Index("ix_vendors_org", "organization_id"),
        Index("ix_vendors_name", "name"),
        Index("ix_vendors_status", "status"),
    )


# ---------------------------------------------------------------------------
# Insurance
# ---------------------------------------------------------------------------


class InsurancePolicy(Base):
    __tablename__ = "insurance_policies"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    policy_number: Mapped[Optional[str]] = mapped_column(String(100))
    provider: Mapped[Optional[str]] = mapped_column(String(255))
    type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # equipment / cast / crew / location / vehicle / production / liability / other
    coverage_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    premium: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    deductible: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[str] = mapped_column(
        String(30), default="active", nullable=False
    )  # active / expired / cancelled / claimed
    beneficiary: Mapped[Optional[str]] = mapped_column(String(255))
    document_url: Mapped[Optional[str]] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    claims: Mapped[list["InsuranceClaim"]] = relationship(back_populates="policy")

    __table_args__ = (
        Index("ix_insurance_policies_org", "organization_id"),
        Index("ix_insurance_policies_project", "project_id"),
        Index("ix_insurance_policies_status", "status"),
    )


class InsuranceClaim(Base):
    __tablename__ = "insurance_claims"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    policy_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("insurance_policies.id"), nullable=False
    )
    claim_number: Mapped[Optional[str]] = mapped_column(String(100))
    incident_date: Mapped[Optional[date]] = mapped_column(Date)
    description: Mapped[Optional[str]] = mapped_column(Text)
    claim_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    approved_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2), nullable=True)
    status: Mapped[str] = mapped_column(
        String(30), default="filed", nullable=False
    )  # filed / under-review / approved / rejected / settled
    filed_by: Mapped[Optional[str]] = mapped_column(String(255))
    filed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    policy: Mapped["InsurancePolicy"] = relationship(back_populates="claims")

    __table_args__ = (
        Index("ix_insurance_claims_org", "organization_id"),
        Index("ix_insurance_claims_policy", "policy_id"),
        Index("ix_insurance_claims_status", "status"),
    )


# ---------------------------------------------------------------------------
# Expenses & Payroll
# ---------------------------------------------------------------------------


class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    category: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    vendor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(), ForeignKey("vendors.id"), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default="pending", nullable=False
    )  # pending / approved / paid / rejected
    receipt_url: Mapped[Optional[str]] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_expense_items_org", "organization_id"),
        Index("ix_expense_items_project", "project_id"),
        Index("ix_expense_items_status", "status"),
    )


class PayrollEntry(Base):
    __tablename__ = "payroll_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    person_id: Mapped[Optional[str]] = mapped_column(String(100))
    person_type: Mapped[Optional[str]] = mapped_column(String(50))
    name: Mapped[Optional[str]] = mapped_column(String(255))
    department: Mapped[Optional[str]] = mapped_column(String(100))
    gross_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    deductions: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    net_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(16, 2))
    payment_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[Optional[str]] = mapped_column(String(50), default="pending")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_payroll_entries_org", "organization_id"),
        Index("ix_payroll_entries_project", "project_id"),
        Index("ix_payroll_entries_person", "person_id"),
    )

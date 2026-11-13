from __future__ import annotations

"""Production, Pre-Production, and Calendar models."""

import uuid
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from .compat import PortableUUID, PortableJSON
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base

__all__ = [
    "ProductionTask",
    "PreProdChecklistItem",
    "DprReport",
    "CalendarEvent",
]


class ProductionTask(Base):
    __tablename__ = "production_tasks"

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
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="pending",
    )
    priority: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="medium",
    )
    assigned_to: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_production_tasks_org_id", "organization_id"),
        Index("ix_production_tasks_project_id", "project_id"),
        Index("ix_production_tasks_status", "status"),
        Index("ix_production_tasks_org_project", "organization_id", "project_id"),
    )


class PreProdChecklistItem(Base):
    __tablename__ = "pre_prod_checklist_items"

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
    category: Mapped[str] = mapped_column(String(255), nullable=False)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    is_completed: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    completed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    sort_order: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_pre_prod_checklist_org_id", "organization_id"),
        Index("ix_pre_prod_checklist_project_id", "project_id"),
        Index("ix_pre_prod_checklist_org_project", "organization_id", "project_id"),
    )


class DprReport(Base):
    __tablename__ = "dpr_reports"

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
    shoot_day_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(),
        ForeignKey("shoot_days.id", ondelete="SET NULL"),
        nullable=True,
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="draft",
    )
    scenes_planned: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    scenes_completed: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    cast_present: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    crew_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    weather: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    delays: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    submitted_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    submitted_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_dpr_reports_org_id", "organization_id"),
        Index("ix_dpr_reports_project_id", "project_id"),
        Index("ix_dpr_reports_date", "date"),
        Index("ix_dpr_reports_org_project", "organization_id", "project_id"),
    )


class CalendarEvent(Base):
    __tablename__ = "calendar_events"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    category: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="general",
    )
    date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    all_day: Mapped[bool] = mapped_column(
        Boolean, nullable=False, server_default="false"
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="scheduled",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    __table_args__ = (
        Index("ix_calendar_events_org_id", "organization_id"),
        Index("ix_calendar_events_project_id", "project_id"),
        Index("ix_calendar_events_date", "date"),
        Index("ix_calendar_events_category", "category"),
        Index("ix_calendar_events_org_project", "organization_id", "project_id"),
    )

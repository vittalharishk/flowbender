from __future__ import annotations

"""Schedule & Production scheduling models."""

import uuid
from datetime import date, datetime, time
from typing import Any, Optional

from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    Time,
    func,
)
from .compat import PortableUUID, PortableJSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "ScheduleEntry",
    "ShootDay",
    "CallSheet",
    "AttendanceRecord",
    "CateringAdjustment",
]


class ScheduleEntry(Base):
    __tablename__ = "schedule_entries"

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
    date: Mapped[date] = mapped_column(Date, nullable=False)
    call_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    scenes: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    shoot_day_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_shoot_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    call_sheet_status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
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
        Index("ix_schedule_entries_org_id", "organization_id"),
        Index("ix_schedule_entries_project_id", "project_id"),
        Index("ix_schedule_entries_date", "date"),
        Index("ix_schedule_entries_org_project", "organization_id", "project_id"),
    )


class ShootDay(Base):
    __tablename__ = "shoot_days"

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
    day_number: Mapped[int] = mapped_column(Integer, nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="scheduled",
    )
    scenes_planned: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    scenes_completed: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    weather: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )

    # Relationships
    call_sheets: Mapped[list["CallSheet"]] = relationship(
        back_populates="shoot_day", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_shoot_days_org_id", "organization_id"),
        Index("ix_shoot_days_project_id", "project_id"),
        Index("ix_shoot_days_date", "date"),
        Index("ix_shoot_days_org_project", "organization_id", "project_id"),
    )


class CallSheet(Base):
    __tablename__ = "call_sheets"

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
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    date: Mapped[date] = mapped_column(Date, nullable=False)
    call_time: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="draft",
    )
    cast_call: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    crew_call: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    transport: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    catering: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    props: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    safety: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    special_notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    revision_number: Mapped[int] = mapped_column(
        Integer, nullable=False, server_default="0"
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

    # Relationships
    shoot_day: Mapped[Optional["ShootDay"]] = relationship(
        back_populates="call_sheets", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_call_sheets_org_id", "organization_id"),
        Index("ix_call_sheets_project_id", "project_id"),
        Index("ix_call_sheets_date", "date"),
        Index("ix_call_sheets_org_project", "organization_id", "project_id"),
    )


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

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
    date: Mapped[date] = mapped_column(Date, nullable=False)
    person_id: Mapped[str] = mapped_column(String(255), nullable=False)
    person_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )
    check_in_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    check_out_time: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_attendance_records_org_id", "organization_id"),
        Index("ix_attendance_records_project_id", "project_id"),
        Index("ix_attendance_records_date", "date"),
        Index(
            "ix_attendance_records_org_project", "organization_id", "project_id"
        ),
        Index("ix_attendance_records_person", "person_id", "date"),
    )


class CateringAdjustment(Base):
    __tablename__ = "catering_adjustments"

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
    date: Mapped[date] = mapped_column(Date, nullable=False)
    adjustment_type: Mapped[str] = mapped_column(String(255), nullable=False)
    count: Mapped[int] = mapped_column(Integer, nullable=False)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_catering_adjustments_org_id", "organization_id"),
        Index("ix_catering_adjustments_project_id", "project_id"),
        Index("ix_catering_adjustments_date", "date"),
    )

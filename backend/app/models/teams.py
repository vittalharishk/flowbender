"""Teams and department management models."""

from __future__ import annotations

import uuid
from datetime import datetime, date
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .compat import PortableUUID, PortableJSON

__all__ = [
    "Department",
    "TeamMember",
    "TeamProjectAssignment",
    "UserProjectAccess",
    "UserDepartmentAccess",
]


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    members: Mapped[list[TeamMember]] = relationship(back_populates="department", cascade="all, delete-orphan")

    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_dept_org_code"),
        Index("ix_departments_org", "organization_id"),
    )


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(PortableUUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    employee_id: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    designation: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    reporting_manager_id: Mapped[Optional[uuid.UUID]] = mapped_column(PortableUUID(), ForeignKey("team_members.id", ondelete="SET NULL"), nullable=True)
    joining_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    availability: Mapped[str] = mapped_column(String(50), nullable=False, server_default="available")
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="active")
    responsibilities: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    department: Mapped[Department] = relationship(back_populates="members")
    project_assignments: Mapped[list[TeamProjectAssignment]] = relationship(back_populates="member", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_team_members_org", "organization_id"),
        Index("ix_team_members_dept", "department_id"),
    )


class TeamProjectAssignment(Base):
    __tablename__ = "team_project_assignments"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("team_members.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    role_in_project: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    member: Mapped[TeamMember] = relationship(back_populates="project_assignments")

    __table_args__ = (
        UniqueConstraint("member_id", "project_id", name="uq_team_proj_assign"),
        Index("ix_team_proj_assign_project", "project_id"),
    )


class UserProjectAccess(Base):
    """Controls which projects a user can access. Global roles (owner, admin) bypass this."""
    __tablename__ = "user_project_access"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    access_level: Mapped[str] = mapped_column(String(50), nullable=False, server_default="view")
    module_permissions: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    granted_by: Mapped[Optional[uuid.UUID]] = mapped_column(PortableUUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")

    __table_args__ = (
        UniqueConstraint("user_id", "project_id", name="uq_user_project_access"),
        Index("ix_user_project_access_user", "user_id"),
        Index("ix_user_project_access_project", "project_id"),
    )


class UserDepartmentAccess(Base):
    """Controls which departments a user can access."""
    __tablename__ = "user_department_access"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False)
    access_level: Mapped[str] = mapped_column(String(50), nullable=False, server_default="view")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="true")
    granted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    __table_args__ = (
        UniqueConstraint("user_id", "department_id", name="uq_user_dept_access"),
        Index("ix_user_dept_access_user", "user_id"),
    )

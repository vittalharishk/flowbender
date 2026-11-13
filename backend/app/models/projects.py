"""Project model for production tracking."""

from __future__ import annotations

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "Project",
]


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[str] = mapped_column(
        Enum(
            "feature-film",
            "series",
            "short-film",
            "music-video",
            "documentary",
            "commercial",
            name="project_type_enum",
        ),
        nullable=False,
    )
    status: Mapped[str] = mapped_column(
        Enum(
            "development",
            "pre-production",
            "production",
            "post-production",
            "completed",
            "on-hold",
            name="project_status_enum",
        ),
        nullable=False,
        server_default="development",
    )
    genre: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    language: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    director: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    producer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    production_house: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    budget: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True
    )
    spent: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(precision=18, scale=2), nullable=True, server_default="0"
    )

    poster_color: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    poster_image: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    logline: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    shoot_progress: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    total_shoot_days: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completed_shoot_days: Mapped[Optional[int]] = mapped_column(
        Integer, nullable=True, server_default="0"
    )
    next_shoot_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

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
    cast_members: Mapped[list["CastMember"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    crew_members: Mapped[list["CrewMember"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    scripts: Mapped[list["Script"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )
    scenes: Mapped[list["Scene"]] = relationship(  # noqa: F821
        back_populates="project", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_projects_organization_id", "organization_id"),
        Index("ix_projects_status", "status"),
        Index("ix_projects_type", "type"),
    )

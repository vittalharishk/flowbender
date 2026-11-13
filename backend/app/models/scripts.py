"""Script and Scene models."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    func,
)
from .compat import PortableUUID, PortableJSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "Script",
    "ScriptVersion",
    "Scene",
]


class Script(Base):
    __tablename__ = "scripts"

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
    writer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    screenplay_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    dialogues_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    format: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    content: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    scenes: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)

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
    project: Mapped["Project"] = relationship(back_populates="scripts")  # noqa: F821
    versions: Mapped[list[ScriptVersion]] = relationship(
        back_populates="script", cascade="all, delete-orphan"
    )

    __table_args__ = (
        Index("ix_scripts_organization_id", "organization_id"),
        Index("ix_scripts_project_id", "project_id"),
    )


class ScriptVersion(Base):
    __tablename__ = "script_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    script_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("scripts.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    content: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, server_default=func.now()
    )

    # Relationships
    script: Mapped[Script] = relationship(back_populates="versions")

    __table_args__ = (
        Index("ix_script_versions_organization_id", "organization_id"),
        Index("ix_script_versions_script_id", "script_id"),
    )


class Scene(Base):
    __tablename__ = "scenes"

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
    scene_number: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    title: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    time_of_day: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    int_ext: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
    )
    page_count: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    characters: Mapped[Optional[list]] = mapped_column(PortableJSON(), nullable=True)
    props: Mapped[Optional[list]] = mapped_column(PortableJSON(), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

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
    project: Mapped["Project"] = relationship(back_populates="scenes")  # noqa: F821

    __table_args__ = (
        Index("ix_scenes_organization_id", "organization_id"),
        Index("ix_scenes_project_id", "project_id"),
        Index("ix_scenes_scene_number", "scene_number"),
    )

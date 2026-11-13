from __future__ import annotations

"""Equipment, Media, and VFX models."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Any, Optional

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
    "EquipmentItem",
    "EquipmentAllocation",
    "EquipmentMaintenance",
    "CameraCard",
    "StorageDevice",
    "FootageMetadata",
    "MediaAsset",
    "MediaVersion",
    "VfxShot",
    "VfxVersion",
    "VfxReview",
]


# ---------------------------------------------------------------------------
# Equipment
# ---------------------------------------------------------------------------


class EquipmentItem(Base):
    __tablename__ = "equipment_items"

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
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    serial_number: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="available",
    )
    vendor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    purchase_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    purchase_cost: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    allocations: Mapped[list["EquipmentAllocation"]] = relationship(
        back_populates="equipment", lazy="selectin"
    )
    maintenance_records: Mapped[list["EquipmentMaintenance"]] = relationship(
        back_populates="equipment", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_equipment_items_org_id", "organization_id"),
        Index("ix_equipment_items_project_id", "project_id"),
        Index("ix_equipment_items_status", "status"),
        Index("ix_equipment_items_org_project", "organization_id", "project_id"),
    )


class EquipmentAllocation(Base):
    __tablename__ = "equipment_allocations"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    equipment_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("equipment_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("projects.id", ondelete="CASCADE"),
        nullable=False,
    )
    allocated_to: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    allocated_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    return_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    equipment: Mapped["EquipmentItem"] = relationship(
        back_populates="allocations", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_equipment_allocations_org_id", "organization_id"),
        Index("ix_equipment_allocations_equipment_id", "equipment_id"),
        Index("ix_equipment_allocations_project_id", "project_id"),
    )


class EquipmentMaintenance(Base):
    __tablename__ = "equipment_maintenance"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    equipment_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("equipment_items.id", ondelete="CASCADE"),
        nullable=False,
    )
    type: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2), nullable=True)
    date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    next_due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    equipment: Mapped["EquipmentItem"] = relationship(
        back_populates="maintenance_records", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_equipment_maintenance_org_id", "organization_id"),
        Index("ix_equipment_maintenance_equipment_id", "equipment_id"),
    )


# ---------------------------------------------------------------------------
# Camera / Storage
# ---------------------------------------------------------------------------


class CameraCard(Base):
    __tablename__ = "camera_cards"

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
    card_number: Mapped[str] = mapped_column(String(100), nullable=False)
    capacity_gb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    format: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    assigned_to: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    footage: Mapped[list["FootageMetadata"]] = relationship(
        back_populates="camera_card", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_camera_cards_org_id", "organization_id"),
        Index("ix_camera_cards_project_id", "project_id"),
        Index("ix_camera_cards_org_project", "organization_id", "project_id"),
    )


class StorageDevice(Base):
    __tablename__ = "storage_devices"

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
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    capacity_tb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    used_tb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
        Index("ix_storage_devices_org_id", "organization_id"),
        Index("ix_storage_devices_project_id", "project_id"),
        Index("ix_storage_devices_org_project", "organization_id", "project_id"),
    )


# ---------------------------------------------------------------------------
# Footage / Media
# ---------------------------------------------------------------------------


class FootageMetadata(Base):
    __tablename__ = "footage_metadata"

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
    camera_card_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(),
        ForeignKey("camera_cards.id", ondelete="SET NULL"),
        nullable=True,
    )
    scene_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    take_number: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    duration_seconds: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    format: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    fps: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    camera_card: Mapped[Optional["CameraCard"]] = relationship(
        back_populates="footage", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_footage_metadata_org_id", "organization_id"),
        Index("ix_footage_metadata_project_id", "project_id"),
        Index("ix_footage_metadata_camera_card_id", "camera_card_id"),
        Index("ix_footage_metadata_org_project", "organization_id", "project_id"),
    )


class MediaAsset(Base):
    __tablename__ = "media_assets"

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
    type: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    format: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    file_size_mb: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    tags: Mapped[Optional[Any]] = mapped_column(PortableJSON(), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    versions: Mapped[list["MediaVersion"]] = relationship(
        back_populates="media_asset", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_media_assets_org_id", "organization_id"),
        Index("ix_media_assets_project_id", "project_id"),
        Index("ix_media_assets_org_project", "organization_id", "project_id"),
    )


class MediaVersion(Base):
    __tablename__ = "media_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    media_asset_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("media_assets.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    file_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    media_asset: Mapped["MediaAsset"] = relationship(
        back_populates="versions", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_media_versions_org_id", "organization_id"),
        Index("ix_media_versions_media_asset_id", "media_asset_id"),
    )


# ---------------------------------------------------------------------------
# VFX
# ---------------------------------------------------------------------------


class VfxShot(Base):
    __tablename__ = "vfx_shots"

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
    shot_number: Mapped[str] = mapped_column(String(100), nullable=False)
    sequence: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="pending",
    )
    priority: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    vendor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    estimated_cost: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    actual_cost: Mapped[Optional[Decimal]] = mapped_column(
        Numeric(14, 2), nullable=True
    )
    due_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
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
    versions: Mapped[list["VfxVersion"]] = relationship(
        back_populates="vfx_shot", lazy="selectin"
    )
    reviews: Mapped[list["VfxReview"]] = relationship(
        back_populates="vfx_shot", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_vfx_shots_org_id", "organization_id"),
        Index("ix_vfx_shots_project_id", "project_id"),
        Index("ix_vfx_shots_status", "status"),
        Index("ix_vfx_shots_org_project", "organization_id", "project_id"),
    )


class VfxVersion(Base):
    __tablename__ = "vfx_versions"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    vfx_shot_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("vfx_shots.id", ondelete="CASCADE"),
        nullable=False,
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    file_url: Mapped[Optional[str]] = mapped_column(String(2048), nullable=True)
    status: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    vfx_shot: Mapped["VfxShot"] = relationship(
        back_populates="versions", lazy="selectin"
    )
    reviews: Mapped[list["VfxReview"]] = relationship(
        back_populates="vfx_version", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_vfx_versions_org_id", "organization_id"),
        Index("ix_vfx_versions_vfx_shot_id", "vfx_shot_id"),
    )


class VfxReview(Base):
    __tablename__ = "vfx_reviews"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
    )
    vfx_shot_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(),
        ForeignKey("vfx_shots.id", ondelete="CASCADE"),
        nullable=False,
    )
    vfx_version_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(),
        ForeignKey("vfx_versions.id", ondelete="SET NULL"),
        nullable=True,
    )
    reviewer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default="pending",
    )
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    vfx_shot: Mapped["VfxShot"] = relationship(
        back_populates="reviews", lazy="selectin"
    )
    vfx_version: Mapped[Optional["VfxVersion"]] = relationship(
        back_populates="reviews", lazy="selectin"
    )

    __table_args__ = (
        Index("ix_vfx_reviews_org_id", "organization_id"),
        Index("ix_vfx_reviews_vfx_shot_id", "vfx_shot_id"),
        Index("ix_vfx_reviews_vfx_version_id", "vfx_version_id"),
    )

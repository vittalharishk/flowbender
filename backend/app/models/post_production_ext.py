"""Extended post-production models: Editing, Dubbing, BGM, Trailers, Publicity, Marketing."""

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
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base
from .compat import PortableUUID, PortableJSON

__all__ = [
    "EditingTask",
    "EditingVersion",
    "DubbingSession",
    "BgmCue",
    "TrailerTeaser",
    "PublicityAsset",
    "MarketingCampaign",
]


class EditingTask(Base):
    __tablename__ = "editing_tasks"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    scene_id: Mapped[Optional[uuid.UUID]] = mapped_column(PortableUUID(), ForeignKey("scenes.id", ondelete="SET NULL"), nullable=True)
    scene_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    editor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="pending")
    footage_available: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    completion_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    current_cut: Mapped[str] = mapped_column(String(50), nullable=False, server_default="none")
    approval_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="pending")
    director_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    producer_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    review_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    pending_edits: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    versions: Mapped[list[EditingVersion]] = relationship(back_populates="task", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_editing_org", "organization_id"),
        Index("ix_editing_project", "project_id"),
    )


class EditingVersion(Base):
    __tablename__ = "editing_versions"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    task_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("editing_tasks.id", ondelete="CASCADE"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    cut_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    review_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="submitted")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())

    task: Mapped[EditingTask] = relationship(back_populates="versions")


class DubbingSession(Base):
    __tablename__ = "dubbing_sessions"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    scene_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    character: Mapped[str] = mapped_column(String(255), nullable=False)
    language: Mapped[str] = mapped_column(String(50), nullable=False)
    dubbing_artist: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    recording_studio: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    scheduled_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="scheduled")
    retakes: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")
    approved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    final_delivery_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_dubbing_org", "organization_id"),
        Index("ix_dubbing_project", "project_id"),
    )


class BgmCue(Base):
    __tablename__ = "bgm_cues"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    cue_id_code: Mapped[str] = mapped_column(String(50), nullable=False)
    scene_reference: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    composer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    duration_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="pending")
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    approved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    final_delivery_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    rights_reference: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_bgm_org", "organization_id"),
        Index("ix_bgm_project", "project_id"),
    )


class TrailerTeaser(Base):
    __tablename__ = "trailers_teasers"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    promo_type: Mapped[str] = mapped_column(String(50), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    runtime_seconds: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    editor: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    director_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    producer_approved: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default="false")
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    file_reference: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="in_progress")
    review_comments: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_trailers_org", "organization_id"),
        Index("ix_trailers_project", "project_id"),
    )


class PublicityAsset(Base):
    __tablename__ = "publicity_assets"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    asset_type: Mapped[str] = mapped_column(String(100), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    version: Mapped[int] = mapped_column(Integer, nullable=False, server_default="1")
    designer: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    approval_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="draft")
    approval_history: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    file_location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    publish_status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="unpublished")
    release_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    platform: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_publicity_org", "organization_id"),
        Index("ix_publicity_project", "project_id"),
    )


class MarketingCampaign(Base):
    __tablename__ = "marketing_campaigns"

    id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), primary_key=True, default=uuid.uuid4)
    organization_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False)
    project_id: Mapped[uuid.UUID] = mapped_column(PortableUUID(), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    platform: Mapped[str] = mapped_column(String(100), nullable=False)
    objective: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    start_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    end_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    campaign_budget: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    actual_spend: Mapped[Decimal] = mapped_column(Numeric(18, 2), nullable=False, server_default="0")
    reach: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    impressions: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    clicks: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    engagement: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    leads: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, server_default="planned")
    campaign_owner: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    creative_assets: Mapped[Optional[dict]] = mapped_column(PortableJSON(), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index("ix_campaigns_org", "organization_id"),
        Index("ix_campaigns_project", "project_id"),
    )

"""Post-Production schemas: Items, Milestones, Deliverables, Subtitles."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Post-Production Item
# ---------------------------------------------------------------------------

class PostProductionItemBase(BaseModel):
    project_id: UUID
    title: str
    department: str
    status: str = "not-started"
    priority: Optional[str] = None
    assigned_to: Optional[UUID] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class PostProductionItemCreate(PostProductionItemBase):
    pass


class PostProductionItemUpdate(BaseModel):
    project_id: Optional[UUID] = None
    title: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[UUID] = None
    start_date: Optional[date] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class PostProductionItemResponse(PostProductionItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Post-Production Milestone
# ---------------------------------------------------------------------------

class PostProdMilestoneBase(BaseModel):
    project_id: UUID
    title: str
    department: Optional[str] = None
    date: date
    status: str = "pending"
    notes: Optional[str] = None


class PostProdMilestoneCreate(PostProdMilestoneBase):
    pass


class PostProdMilestoneResponse(PostProdMilestoneBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Deliverable Item
# ---------------------------------------------------------------------------

class DeliverableItemBase(BaseModel):
    project_id: UUID
    title: str
    type: str
    format: Optional[str] = None
    status: str = "pending"
    delivery_date: Optional[date] = None
    recipient: Optional[str] = None
    notes: Optional[str] = None


class DeliverableItemCreate(DeliverableItemBase):
    pass


class DeliverableItemUpdate(BaseModel):
    project_id: Optional[UUID] = None
    title: Optional[str] = None
    type: Optional[str] = None
    format: Optional[str] = None
    status: Optional[str] = None
    delivery_date: Optional[date] = None
    recipient: Optional[str] = None
    notes: Optional[str] = None


class DeliverableItemResponse(DeliverableItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Subtitle Language
# ---------------------------------------------------------------------------

class SubtitleLanguageBase(BaseModel):
    project_id: UUID
    language: str
    status: str = "pending"
    translator: Optional[str] = None
    notes: Optional[str] = None


class SubtitleLanguageCreate(SubtitleLanguageBase):
    pass


class SubtitleLanguageUpdate(BaseModel):
    project_id: Optional[UUID] = None
    language: Optional[str] = None
    status: Optional[str] = None
    translator: Optional[str] = None
    notes: Optional[str] = None


class SubtitleLanguageResponse(SubtitleLanguageBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime

"""Production schemas: Tasks, Pre-Prod Checklist, DPR, Calendar Events."""

import datetime as _dt
from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Production Task
# ---------------------------------------------------------------------------

class ProductionTaskBase(BaseModel):
    project_id: UUID
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: str = "pending"
    priority: str = "medium"
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None


class ProductionTaskCreate(ProductionTaskBase):
    pass


class ProductionTaskUpdate(BaseModel):
    project_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None


class ProductionTaskResponse(ProductionTaskBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Pre-Production Checklist Item
# ---------------------------------------------------------------------------

class PreProdChecklistItemBase(BaseModel):
    project_id: UUID
    category: str
    title: str
    is_completed: bool = False
    sort_order: Optional[int] = None


class PreProdChecklistItemCreate(PreProdChecklistItemBase):
    pass


class PreProdChecklistItemResponse(PreProdChecklistItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# DPR Report
# ---------------------------------------------------------------------------

class DprReportBase(BaseModel):
    project_id: UUID
    shoot_day_id: Optional[UUID] = None
    date: date
    day_number: Optional[int] = None
    status: str = "draft"
    scenes_planned: Optional[list] = None
    scenes_completed: Optional[list] = None
    notes: Optional[str] = None


class DprReportCreate(DprReportBase):
    pass


class DprReportUpdate(BaseModel):
    project_id: Optional[UUID] = None
    shoot_day_id: Optional[UUID] = None
    date: Optional[_dt.date] = None
    day_number: Optional[int] = None
    status: Optional[str] = None
    scenes_planned: Optional[list] = None
    scenes_completed: Optional[list] = None
    notes: Optional[str] = None


class DprReportResponse(DprReportBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Calendar Event
# ---------------------------------------------------------------------------

class CalendarEventBase(BaseModel):
    project_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    category: str = "general"
    date: date
    end_date: Optional[date] = None
    all_day: bool = False
    status: str = "scheduled"


class CalendarEventCreate(CalendarEventBase):
    pass


class CalendarEventUpdate(BaseModel):
    project_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    date: Optional[_dt.date] = None
    end_date: Optional[date] = None
    all_day: Optional[bool] = None
    status: Optional[str] = None


class CalendarEventResponse(CalendarEventBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime

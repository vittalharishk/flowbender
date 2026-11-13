"""Settings module schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Notifications ───────────────────────────────────────────────────────────

class NotificationCreate(BaseModel):
    user_id: Optional[UUID] = None
    title: str
    message: str
    type: str = "info"


class NotificationUpdate(BaseModel):
    read: Optional[bool] = None


class NotificationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: Optional[UUID] = None
    title: str
    message: str
    type: str
    created_at: datetime


# ── User Preferences ───────────────────────────────────────────────────────

class UserPreferenceCreate(BaseModel):
    key: str
    value: str


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    key: str
    value: str
    updated_at: datetime

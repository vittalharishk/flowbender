"""Report configuration schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ReportConfigCreate(BaseModel):
    name: str
    category: str
    config: dict
    description: Optional[str] = None

class ReportConfigUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    config: Optional[dict] = None
    description: Optional[str] = None

class ReportConfigResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    name: str
    category: str
    config: dict
    description: Optional[str] = None
    created_at: datetime
    updated_at: datetime

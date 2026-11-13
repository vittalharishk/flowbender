"""Project schemas."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProjectBase(BaseModel):
    title: str
    type: str = "feature-film"
    status: str = "development"
    genre: Optional[str] = None
    language: Optional[str] = None
    director: Optional[str] = None
    producer: Optional[str] = None
    production_house: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: float = 0
    logline: Optional[str] = None
    description: Optional[str] = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: Optional[str] = None
    type: Optional[str] = None
    status: Optional[str] = None
    genre: Optional[str] = None
    language: Optional[str] = None
    director: Optional[str] = None
    producer: Optional[str] = None
    production_house: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    budget: Optional[float] = None
    logline: Optional[str] = None
    description: Optional[str] = None


class ProjectResponse(ProjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime

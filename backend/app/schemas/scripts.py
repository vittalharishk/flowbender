"""Script and Scene schemas."""

from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Script
# ---------------------------------------------------------------------------

class ScriptBase(BaseModel):
    project_id: UUID
    title: str
    writer: Optional[str] = None
    screenplay_by: Optional[str] = None
    dialogues_by: Optional[str] = None
    format: Optional[str] = None
    status: str = "draft"
    content: Optional[dict] = None


class ScriptCreate(ScriptBase):
    pass


class ScriptUpdate(BaseModel):
    project_id: Optional[UUID] = None
    title: Optional[str] = None
    writer: Optional[str] = None
    screenplay_by: Optional[str] = None
    dialogues_by: Optional[str] = None
    format: Optional[str] = None
    status: Optional[str] = None
    content: Optional[dict] = None


class ScriptResponse(ScriptBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Script Version
# ---------------------------------------------------------------------------

class ScriptVersionBase(BaseModel):
    script_id: UUID
    version_number: int
    label: Optional[str] = None
    content: Optional[dict] = None


class ScriptVersionCreate(ScriptVersionBase):
    pass


class ScriptVersionResponse(ScriptVersionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# Scene
# ---------------------------------------------------------------------------

class SceneBase(BaseModel):
    project_id: UUID
    scene_number: int
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    time_of_day: Optional[str] = None
    int_ext: Optional[str] = None
    status: str = "pending"
    page_count: Optional[float] = None
    characters: Optional[list] = None
    props: Optional[list] = None
    notes: Optional[str] = None


class SceneCreate(SceneBase):
    pass


class SceneUpdate(BaseModel):
    project_id: Optional[UUID] = None
    scene_number: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    time_of_day: Optional[str] = None
    int_ext: Optional[str] = None
    status: Optional[str] = None
    page_count: Optional[float] = None
    characters: Optional[list] = None
    props: Optional[list] = None
    notes: Optional[str] = None


class SceneResponse(SceneBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime

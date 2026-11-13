"""Post-production extension schemas: Editing, Dubbing, BGM, Trailers, Publicity, Marketing."""

from datetime import date, datetime
from decimal import Decimal
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Editing Tasks ──────────────────────────────────────────────────────────

class EditingTaskCreate(BaseModel):
    project_id: UUID
    scene_id: Optional[UUID] = None
    scene_reference: Optional[str] = None
    editor: Optional[str] = None
    status: str = "pending"
    footage_available: bool = False
    start_date: Optional[date] = None
    notes: Optional[str] = None

class EditingTaskUpdate(BaseModel):
    scene_id: Optional[UUID] = None
    scene_reference: Optional[str] = None
    editor: Optional[str] = None
    status: Optional[str] = None
    footage_available: Optional[bool] = None
    start_date: Optional[date] = None
    completion_date: Optional[date] = None
    current_cut: Optional[str] = None
    approval_status: Optional[str] = None
    director_approved: Optional[bool] = None
    producer_approved: Optional[bool] = None
    review_comments: Optional[str] = None
    pending_edits: Optional[str] = None
    notes: Optional[str] = None

class EditingTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    scene_id: Optional[UUID] = None
    scene_reference: Optional[str] = None
    editor: Optional[str] = None
    status: str
    footage_available: bool
    start_date: Optional[date] = None
    completion_date: Optional[date] = None
    current_cut: str
    approval_status: str
    director_approved: bool
    producer_approved: bool
    review_comments: Optional[str] = None
    pending_edits: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Editing Versions ───────────────────────────────────────────────────────

class EditingVersionCreate(BaseModel):
    task_id: UUID
    version_number: int
    cut_type: str
    file_reference: Optional[str] = None
    comments: Optional[str] = None

class EditingVersionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    task_id: UUID
    version_number: int
    cut_type: str
    file_reference: Optional[str] = None
    comments: Optional[str] = None
    reviewed_by: Optional[str] = None
    review_date: Optional[date] = None
    status: str
    created_at: datetime


# ── Dubbing Sessions ───────────────────────────────────────────────────────

class DubbingSessionCreate(BaseModel):
    project_id: UUID
    scene_reference: Optional[str] = None
    character: str
    language: str
    dubbing_artist: Optional[str] = None
    recording_studio: Optional[str] = None
    scheduled_date: Optional[date] = None
    notes: Optional[str] = None

class DubbingSessionUpdate(BaseModel):
    scene_reference: Optional[str] = None
    character: Optional[str] = None
    language: Optional[str] = None
    dubbing_artist: Optional[str] = None
    recording_studio: Optional[str] = None
    scheduled_date: Optional[date] = None
    status: Optional[str] = None
    retakes: Optional[int] = None
    approved: Optional[bool] = None
    final_delivery_date: Optional[date] = None
    version: Optional[int] = None
    notes: Optional[str] = None

class DubbingSessionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    scene_reference: Optional[str] = None
    character: str
    language: str
    dubbing_artist: Optional[str] = None
    recording_studio: Optional[str] = None
    scheduled_date: Optional[date] = None
    status: str
    retakes: int
    approved: bool
    final_delivery_date: Optional[date] = None
    version: int
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── BGM Cues ───────────────────────────────────────────────────────────────

class BgmCueCreate(BaseModel):
    project_id: UUID
    cue_id_code: str
    scene_reference: Optional[str] = None
    description: Optional[str] = None
    composer: Optional[str] = None
    duration_seconds: Optional[int] = None
    notes: Optional[str] = None

class BgmCueUpdate(BaseModel):
    cue_id_code: Optional[str] = None
    scene_reference: Optional[str] = None
    description: Optional[str] = None
    composer: Optional[str] = None
    duration_seconds: Optional[int] = None
    status: Optional[str] = None
    version: Optional[int] = None
    approved: Optional[bool] = None
    final_delivery_date: Optional[date] = None
    rights_reference: Optional[str] = None
    notes: Optional[str] = None

class BgmCueResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    cue_id_code: str
    scene_reference: Optional[str] = None
    description: Optional[str] = None
    composer: Optional[str] = None
    duration_seconds: Optional[int] = None
    status: str
    version: int
    approved: bool
    final_delivery_date: Optional[date] = None
    rights_reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Trailers & Teasers ─────────────────────────────────────────────────────

class TrailerTeaserCreate(BaseModel):
    project_id: UUID
    promo_type: str
    title: str
    runtime_seconds: Optional[int] = None
    editor: Optional[str] = None
    release_date: Optional[date] = None
    platform: Optional[str] = None
    notes: Optional[str] = None

class TrailerTeaserUpdate(BaseModel):
    promo_type: Optional[str] = None
    title: Optional[str] = None
    runtime_seconds: Optional[int] = None
    editor: Optional[str] = None
    version: Optional[int] = None
    director_approved: Optional[bool] = None
    producer_approved: Optional[bool] = None
    release_date: Optional[date] = None
    platform: Optional[str] = None
    file_reference: Optional[str] = None
    status: Optional[str] = None
    review_comments: Optional[str] = None
    notes: Optional[str] = None

class TrailerTeaserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    promo_type: str
    title: str
    runtime_seconds: Optional[int] = None
    editor: Optional[str] = None
    version: int
    director_approved: bool
    producer_approved: bool
    release_date: Optional[date] = None
    platform: Optional[str] = None
    file_reference: Optional[str] = None
    status: str
    review_comments: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Publicity Assets ───────────────────────────────────────────────────────

class PublicityAssetCreate(BaseModel):
    project_id: UUID
    asset_type: str
    name: str
    designer: Optional[str] = None
    file_location: Optional[str] = None
    release_date: Optional[date] = None
    platform: Optional[str] = None
    notes: Optional[str] = None

class PublicityAssetUpdate(BaseModel):
    asset_type: Optional[str] = None
    name: Optional[str] = None
    version: Optional[int] = None
    designer: Optional[str] = None
    approval_status: Optional[str] = None
    approval_history: Optional[dict] = None
    file_location: Optional[str] = None
    publish_status: Optional[str] = None
    release_date: Optional[date] = None
    platform: Optional[str] = None
    notes: Optional[str] = None

class PublicityAssetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    asset_type: str
    name: str
    version: int
    designer: Optional[str] = None
    approval_status: str
    approval_history: Optional[dict] = None
    file_location: Optional[str] = None
    publish_status: str
    release_date: Optional[date] = None
    platform: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Marketing Campaigns ────────────────────────────────────────────────────

class MarketingCampaignCreate(BaseModel):
    project_id: UUID
    name: str
    platform: str
    objective: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    campaign_budget: Decimal = Decimal("0")
    campaign_owner: Optional[str] = None
    notes: Optional[str] = None

class MarketingCampaignUpdate(BaseModel):
    name: Optional[str] = None
    platform: Optional[str] = None
    objective: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    campaign_budget: Optional[Decimal] = None
    actual_spend: Optional[Decimal] = None
    reach: Optional[int] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    engagement: Optional[int] = None
    leads: Optional[int] = None
    status: Optional[str] = None
    campaign_owner: Optional[str] = None
    creative_assets: Optional[dict] = None
    notes: Optional[str] = None

class MarketingCampaignResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    project_id: UUID
    name: str
    platform: str
    objective: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    campaign_budget: Decimal
    actual_spend: Decimal
    reach: Optional[int] = None
    impressions: Optional[int] = None
    clicks: Optional[int] = None
    engagement: Optional[int] = None
    leads: Optional[int] = None
    status: str
    campaign_owner: Optional[str] = None
    creative_assets: Optional[dict] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

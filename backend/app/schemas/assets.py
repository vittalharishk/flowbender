"""Asset schemas: Equipment, Camera Cards, Storage, Footage, Media, VFX."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Equipment Item
# ---------------------------------------------------------------------------

class EquipmentItemBase(BaseModel):
    project_id: UUID
    name: str
    category: Optional[str] = None
    serial_number: Optional[str] = None
    status: str = "available"
    vendor: Optional[str] = None
    purchase_cost: Optional[float] = None
    notes: Optional[str] = None


class EquipmentItemCreate(EquipmentItemBase):
    pass


class EquipmentItemUpdate(BaseModel):
    project_id: Optional[UUID] = None
    name: Optional[str] = None
    category: Optional[str] = None
    serial_number: Optional[str] = None
    status: Optional[str] = None
    vendor: Optional[str] = None
    purchase_cost: Optional[float] = None
    notes: Optional[str] = None


class EquipmentItemResponse(EquipmentItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Equipment Allocation
# ---------------------------------------------------------------------------

class EquipmentAllocationBase(BaseModel):
    equipment_id: UUID
    project_id: UUID
    allocated_to: str
    allocated_date: date
    return_date: Optional[date] = None


class EquipmentAllocationCreate(EquipmentAllocationBase):
    pass


class EquipmentAllocationResponse(EquipmentAllocationBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# Equipment Maintenance
# ---------------------------------------------------------------------------

class EquipmentMaintenanceBase(BaseModel):
    equipment_id: UUID
    type: str
    description: Optional[str] = None
    cost: Optional[float] = None
    date: date
    next_due_date: Optional[date] = None


class EquipmentMaintenanceCreate(EquipmentMaintenanceBase):
    pass


class EquipmentMaintenanceResponse(EquipmentMaintenanceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# Camera Card
# ---------------------------------------------------------------------------

class CameraCardBase(BaseModel):
    project_id: UUID
    card_number: str
    capacity_gb: Optional[float] = None
    format: Optional[str] = None
    status: str = "available"


class CameraCardCreate(CameraCardBase):
    pass


class CameraCardResponse(CameraCardBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Storage Device
# ---------------------------------------------------------------------------

class StorageDeviceBase(BaseModel):
    project_id: UUID
    name: str
    type: Optional[str] = None
    capacity_tb: Optional[float] = None
    status: str = "active"


class StorageDeviceCreate(StorageDeviceBase):
    pass


class StorageDeviceResponse(StorageDeviceBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Footage Metadata
# ---------------------------------------------------------------------------

class FootageMetadataBase(BaseModel):
    project_id: UUID
    camera_card_id: Optional[UUID] = None
    scene_id: Optional[str] = None
    take_number: Optional[int] = None
    duration_seconds: Optional[float] = None
    format: Optional[str] = None
    resolution: Optional[str] = None
    fps: Optional[float] = None


class FootageMetadataCreate(FootageMetadataBase):
    pass


class FootageMetadataResponse(FootageMetadataBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# Media Asset
# ---------------------------------------------------------------------------

class MediaAssetBase(BaseModel):
    project_id: UUID
    title: str
    type: Optional[str] = None
    format: Optional[str] = None
    file_url: Optional[str] = None
    file_size_mb: Optional[float] = None
    tags: Optional[list[str]] = None


class MediaAssetCreate(MediaAssetBase):
    pass


class MediaAssetUpdate(BaseModel):
    project_id: Optional[UUID] = None
    title: Optional[str] = None
    type: Optional[str] = None
    format: Optional[str] = None
    file_url: Optional[str] = None
    file_size_mb: Optional[float] = None
    tags: Optional[list[str]] = None


class MediaAssetResponse(MediaAssetBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# VFX Shot
# ---------------------------------------------------------------------------

class VfxShotBase(BaseModel):
    project_id: UUID
    shot_number: str
    sequence: Optional[str] = None
    description: Optional[str] = None
    status: str = "pending"
    priority: Optional[str] = None
    vendor: Optional[str] = None
    estimated_cost: Optional[float] = None
    due_date: Optional[date] = None


class VfxShotCreate(VfxShotBase):
    pass


class VfxShotUpdate(BaseModel):
    project_id: Optional[UUID] = None
    shot_number: Optional[str] = None
    sequence: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    vendor: Optional[str] = None
    estimated_cost: Optional[float] = None
    due_date: Optional[date] = None


class VfxShotResponse(VfxShotBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# VFX Version
# ---------------------------------------------------------------------------

class VfxVersionBase(BaseModel):
    vfx_shot_id: UUID
    version_number: int
    file_url: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class VfxVersionCreate(VfxVersionBase):
    pass


class VfxVersionResponse(VfxVersionBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# VFX Review
# ---------------------------------------------------------------------------

class VfxReviewBase(BaseModel):
    vfx_shot_id: UUID
    vfx_version_id: Optional[UUID] = None
    reviewer: str
    status: str = "pending"
    comments: Optional[str] = None


class VfxReviewCreate(VfxReviewBase):
    pass


class VfxReviewResponse(VfxReviewBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime

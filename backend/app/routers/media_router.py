"""Media Asset CRUD router with sub-routes for camera cards, storage, footage."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.assets import MediaAsset, CameraCard, StorageDevice, FootageMetadata
from ..schemas.assets import (
    MediaAssetCreate,
    MediaAssetUpdate,
    MediaAssetResponse,
    CameraCardCreate,
    CameraCardResponse,
    StorageDeviceCreate,
    StorageDeviceResponse,
    FootageMetadataCreate,
    FootageMetadataResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
media_crud = CRUDBase(MediaAsset)
card_crud = CRUDBase(CameraCard)
storage_crud = CRUDBase(StorageDevice)
footage_crud = CRUDBase(FootageMetadata)

# ── Media Assets ────────────────────────────────────────────────────────────


@router.get("/", response_model=list[MediaAssetResponse])
async def list_media_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await media_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=MediaAssetResponse)
async def get_media_asset(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await media_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=MediaAssetResponse, status_code=status.HTTP_201_CREATED)
async def create_media_asset(
    data: MediaAssetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await media_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=MediaAssetResponse)
async def update_media_asset(
    item_id: UUID,
    data: MediaAssetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await media_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await media_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_media_asset(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await media_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Camera Cards ────────────────────────────────────────────────────────────


@router.get("/camera-cards/", response_model=list[CameraCardResponse])
async def list_camera_cards(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await card_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/camera-cards/{item_id}", response_model=CameraCardResponse)
async def get_camera_card(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await card_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/camera-cards/", response_model=CameraCardResponse, status_code=status.HTTP_201_CREATED)
async def create_camera_card(
    data: CameraCardCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await card_crud.create(db, data, current_user.organization_id)


@router.delete("/camera-cards/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_camera_card(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await card_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Storage Devices ─────────────────────────────────────────────────────────


@router.get("/storage/", response_model=list[StorageDeviceResponse])
async def list_storage_devices(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await storage_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/storage/{item_id}", response_model=StorageDeviceResponse)
async def get_storage_device(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await storage_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/storage/", response_model=StorageDeviceResponse, status_code=status.HTTP_201_CREATED)
async def create_storage_device(
    data: StorageDeviceCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await storage_crud.create(db, data, current_user.organization_id)


@router.delete("/storage/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_storage_device(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await storage_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Footage Metadata ────────────────────────────────────────────────────────


@router.get("/footage/", response_model=list[FootageMetadataResponse])
async def list_footage(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await footage_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/footage/{item_id}", response_model=FootageMetadataResponse)
async def get_footage(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await footage_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/footage/", response_model=FootageMetadataResponse, status_code=status.HTTP_201_CREATED)
async def create_footage(
    data: FootageMetadataCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await footage_crud.create(db, data, current_user.organization_id)


@router.delete("/footage/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_footage(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await footage_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

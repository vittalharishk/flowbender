"""Post-Production Extension router — Editing, Dubbing, BGM, Trailers, Publicity, Marketing."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.post_production_ext import (
    EditingTask, EditingVersion, DubbingSession, BgmCue,
    TrailerTeaser, PublicityAsset, MarketingCampaign,
)
from ..schemas.post_production_ext import (
    EditingTaskCreate, EditingTaskUpdate, EditingTaskResponse,
    EditingVersionCreate, EditingVersionResponse,
    DubbingSessionCreate, DubbingSessionUpdate, DubbingSessionResponse,
    BgmCueCreate, BgmCueUpdate, BgmCueResponse,
    TrailerTeaserCreate, TrailerTeaserUpdate, TrailerTeaserResponse,
    PublicityAssetCreate, PublicityAssetUpdate, PublicityAssetResponse,
    MarketingCampaignCreate, MarketingCampaignUpdate, MarketingCampaignResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
editing_crud = CRUDBase(EditingTask)
version_crud = CRUDBase(EditingVersion)
dubbing_crud = CRUDBase(DubbingSession)
bgm_crud = CRUDBase(BgmCue)
trailer_crud = CRUDBase(TrailerTeaser)
publicity_crud = CRUDBase(PublicityAsset)
marketing_crud = CRUDBase(MarketingCampaign)


# ── Editing Tasks ──────────────────────────────────────────────────────────

@router.get("/editing/", response_model=list[EditingTaskResponse])
async def list_editing(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await editing_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/editing/{id}", response_model=EditingTaskResponse)
async def get_editing(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await editing_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Editing task not found")
    return obj

@router.post("/editing/", response_model=EditingTaskResponse, status_code=201)
async def create_editing(data: EditingTaskCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await editing_crud.create(db, data, current_user.organization_id)

@router.patch("/editing/{id}", response_model=EditingTaskResponse)
async def update_editing(id: UUID, data: EditingTaskUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await editing_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Editing task not found")
    return await editing_crud.update(db, obj, data)

@router.delete("/editing/{id}", status_code=204)
async def delete_editing(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await editing_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Editing task not found")


# ── Editing Versions ───────────────────────────────────────────────────────

@router.get("/editing-versions/", response_model=list[EditingVersionResponse])
async def list_editing_versions(
    task_id: UUID, skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await version_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, filters={"task_id": task_id})
    return items

@router.post("/editing-versions/", response_model=EditingVersionResponse, status_code=201)
async def create_editing_version(data: EditingVersionCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await version_crud.create(db, data, current_user.organization_id)


# ── Dubbing ────────────────────────────────────────────────────────────────

@router.get("/dubbing/", response_model=list[DubbingSessionResponse])
async def list_dubbing(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await dubbing_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/dubbing/{id}", response_model=DubbingSessionResponse)
async def get_dubbing(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await dubbing_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Dubbing session not found")
    return obj

@router.post("/dubbing/", response_model=DubbingSessionResponse, status_code=201)
async def create_dubbing(data: DubbingSessionCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await dubbing_crud.create(db, data, current_user.organization_id)

@router.patch("/dubbing/{id}", response_model=DubbingSessionResponse)
async def update_dubbing(id: UUID, data: DubbingSessionUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await dubbing_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Dubbing session not found")
    return await dubbing_crud.update(db, obj, data)

@router.delete("/dubbing/{id}", status_code=204)
async def delete_dubbing(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await dubbing_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Dubbing session not found")


# ── BGM ────────────────────────────────────────────────────────────────────

@router.get("/bgm/", response_model=list[BgmCueResponse])
async def list_bgm(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await bgm_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/bgm/{id}", response_model=BgmCueResponse)
async def get_bgm(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await bgm_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="BGM cue not found")
    return obj

@router.post("/bgm/", response_model=BgmCueResponse, status_code=201)
async def create_bgm(data: BgmCueCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await bgm_crud.create(db, data, current_user.organization_id)

@router.patch("/bgm/{id}", response_model=BgmCueResponse)
async def update_bgm(id: UUID, data: BgmCueUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await bgm_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="BGM cue not found")
    return await bgm_crud.update(db, obj, data)

@router.delete("/bgm/{id}", status_code=204)
async def delete_bgm(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await bgm_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="BGM cue not found")


# ── Trailers & Teasers ────────────────────────────────────────────────────

@router.get("/trailers/", response_model=list[TrailerTeaserResponse])
async def list_trailers(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await trailer_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/trailers/{id}", response_model=TrailerTeaserResponse)
async def get_trailer(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await trailer_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Trailer not found")
    return obj

@router.post("/trailers/", response_model=TrailerTeaserResponse, status_code=201)
async def create_trailer(data: TrailerTeaserCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await trailer_crud.create(db, data, current_user.organization_id)

@router.patch("/trailers/{id}", response_model=TrailerTeaserResponse)
async def update_trailer(id: UUID, data: TrailerTeaserUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await trailer_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Trailer not found")
    return await trailer_crud.update(db, obj, data)

@router.delete("/trailers/{id}", status_code=204)
async def delete_trailer(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await trailer_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Trailer not found")


# ── Publicity ──────────────────────────────────────────────────────────────

@router.get("/publicity/", response_model=list[PublicityAssetResponse])
async def list_publicity(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await publicity_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/publicity/{id}", response_model=PublicityAssetResponse)
async def get_publicity(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await publicity_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Publicity asset not found")
    return obj

@router.post("/publicity/", response_model=PublicityAssetResponse, status_code=201)
async def create_publicity(data: PublicityAssetCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await publicity_crud.create(db, data, current_user.organization_id)

@router.patch("/publicity/{id}", response_model=PublicityAssetResponse)
async def update_publicity(id: UUID, data: PublicityAssetUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await publicity_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Publicity asset not found")
    return await publicity_crud.update(db, obj, data)

@router.delete("/publicity/{id}", status_code=204)
async def delete_publicity(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await publicity_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Publicity asset not found")


# ── Marketing ──────────────────────────────────────────────────────────────

@router.get("/marketing/", response_model=list[MarketingCampaignResponse])
async def list_marketing(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await marketing_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.get("/marketing/{id}", response_model=MarketingCampaignResponse)
async def get_marketing(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await marketing_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return obj

@router.post("/marketing/", response_model=MarketingCampaignResponse, status_code=201)
async def create_marketing(data: MarketingCampaignCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await marketing_crud.create(db, data, current_user.organization_id)

@router.patch("/marketing/{id}", response_model=MarketingCampaignResponse)
async def update_marketing(id: UUID, data: MarketingCampaignUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await marketing_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return await marketing_crud.update(db, obj, data)

@router.delete("/marketing/{id}", status_code=204)
async def delete_marketing(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await marketing_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Campaign not found")

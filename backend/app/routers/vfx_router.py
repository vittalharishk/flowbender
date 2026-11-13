"""VFX Shot CRUD router with sub-routes for versions and reviews."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.assets import VfxShot, VfxVersion, VfxReview
from ..schemas.assets import (
    VfxShotCreate,
    VfxShotUpdate,
    VfxShotResponse,
    VfxVersionCreate,
    VfxVersionResponse,
    VfxReviewCreate,
    VfxReviewResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
shot_crud = CRUDBase(VfxShot)
version_crud = CRUDBase(VfxVersion)
review_crud = CRUDBase(VfxReview)

# ── VFX Shots ───────────────────────────────────────────────────────────────


@router.get("/", response_model=list[VfxShotResponse])
async def list_vfx_shots(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await shot_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=VfxShotResponse)
async def get_vfx_shot(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await shot_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=VfxShotResponse, status_code=status.HTTP_201_CREATED)
async def create_vfx_shot(
    data: VfxShotCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await shot_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=VfxShotResponse)
async def update_vfx_shot(
    item_id: UUID,
    data: VfxShotUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await shot_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await shot_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vfx_shot(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await shot_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── VFX Versions ────────────────────────────────────────────────────────────


@router.get("/versions/", response_model=list[VfxVersionResponse])
async def list_vfx_versions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await version_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/versions/{item_id}", response_model=VfxVersionResponse)
async def get_vfx_version(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await version_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/versions/", response_model=VfxVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_vfx_version(
    data: VfxVersionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await version_crud.create(db, data, current_user.organization_id)


@router.delete("/versions/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vfx_version(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await version_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── VFX Reviews ─────────────────────────────────────────────────────────────


@router.get("/reviews/", response_model=list[VfxReviewResponse])
async def list_vfx_reviews(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await review_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/reviews/{item_id}", response_model=VfxReviewResponse)
async def get_vfx_review(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await review_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/reviews/", response_model=VfxReviewResponse, status_code=status.HTTP_201_CREATED)
async def create_vfx_review(
    data: VfxReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await review_crud.create(db, data, current_user.organization_id)


@router.delete("/reviews/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vfx_review(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await review_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

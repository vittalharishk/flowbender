"""Post-Production CRUD router with sub-routes for milestones, deliverables, subtitles."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.post_production import (
    PostProductionItem,
    PostProdMilestone,
    DeliverableItem,
    SubtitleLanguage,
)
from ..schemas.post_production import (
    PostProductionItemCreate,
    PostProductionItemUpdate,
    PostProductionItemResponse,
    PostProdMilestoneCreate,
    PostProdMilestoneResponse,
    DeliverableItemCreate,
    DeliverableItemUpdate,
    DeliverableItemResponse,
    SubtitleLanguageCreate,
    SubtitleLanguageUpdate,
    SubtitleLanguageResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
item_crud = CRUDBase(PostProductionItem)
milestone_crud = CRUDBase(PostProdMilestone)
deliverable_crud = CRUDBase(DeliverableItem)
subtitle_crud = CRUDBase(SubtitleLanguage)

# ── Post-Production Items ───────────────────────────────────────────────────


@router.get("/", response_model=list[PostProductionItemResponse])
async def list_post_prod_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await item_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=PostProductionItemResponse)
async def get_post_prod_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await item_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=PostProductionItemResponse, status_code=status.HTTP_201_CREATED)
async def create_post_prod_item(
    data: PostProductionItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await item_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=PostProductionItemResponse)
async def update_post_prod_item(
    item_id: UUID,
    data: PostProductionItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await item_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await item_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_post_prod_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await item_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Milestones ──────────────────────────────────────────────────────────────


@router.get("/milestones/", response_model=list[PostProdMilestoneResponse])
async def list_milestones(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await milestone_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/milestones/{item_id}", response_model=PostProdMilestoneResponse)
async def get_milestone(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await milestone_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/milestones/", response_model=PostProdMilestoneResponse, status_code=status.HTTP_201_CREATED)
async def create_milestone(
    data: PostProdMilestoneCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await milestone_crud.create(db, data, current_user.organization_id)


@router.delete("/milestones/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_milestone(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await milestone_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Deliverables ────────────────────────────────────────────────────────────


@router.get("/deliverables/", response_model=list[DeliverableItemResponse])
async def list_deliverables(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await deliverable_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/deliverables/{item_id}", response_model=DeliverableItemResponse)
async def get_deliverable(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await deliverable_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/deliverables/", response_model=DeliverableItemResponse, status_code=status.HTTP_201_CREATED)
async def create_deliverable(
    data: DeliverableItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await deliverable_crud.create(db, data, current_user.organization_id)


@router.patch("/deliverables/{item_id}", response_model=DeliverableItemResponse)
async def update_deliverable(
    item_id: UUID,
    data: DeliverableItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await deliverable_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await deliverable_crud.update(db, item, data)


@router.delete("/deliverables/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_deliverable(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await deliverable_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ── Subtitles ───────────────────────────────────────────────────────────────


@router.get("/subtitles/", response_model=list[SubtitleLanguageResponse])
async def list_subtitles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await subtitle_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/subtitles/{item_id}", response_model=SubtitleLanguageResponse)
async def get_subtitle(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await subtitle_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/subtitles/", response_model=SubtitleLanguageResponse, status_code=status.HTTP_201_CREATED)
async def create_subtitle(
    data: SubtitleLanguageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await subtitle_crud.create(db, data, current_user.organization_id)


@router.patch("/subtitles/{item_id}", response_model=SubtitleLanguageResponse)
async def update_subtitle(
    item_id: UUID,
    data: SubtitleLanguageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await subtitle_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await subtitle_crud.update(db, item, data)


@router.delete("/subtitles/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subtitle(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await subtitle_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

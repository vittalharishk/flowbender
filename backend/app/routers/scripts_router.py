"""Scripts router: Script CRUD + sub-routes for versions."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..services.crud import CRUDBase
from ..models.scripts import Script, ScriptVersion
from ..schemas.scripts import (
    ScriptCreate, ScriptUpdate, ScriptResponse,
    ScriptVersionCreate, ScriptVersionResponse,
)

router = APIRouter()

script_crud = CRUDBase(Script)
version_crud = CRUDBase(ScriptVersion)


# ---------------------------------------------------------------------------
# Scripts
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[ScriptResponse])
async def list_scripts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await script_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=ScriptResponse)
async def get_script(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await script_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=ScriptResponse, status_code=status.HTTP_201_CREATED)
async def create_script(
    data: ScriptCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await script_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=ScriptResponse)
async def update_script(
    item_id: UUID,
    data: ScriptUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await script_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await script_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_script(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await script_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ---------------------------------------------------------------------------
# Script Versions
# ---------------------------------------------------------------------------

@router.get("/versions/", response_model=list[ScriptVersionResponse])
async def list_versions(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await version_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit
    )
    return items


@router.get("/versions/{item_id}", response_model=ScriptVersionResponse)
async def get_version(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await version_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/versions/", response_model=ScriptVersionResponse, status_code=status.HTTP_201_CREATED)
async def create_version(
    data: ScriptVersionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await version_crud.create(db, data, current_user.organization_id)


@router.delete("/versions/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_version(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await version_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

"""Art department router — Props, Sets, and Set Tasks."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.crew_departments import PropItem, PropTransaction, ProductionSet, SetTask
from ..schemas.crew_departments import (
    PropItemCreate,
    PropItemUpdate,
    PropItemResponse,
    PropTransactionCreate,
    PropTransactionResponse,
    ProductionSetCreate,
    ProductionSetUpdate,
    ProductionSetResponse,
    SetTaskCreate,
    SetTaskUpdate,
    SetTaskResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
prop_crud = CRUDBase(PropItem)
prop_tx_crud = CRUDBase(PropTransaction)
set_crud = CRUDBase(ProductionSet)
task_crud = CRUDBase(SetTask)


# ── Props ──────────────────────────────────────────────────────────────────


@router.get("/props", response_model=list[PropItemResponse])
async def list_props(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await prop_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/props/{prop_id}", response_model=PropItemResponse)
async def get_prop(
    prop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await prop_crud.get(db, prop_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prop not found")
    return item


@router.post("/props", response_model=PropItemResponse, status_code=status.HTTP_201_CREATED)
async def create_prop(
    data: PropItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await prop_crud.create(db, data, current_user.organization_id)


@router.patch("/props/{prop_id}", response_model=PropItemResponse)
async def update_prop(
    prop_id: UUID,
    data: PropItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await prop_crud.get(db, prop_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Prop not found")
    return await prop_crud.update(db, item, data)


@router.delete("/props/{prop_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_prop(
    prop_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await prop_crud.delete(db, prop_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Prop not found")


# ── Prop Transactions ──────────────────────────────────────────────────────


@router.get("/props/{prop_id}/transactions", response_model=list[PropTransactionResponse])
async def list_prop_transactions(
    prop_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await prop_tx_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"prop_id": prop_id},
    )
    return items


@router.post(
    "/props/{prop_id}/transactions",
    response_model=PropTransactionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_prop_transaction(
    prop_id: UUID,
    data: PropTransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    prop = await prop_crud.get(db, prop_id, current_user.organization_id)
    if not prop:
        raise HTTPException(status_code=404, detail="Prop not found")
    return await prop_tx_crud.create(db, data, current_user.organization_id)


# ── Production Sets ────────────────────────────────────────────────────────


@router.get("/sets", response_model=list[ProductionSetResponse])
async def list_sets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await set_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/sets/{set_id}", response_model=ProductionSetResponse)
async def get_set(
    set_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await set_crud.get(db, set_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Production set not found")
    return item


@router.post("/sets", response_model=ProductionSetResponse, status_code=status.HTTP_201_CREATED)
async def create_set(
    data: ProductionSetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await set_crud.create(db, data, current_user.organization_id)


@router.patch("/sets/{set_id}", response_model=ProductionSetResponse)
async def update_set(
    set_id: UUID,
    data: ProductionSetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await set_crud.get(db, set_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Production set not found")
    return await set_crud.update(db, item, data)


@router.delete("/sets/{set_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_set(
    set_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await set_crud.delete(db, set_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Production set not found")


# ── Set Tasks ──────────────────────────────────────────────────────────────


@router.get("/sets/{set_id}/tasks", response_model=list[SetTaskResponse])
async def list_set_tasks(
    set_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await task_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"set_id": set_id},
    )
    return items


@router.post(
    "/sets/{set_id}/tasks",
    response_model=SetTaskResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_set_task(
    set_id: UUID,
    data: SetTaskCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    prod_set = await set_crud.get(db, set_id, current_user.organization_id)
    if not prod_set:
        raise HTTPException(status_code=404, detail="Production set not found")
    return await task_crud.create(db, data, current_user.organization_id)


@router.patch("/sets/{set_id}/tasks/{task_id}", response_model=SetTaskResponse)
async def update_set_task(
    set_id: UUID,
    task_id: UUID,
    data: SetTaskUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await task_crud.get(db, task_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Set task not found")
    return await task_crud.update(db, item, data)


@router.delete("/sets/{set_id}/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_set_task(
    set_id: UUID,
    task_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await task_crud.delete(db, task_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Set task not found")

"""Budgets router — ProjectBudget, DepartmentBudget, BudgetRevision, BudgetLineItem."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.finance import ProjectBudget, DepartmentBudget, BudgetRevision, BudgetLineItem
from ..schemas.finance import (
    ProjectBudgetCreate,
    ProjectBudgetUpdate,
    ProjectBudgetResponse,
    DepartmentBudgetCreate,
    DepartmentBudgetUpdate,
    DepartmentBudgetResponse,
    BudgetRevisionCreate,
    BudgetRevisionResponse,
    BudgetLineItemCreate,
    BudgetLineItemUpdate,
    BudgetLineItemResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
budget_crud = CRUDBase(ProjectBudget)
dept_budget_crud = CRUDBase(DepartmentBudget)
revision_crud = CRUDBase(BudgetRevision)
line_item_crud = CRUDBase(BudgetLineItem)


# ── Project Budgets ────────────────────────────────────────────────────────


@router.get("/", response_model=list[ProjectBudgetResponse])
async def list_budgets(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await budget_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{budget_id}", response_model=ProjectBudgetResponse)
async def get_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await budget_crud.get(db, budget_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Budget not found")
    return item


@router.post("/", response_model=ProjectBudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    data: ProjectBudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await budget_crud.create(db, data, current_user.organization_id)


@router.patch("/{budget_id}", response_model=ProjectBudgetResponse)
async def update_budget(
    budget_id: UUID,
    data: ProjectBudgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await budget_crud.get(db, budget_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Budget not found")
    return await budget_crud.update(db, item, data)


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await budget_crud.delete(db, budget_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Budget not found")


# ── Department Budgets ─────────────────────────────────────────────────────


@router.get("/{budget_id}/departments", response_model=list[DepartmentBudgetResponse])
async def list_department_budgets(
    budget_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await dept_budget_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"project_budget_id": budget_id},
    )
    return items


@router.post(
    "/{budget_id}/departments",
    response_model=DepartmentBudgetResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_department_budget(
    budget_id: UUID,
    data: DepartmentBudgetCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    budget = await budget_crud.get(db, budget_id, current_user.organization_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return await dept_budget_crud.create(db, data, current_user.organization_id)


@router.patch("/{budget_id}/departments/{dept_id}", response_model=DepartmentBudgetResponse)
async def update_department_budget(
    budget_id: UUID,
    dept_id: UUID,
    data: DepartmentBudgetUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await dept_budget_crud.get(db, dept_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Department budget not found")
    return await dept_budget_crud.update(db, item, data)


@router.delete("/{budget_id}/departments/{dept_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_department_budget(
    budget_id: UUID,
    dept_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await dept_budget_crud.delete(db, dept_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Department budget not found")


# ── Budget Revisions ───────────────────────────────────────────────────────


@router.get("/{budget_id}/revisions", response_model=list[BudgetRevisionResponse])
async def list_budget_revisions(
    budget_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await revision_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"project_budget_id": budget_id},
    )
    return items


@router.post(
    "/{budget_id}/revisions",
    response_model=BudgetRevisionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_budget_revision(
    budget_id: UUID,
    data: BudgetRevisionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    budget = await budget_crud.get(db, budget_id, current_user.organization_id)
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    return await revision_crud.create(db, data, current_user.organization_id)


# ── Budget Line Items ──────────────────────────────────────────────────────


@router.get("/line-items/", response_model=list[BudgetLineItemResponse])
async def list_line_items(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await line_item_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.post(
    "/line-items/",
    response_model=BudgetLineItemResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_line_item(
    data: BudgetLineItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await line_item_crud.create(db, data, current_user.organization_id)


@router.patch("/line-items/{item_id}", response_model=BudgetLineItemResponse)
async def update_line_item(
    item_id: UUID,
    data: BudgetLineItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await line_item_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Line item not found")
    return await line_item_crud.update(db, item, data)


@router.delete("/line-items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_line_item(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await line_item_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Line item not found")

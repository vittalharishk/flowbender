"""Reports router — aggregation endpoints (no CRUD base)."""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_any
from ..models.finance import ProjectBudget, DepartmentBudget, BudgetLineItem
from ..models.crew_departments import SetTask, ProductionSet
from ..models.distribution import DistributionRevenue

router = APIRouter()


@router.get("/financial-summary")
async def financial_summary(
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    """Aggregate budget vs spent by project."""
    stmt = (
        select(
            ProjectBudget.project_id,
            func.sum(ProjectBudget.total_budget).label("total_budget"),
        )
        .where(ProjectBudget.organization_id == current_user.organization_id)
        .group_by(ProjectBudget.project_id)
    )
    if project_id:
        stmt = stmt.where(ProjectBudget.project_id == project_id)
    budget_result = await db.execute(stmt)
    budgets = [dict(row._mapping) for row in budget_result]

    dept_stmt = (
        select(
            DepartmentBudget.project_id,
            func.sum(DepartmentBudget.allocated).label("total_allocated"),
            func.sum(DepartmentBudget.committed).label("total_committed"),
            func.sum(DepartmentBudget.spent).label("total_spent"),
        )
        .where(DepartmentBudget.organization_id == current_user.organization_id)
        .group_by(DepartmentBudget.project_id)
    )
    if project_id:
        dept_stmt = dept_stmt.where(DepartmentBudget.project_id == project_id)
    dept_result = await db.execute(dept_stmt)
    dept_data = {row.project_id: dict(row._mapping) for row in dept_result}

    summary = []
    for b in budgets:
        pid = b["project_id"]
        dept = dept_data.get(pid, {})
        summary.append(
            {
                "project_id": str(pid),
                "total_budget": float(b["total_budget"] or 0),
                "total_allocated": float(dept.get("total_allocated") or 0),
                "total_committed": float(dept.get("total_committed") or 0),
                "total_spent": float(dept.get("total_spent") or 0),
            }
        )
    return summary


@router.get("/production-status")
async def production_status(
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    """Aggregate tasks and sets by status."""
    task_stmt = (
        select(
            SetTask.status,
            func.count(SetTask.id).label("count"),
        )
        .where(SetTask.organization_id == current_user.organization_id)
        .group_by(SetTask.status)
    )

    set_stmt = (
        select(
            ProductionSet.status,
            func.count(ProductionSet.id).label("count"),
        )
        .where(ProductionSet.organization_id == current_user.organization_id)
        .group_by(ProductionSet.status)
    )

    if project_id:
        set_stmt = set_stmt.where(ProductionSet.project_id == project_id)

    task_result = await db.execute(task_stmt)
    set_result = await db.execute(set_stmt)

    return {
        "tasks_by_status": {row.status: row.count for row in task_result},
        "sets_by_status": {row.status: row.count for row in set_result},
    }


@router.get("/distribution-summary")
async def distribution_summary(
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    """Aggregate revenue by territory and source channel."""
    territory_stmt = (
        select(
            DistributionRevenue.territory,
            func.sum(DistributionRevenue.amount).label("total_amount"),
            func.sum(DistributionRevenue.net_amount).label("total_net"),
            func.count(DistributionRevenue.id).label("count"),
        )
        .where(DistributionRevenue.organization_id == current_user.organization_id)
        .group_by(DistributionRevenue.territory)
    )

    source_stmt = (
        select(
            DistributionRevenue.source,
            func.sum(DistributionRevenue.amount).label("total_amount"),
            func.sum(DistributionRevenue.net_amount).label("total_net"),
            func.count(DistributionRevenue.id).label("count"),
        )
        .where(DistributionRevenue.organization_id == current_user.organization_id)
        .group_by(DistributionRevenue.source)
    )

    if project_id:
        territory_stmt = territory_stmt.where(DistributionRevenue.project_id == project_id)
        source_stmt = source_stmt.where(DistributionRevenue.project_id == project_id)

    territory_result = await db.execute(territory_stmt)
    source_result = await db.execute(source_stmt)

    return {
        "by_territory": [
            {
                "territory": row.territory,
                "total_amount": float(row.total_amount or 0),
                "total_net": float(row.total_net or 0),
                "count": row.count,
            }
            for row in territory_result
        ],
        "by_channel": [
            {
                "channel": row.source,
                "total_amount": float(row.total_amount or 0),
                "total_net": float(row.total_net or 0),
                "count": row.count,
            }
            for row in source_result
        ],
    }

"""Distribution router — Rights Deals, Agreements, Releases, Revenue, Settlements."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.distribution import (
    RightsDeal,
    DistributionAgreement,
    DistributionRelease,
    DistributionRevenue,
    DistributionSettlement,
)
from ..schemas.distribution import (
    RightsDealCreate,
    RightsDealUpdate,
    RightsDealResponse,
    DistributionAgreementCreate,
    DistributionAgreementUpdate,
    DistributionAgreementResponse,
    DistributionReleaseCreate,
    DistributionReleaseUpdate,
    DistributionReleaseResponse,
    DistributionRevenueCreate,
    DistributionRevenueUpdate,
    DistributionRevenueResponse,
    DistributionSettlementCreate,
    DistributionSettlementUpdate,
    DistributionSettlementResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
rights_crud = CRUDBase(RightsDeal)
agreement_crud = CRUDBase(DistributionAgreement)
release_crud = CRUDBase(DistributionRelease)
revenue_crud = CRUDBase(DistributionRevenue)
settlement_crud = CRUDBase(DistributionSettlement)


# ── Rights Deals ───────────────────────────────────────────────────────────


@router.get("/rights-deals/", response_model=list[RightsDealResponse])
async def list_rights_deals(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await rights_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/rights-deals/{deal_id}", response_model=RightsDealResponse)
async def get_rights_deal(
    deal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await rights_crud.get(db, deal_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Rights deal not found")
    return item


@router.post("/rights-deals/", response_model=RightsDealResponse, status_code=status.HTTP_201_CREATED)
async def create_rights_deal(
    data: RightsDealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await rights_crud.create(db, data, current_user.organization_id)


@router.patch("/rights-deals/{deal_id}", response_model=RightsDealResponse)
async def update_rights_deal(
    deal_id: UUID,
    data: RightsDealUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await rights_crud.get(db, deal_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Rights deal not found")
    return await rights_crud.update(db, item, data)


@router.delete("/rights-deals/{deal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_rights_deal(
    deal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await rights_crud.delete(db, deal_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rights deal not found")


# ── Agreements ─────────────────────────────────────────────────────────────


@router.get("/agreements/", response_model=list[DistributionAgreementResponse])
async def list_agreements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await agreement_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/agreements/{agreement_id}", response_model=DistributionAgreementResponse)
async def get_agreement(
    agreement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await agreement_crud.get(db, agreement_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return item


@router.post("/agreements/", response_model=DistributionAgreementResponse, status_code=status.HTTP_201_CREATED)
async def create_agreement(
    data: DistributionAgreementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await agreement_crud.create(db, data, current_user.organization_id)


@router.patch("/agreements/{agreement_id}", response_model=DistributionAgreementResponse)
async def update_agreement(
    agreement_id: UUID,
    data: DistributionAgreementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await agreement_crud.get(db, agreement_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Agreement not found")
    return await agreement_crud.update(db, item, data)


@router.delete("/agreements/{agreement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_agreement(
    agreement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await agreement_crud.delete(db, agreement_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Agreement not found")


# ── Releases ───────────────────────────────────────────────────────────────


@router.get("/releases/", response_model=list[DistributionReleaseResponse])
async def list_releases(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await release_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/releases/{release_id}", response_model=DistributionReleaseResponse)
async def get_release(
    release_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await release_crud.get(db, release_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Release not found")
    return item


@router.post("/releases/", response_model=DistributionReleaseResponse, status_code=status.HTTP_201_CREATED)
async def create_release(
    data: DistributionReleaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await release_crud.create(db, data, current_user.organization_id)


@router.patch("/releases/{release_id}", response_model=DistributionReleaseResponse)
async def update_release(
    release_id: UUID,
    data: DistributionReleaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await release_crud.get(db, release_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Release not found")
    return await release_crud.update(db, item, data)


@router.delete("/releases/{release_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_release(
    release_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await release_crud.delete(db, release_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Release not found")


# ── Revenue ────────────────────────────────────────────────────────────────


@router.get("/revenue/", response_model=list[DistributionRevenueResponse])
async def list_revenue(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await revenue_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/revenue/{revenue_id}", response_model=DistributionRevenueResponse)
async def get_revenue(
    revenue_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await revenue_crud.get(db, revenue_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Revenue entry not found")
    return item


@router.post("/revenue/", response_model=DistributionRevenueResponse, status_code=status.HTTP_201_CREATED)
async def create_revenue(
    data: DistributionRevenueCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await revenue_crud.create(db, data, current_user.organization_id)


@router.patch("/revenue/{revenue_id}", response_model=DistributionRevenueResponse)
async def update_revenue(
    revenue_id: UUID,
    data: DistributionRevenueUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await revenue_crud.get(db, revenue_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Revenue entry not found")
    return await revenue_crud.update(db, item, data)


@router.delete("/revenue/{revenue_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_revenue(
    revenue_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await revenue_crud.delete(db, revenue_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Revenue entry not found")


# ── Settlements ────────────────────────────────────────────────────────────


@router.get("/settlements/", response_model=list[DistributionSettlementResponse])
async def list_settlements(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await settlement_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/settlements/{settlement_id}", response_model=DistributionSettlementResponse)
async def get_settlement(
    settlement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await settlement_crud.get(db, settlement_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Settlement not found")
    return item


@router.post("/settlements/", response_model=DistributionSettlementResponse, status_code=status.HTTP_201_CREATED)
async def create_settlement(
    data: DistributionSettlementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await settlement_crud.create(db, data, current_user.organization_id)


@router.patch("/settlements/{settlement_id}", response_model=DistributionSettlementResponse)
async def update_settlement(
    settlement_id: UUID,
    data: DistributionSettlementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await settlement_crud.get(db, settlement_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Settlement not found")
    return await settlement_crud.update(db, item, data)


@router.delete("/settlements/{settlement_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_settlement(
    settlement_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await settlement_crud.delete(db, settlement_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Settlement not found")

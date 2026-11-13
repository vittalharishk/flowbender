"""Insurance router — InsurancePolicy CRUD + InsuranceClaim sub-routes."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..models.finance import InsurancePolicy, InsuranceClaim
from ..schemas.finance import (
    InsurancePolicyCreate,
    InsurancePolicyUpdate,
    InsurancePolicyResponse,
    InsuranceClaimCreate,
    InsuranceClaimUpdate,
    InsuranceClaimResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
policy_crud = CRUDBase(InsurancePolicy)
claim_crud = CRUDBase(InsuranceClaim)


# ── Policies ───────────────────────────────────────────────────────────────


@router.get("/", response_model=list[InsurancePolicyResponse])
async def list_policies(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await policy_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{policy_id}", response_model=InsurancePolicyResponse)
async def get_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await policy_crud.get(db, policy_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    return item


@router.post("/", response_model=InsurancePolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(
    data: InsurancePolicyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await policy_crud.create(db, data, current_user.organization_id)


@router.patch("/{policy_id}", response_model=InsurancePolicyResponse)
async def update_policy(
    policy_id: UUID,
    data: InsurancePolicyUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await policy_crud.get(db, policy_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    return await policy_crud.update(db, item, data)


@router.delete("/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(
    policy_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await policy_crud.delete(db, policy_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Insurance policy not found")


# ── Claims ─────────────────────────────────────────────────────────────────


@router.get("/{policy_id}/claims", response_model=list[InsuranceClaimResponse])
async def list_claims(
    policy_id: UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, _ = await claim_crud.get_multi(
        db,
        current_user.organization_id,
        skip=skip,
        limit=limit,
        filters={"policy_id": policy_id},
    )
    return items


@router.post(
    "/{policy_id}/claims",
    response_model=InsuranceClaimResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_claim(
    policy_id: UUID,
    data: InsuranceClaimCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    policy = await policy_crud.get(db, policy_id, current_user.organization_id)
    if not policy:
        raise HTTPException(status_code=404, detail="Insurance policy not found")
    return await claim_crud.create(db, data, current_user.organization_id)


@router.patch("/{policy_id}/claims/{claim_id}", response_model=InsuranceClaimResponse)
async def update_claim(
    policy_id: UUID,
    claim_id: UUID,
    data: InsuranceClaimUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await claim_crud.get(db, claim_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Claim not found")
    return await claim_crud.update(db, item, data)


@router.delete("/{policy_id}/claims/{claim_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_claim(
    policy_id: UUID,
    claim_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await claim_crud.delete(db, claim_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Claim not found")

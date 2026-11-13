"""Crew router: CrewMember CRUD + sub-routes for assignments, remuneration, payments."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..services.crud import CRUDBase
from ..models.crew import CrewMember, CrewAssignment, RemunerationAgreement, CrewPaymentRecord
from ..schemas.crew import (
    CrewMemberCreate, CrewMemberUpdate, CrewMemberResponse,
    CrewAssignmentCreate, CrewAssignmentResponse,
    RemunerationAgreementCreate, RemunerationAgreementResponse,
    CrewPaymentCreate, CrewPaymentResponse,
)

router = APIRouter()

crew_crud = CRUDBase(CrewMember)
assignment_crud = CRUDBase(CrewAssignment)
remuneration_crud = CRUDBase(RemunerationAgreement)
payment_crud = CRUDBase(CrewPaymentRecord)


# ---------------------------------------------------------------------------
# Crew Members
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[CrewMemberResponse])
async def list_crew_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await crew_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=CrewMemberResponse)
async def get_crew_member(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await crew_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=CrewMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_crew_member(
    data: CrewMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await crew_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=CrewMemberResponse)
async def update_crew_member(
    item_id: UUID,
    data: CrewMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await crew_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await crew_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_crew_member(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await crew_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ---------------------------------------------------------------------------
# Assignments
# ---------------------------------------------------------------------------

@router.get("/assignments/", response_model=list[CrewAssignmentResponse])
async def list_assignments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await assignment_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/assignments/{item_id}", response_model=CrewAssignmentResponse)
async def get_assignment(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await assignment_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/assignments/", response_model=CrewAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    data: CrewAssignmentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await assignment_crud.create(db, data, current_user.organization_id)


@router.delete("/assignments/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await assignment_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ---------------------------------------------------------------------------
# Remuneration Agreements
# ---------------------------------------------------------------------------

@router.get("/remuneration/", response_model=list[RemunerationAgreementResponse])
async def list_remuneration(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await remuneration_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/remuneration/{item_id}", response_model=RemunerationAgreementResponse)
async def get_remuneration(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await remuneration_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/remuneration/", response_model=RemunerationAgreementResponse, status_code=status.HTTP_201_CREATED)
async def create_remuneration(
    data: RemunerationAgreementCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await remuneration_crud.create(db, data, current_user.organization_id)


@router.delete("/remuneration/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_remuneration(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await remuneration_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ---------------------------------------------------------------------------
# Payments
# ---------------------------------------------------------------------------

@router.get("/payments/", response_model=list[CrewPaymentResponse])
async def list_payments(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await payment_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/payments/{item_id}", response_model=CrewPaymentResponse)
async def get_payment(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await payment_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/payments/", response_model=CrewPaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    data: CrewPaymentCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await payment_crud.create(db, data, current_user.organization_id)


@router.delete("/payments/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_payment(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await payment_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")

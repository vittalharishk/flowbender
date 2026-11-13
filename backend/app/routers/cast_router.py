"""Cast router: CastMember CRUD + sub-routes for contracts, candidates, character profiles."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_any
from ..services.crud import CRUDBase
from ..models.cast import CastMember, CastContract, CastCandidate, CharacterProfile
from ..schemas.cast import (
    CastMemberCreate, CastMemberUpdate, CastMemberResponse,
    CastContractCreate, CastContractResponse,
    CastCandidateCreate, CastCandidateResponse,
    CharacterProfileCreate, CharacterProfileResponse,
)

# Re-use CastCandidateCreate for updates until a dedicated Update schema is added
CastCandidateUpdate = CastCandidateCreate

router = APIRouter()

cast_crud = CRUDBase(CastMember)
contract_crud = CRUDBase(CastContract)
candidate_crud = CRUDBase(CastCandidate)
profile_crud = CRUDBase(CharacterProfile)


# ---------------------------------------------------------------------------
# Cast Members
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[CastMemberResponse])
async def list_cast_members(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await cast_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/{item_id}", response_model=CastMemberResponse)
async def get_cast_member(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await cast_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/", response_model=CastMemberResponse, status_code=status.HTTP_201_CREATED)
async def create_cast_member(
    data: CastMemberCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await cast_crud.create(db, data, current_user.organization_id)


@router.patch("/{item_id}", response_model=CastMemberResponse)
async def update_cast_member(
    item_id: UUID,
    data: CastMemberUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await cast_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await cast_crud.update(db, item, data)


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_cast_member(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await cast_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ---------------------------------------------------------------------------
# Contracts
# ---------------------------------------------------------------------------

@router.get("/contracts/", response_model=list[CastContractResponse])
async def list_contracts(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await contract_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/contracts/{item_id}", response_model=CastContractResponse)
async def get_contract(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await contract_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/contracts/", response_model=CastContractResponse, status_code=status.HTTP_201_CREATED)
async def create_contract(
    data: CastContractCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await contract_crud.create(db, data, current_user.organization_id)


@router.delete("/contracts/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_contract(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    deleted = await contract_crud.delete(db, item_id, current_user.organization_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Not found")


# ---------------------------------------------------------------------------
# Candidates
# ---------------------------------------------------------------------------

@router.get("/candidates/", response_model=list[CastCandidateResponse])
async def list_candidates(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await candidate_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/candidates/{item_id}", response_model=CastCandidateResponse)
async def get_candidate(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await candidate_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/candidates/", response_model=CastCandidateResponse, status_code=status.HTTP_201_CREATED)
async def create_candidate(
    data: CastCandidateCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await candidate_crud.create(db, data, current_user.organization_id)


@router.patch("/candidates/{item_id}", response_model=CastCandidateResponse)
async def update_candidate(
    item_id: UUID,
    data: CastCandidateUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    item = await candidate_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return await candidate_crud.update(db, item, data)


# ---------------------------------------------------------------------------
# Character Profiles
# ---------------------------------------------------------------------------

@router.get("/character-profiles/", response_model=list[CharacterProfileResponse])
async def list_character_profiles(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    items, total = await profile_crud.get_multi(
        db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id
    )
    return items


@router.get("/character-profiles/{item_id}", response_model=CharacterProfileResponse)
async def get_character_profile(
    item_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_any),
):
    item = await profile_crud.get(db, item_id, current_user.organization_id)
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    return item


@router.post("/character-profiles/", response_model=CharacterProfileResponse, status_code=status.HTTP_201_CREATED)
async def create_character_profile(
    data: CharacterProfileCreate,
    db: AsyncSession = Depends(get_db),
    current_user: CurrentUser = Depends(require_staff),
):
    return await profile_crud.create(db, data, current_user.organization_id)

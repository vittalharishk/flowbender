"""Teams and Departments router."""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from ..auth.dependencies import CurrentUser, require_staff, require_admin, require_any
from ..models.teams import (
    Department, TeamMember, TeamProjectAssignment,
    UserProjectAccess, UserDepartmentAccess,
)
from ..schemas.teams import (
    DepartmentCreate, DepartmentUpdate, DepartmentResponse,
    TeamMemberCreate, TeamMemberUpdate, TeamMemberResponse,
    TeamProjectAssignmentCreate, TeamProjectAssignmentUpdate, TeamProjectAssignmentResponse,
    UserProjectAccessCreate, UserProjectAccessUpdate, UserProjectAccessResponse,
    UserDepartmentAccessCreate, UserDepartmentAccessUpdate, UserDepartmentAccessResponse,
)
from ..services.crud import CRUDBase

router = APIRouter()
dept_crud = CRUDBase(Department)
member_crud = CRUDBase(TeamMember)
assign_crud = CRUDBase(TeamProjectAssignment)
proj_access_crud = CRUDBase(UserProjectAccess)
dept_access_crud = CRUDBase(UserDepartmentAccess)


# ── Departments ────────────────────────────────────────────────────────────

@router.get("/departments/", response_model=list[DepartmentResponse])
async def list_departments(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await dept_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit)
    return items

@router.get("/departments/{id}", response_model=DepartmentResponse)
async def get_department(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await dept_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Department not found")
    return obj

@router.post("/departments/", response_model=DepartmentResponse, status_code=201)
async def create_department(data: DepartmentCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    return await dept_crud.create(db, data, current_user.organization_id)

@router.patch("/departments/{id}", response_model=DepartmentResponse)
async def update_department(id: UUID, data: DepartmentUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    obj = await dept_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Department not found")
    return await dept_crud.update(db, obj, data)

@router.delete("/departments/{id}", status_code=204)
async def delete_department(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    if not await dept_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Department not found")


# ── Team Members ───────────────────────────────────────────────────────────

@router.get("/members/", response_model=list[TeamMemberResponse])
async def list_members(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    department_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    items, _ = await member_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, filters=filters or None)
    return items

@router.get("/members/{id}", response_model=TeamMemberResponse)
async def get_member(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any)):
    obj = await member_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Team member not found")
    return obj

@router.post("/members/", response_model=TeamMemberResponse, status_code=201)
async def create_member(data: TeamMemberCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await member_crud.create(db, data, current_user.organization_id)

@router.patch("/members/{id}", response_model=TeamMemberResponse)
async def update_member(id: UUID, data: TeamMemberUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await member_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Team member not found")
    return await member_crud.update(db, obj, data)

@router.delete("/members/{id}", status_code=204)
async def delete_member(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await member_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Team member not found")


# ── Project Assignments ────────────────────────────────────────────────────

@router.get("/assignments/", response_model=list[TeamProjectAssignmentResponse])
async def list_assignments(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    items, _ = await assign_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, project_id=project_id)
    return items

@router.post("/assignments/", response_model=TeamProjectAssignmentResponse, status_code=201)
async def create_assignment(data: TeamProjectAssignmentCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    return await assign_crud.create(db, data, current_user.organization_id)

@router.patch("/assignments/{id}", response_model=TeamProjectAssignmentResponse)
async def update_assignment(id: UUID, data: TeamProjectAssignmentUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    obj = await assign_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Assignment not found")
    return await assign_crud.update(db, obj, data)

@router.delete("/assignments/{id}", status_code=204)
async def delete_assignment(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_staff)):
    if not await assign_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Assignment not found")


# ── User Project Access (RBAC) ────────────────────────────────────────────

@router.get("/project-access/", response_model=list[UserProjectAccessResponse])
async def list_project_access(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    project_id: UUID | None = None, user_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    filters = {}
    if project_id:
        filters["project_id"] = project_id
    if user_id:
        filters["user_id"] = user_id
    items, _ = await proj_access_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, filters=filters or None)
    return items

@router.post("/project-access/", response_model=UserProjectAccessResponse, status_code=201)
async def create_project_access(data: UserProjectAccessCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    return await proj_access_crud.create(db, data, current_user.organization_id, granted_by=current_user.user_id)

@router.patch("/project-access/{id}", response_model=UserProjectAccessResponse)
async def update_project_access(id: UUID, data: UserProjectAccessUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    obj = await proj_access_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Access record not found")
    return await proj_access_crud.update(db, obj, data)

@router.delete("/project-access/{id}", status_code=204)
async def delete_project_access(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    if not await proj_access_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Access record not found")


# ── User Department Access ─────────────────────────────────────────────────

@router.get("/department-access/", response_model=list[UserDepartmentAccessResponse])
async def list_department_access(
    skip: int = Query(0, ge=0), limit: int = Query(50, ge=1, le=200),
    department_id: UUID | None = None, user_id: UUID | None = None,
    db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_any),
):
    filters = {}
    if department_id:
        filters["department_id"] = department_id
    if user_id:
        filters["user_id"] = user_id
    items, _ = await dept_access_crud.get_multi(db, current_user.organization_id, skip=skip, limit=limit, filters=filters or None)
    return items

@router.post("/department-access/", response_model=UserDepartmentAccessResponse, status_code=201)
async def create_department_access(data: UserDepartmentAccessCreate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    return await dept_access_crud.create(db, data, current_user.organization_id, granted_by=current_user.user_id)

@router.patch("/department-access/{id}", response_model=UserDepartmentAccessResponse)
async def update_department_access(id: UUID, data: UserDepartmentAccessUpdate, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    obj = await dept_access_crud.get(db, id, current_user.organization_id)
    if not obj:
        raise HTTPException(status_code=404, detail="Access record not found")
    return await dept_access_crud.update(db, obj, data)

@router.delete("/department-access/{id}", status_code=204)
async def delete_department_access(id: UUID, db: AsyncSession = Depends(get_db), current_user: CurrentUser = Depends(require_admin)):
    if not await dept_access_crud.delete(db, id, current_user.organization_id):
        raise HTTPException(status_code=404, detail="Access record not found")

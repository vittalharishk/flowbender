"""Teams and department management schemas."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Departments ────────────────────────────────────────────────────────────

class DepartmentCreate(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None

class DepartmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    name: str
    code: str
    description: Optional[str] = None
    is_active: bool
    created_at: datetime


# ── Team Members ───────────────────────────────────────────────────────────

class TeamMemberCreate(BaseModel):
    department_id: UUID
    user_id: Optional[UUID] = None
    employee_id: Optional[str] = None
    name: str
    designation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    reporting_manager_id: Optional[UUID] = None
    joining_date: Optional[date] = None
    responsibilities: Optional[str] = None

class TeamMemberUpdate(BaseModel):
    department_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    employee_id: Optional[str] = None
    name: Optional[str] = None
    designation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    reporting_manager_id: Optional[UUID] = None
    joining_date: Optional[date] = None
    availability: Optional[str] = None
    status: Optional[str] = None
    responsibilities: Optional[str] = None

class TeamMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    department_id: UUID
    user_id: Optional[UUID] = None
    employee_id: Optional[str] = None
    name: str
    designation: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    reporting_manager_id: Optional[UUID] = None
    joining_date: Optional[date] = None
    availability: str
    status: str
    responsibilities: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Team Project Assignments ───────────────────────────────────────────────

class TeamProjectAssignmentCreate(BaseModel):
    member_id: UUID
    project_id: UUID
    role_in_project: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None

class TeamProjectAssignmentUpdate(BaseModel):
    role_in_project: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: Optional[bool] = None

class TeamProjectAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    member_id: UUID
    project_id: UUID
    role_in_project: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    is_active: bool
    created_at: datetime


# ── User Project Access ────────────────────────────────────────────────────

class UserProjectAccessCreate(BaseModel):
    user_id: UUID
    project_id: UUID
    access_level: str = "view"
    module_permissions: Optional[dict] = None

class UserProjectAccessUpdate(BaseModel):
    access_level: Optional[str] = None
    module_permissions: Optional[dict] = None
    is_active: Optional[bool] = None

class UserProjectAccessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    project_id: UUID
    access_level: str
    module_permissions: Optional[dict] = None
    granted_by: Optional[UUID] = None
    granted_at: datetime
    revoked_at: Optional[datetime] = None
    is_active: bool


# ── User Department Access ─────────────────────────────────────────────────

class UserDepartmentAccessCreate(BaseModel):
    user_id: UUID
    department_id: UUID
    access_level: str = "view"

class UserDepartmentAccessUpdate(BaseModel):
    access_level: Optional[str] = None
    is_active: Optional[bool] = None

class UserDepartmentAccessResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: UUID
    user_id: UUID
    department_id: UUID
    access_level: str
    is_active: bool
    granted_at: datetime

"""Schedule schemas: Entries, Shoot Days, Call Sheets, Attendance, Catering."""

import datetime as _dt
from datetime import date, datetime, time
from typing import Any, Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ---------------------------------------------------------------------------
# Schedule Entry
# ---------------------------------------------------------------------------

class ScheduleEntryBase(BaseModel):
    project_id: UUID
    date: date
    call_time: Optional[time] = None
    location: Optional[str] = None
    scenes: Optional[list] = None
    shoot_day_number: Optional[int] = None
    status: str = "scheduled"


class ScheduleEntryCreate(ScheduleEntryBase):
    pass


class ScheduleEntryUpdate(BaseModel):
    project_id: Optional[UUID] = None
    date: Optional[_dt.date] = None
    call_time: Optional[time] = None
    location: Optional[str] = None
    scenes: Optional[list] = None
    shoot_day_number: Optional[int] = None
    status: Optional[str] = None


class ScheduleEntryResponse(ScheduleEntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Shoot Day
# ---------------------------------------------------------------------------

class ShootDayBase(BaseModel):
    project_id: UUID
    day_number: int
    date: date
    location: Optional[str] = None
    status: str = "scheduled"
    scenes_planned: Optional[list] = None
    notes: Optional[str] = None


class ShootDayCreate(ShootDayBase):
    pass


class ShootDayUpdate(BaseModel):
    project_id: Optional[UUID] = None
    day_number: Optional[int] = None
    date: Optional[_dt.date] = None
    location: Optional[str] = None
    status: Optional[str] = None
    scenes_planned: Optional[list] = None
    notes: Optional[str] = None


class ShootDayResponse(ShootDayBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Call Sheet
# ---------------------------------------------------------------------------

class CallSheetBase(BaseModel):
    project_id: UUID
    shoot_day_id: Optional[UUID] = None
    title: str
    date: date
    call_time: Optional[time] = None
    location: Optional[str] = None
    status: str = "draft"
    cast_call: Optional[Any] = None
    crew_call: Optional[Any] = None


class CallSheetCreate(CallSheetBase):
    pass


class CallSheetUpdate(BaseModel):
    project_id: Optional[UUID] = None
    shoot_day_id: Optional[UUID] = None
    title: Optional[str] = None
    date: Optional[_dt.date] = None
    call_time: Optional[time] = None
    location: Optional[str] = None
    status: Optional[str] = None
    cast_call: Optional[Any] = None
    crew_call: Optional[Any] = None


class CallSheetResponse(CallSheetBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime
    updated_at: datetime


# ---------------------------------------------------------------------------
# Attendance Record
# ---------------------------------------------------------------------------

class AttendanceRecordBase(BaseModel):
    project_id: UUID
    date: date
    person_id: str
    person_type: str
    status: str = "present"
    check_in_time: Optional[datetime] = None
    check_out_time: Optional[datetime] = None
    notes: Optional[str] = None


class AttendanceRecordCreate(AttendanceRecordBase):
    pass


class AttendanceRecordResponse(AttendanceRecordBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime


# ---------------------------------------------------------------------------
# Catering Adjustment
# ---------------------------------------------------------------------------

class CateringAdjustmentBase(BaseModel):
    project_id: UUID
    date: date
    adjustment_type: str
    count: int
    notes: Optional[str] = None


class CateringAdjustmentCreate(CateringAdjustmentBase):
    pass


class CateringAdjustmentResponse(CateringAdjustmentBase):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    created_at: datetime

"""Crew Departments sub-module schemas."""

from datetime import date, datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, ConfigDict


# ── Rental Vendors ──────────────────────────────────────────────────────────

class RentalVendorCreate(BaseModel):
    name: str
    category: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    status: str = "active"


class RentalVendorUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    status: Optional[str] = None


class RentalVendorResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    category: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    gst_number: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Rental Records ──────────────────────────────────────────────────────────

class RentalRecordCreate(BaseModel):
    project_id: UUID
    vendor_id: Optional[UUID] = None
    category: str
    item_description: str
    quantity: int = 1
    rate: float
    duration_days: int
    total_rental_cost: float
    deposit_amount: float = 0
    status: str = "active"
    start_date: date
    end_date: Optional[date] = None


class RentalRecordUpdate(BaseModel):
    project_id: Optional[UUID] = None
    vendor_id: Optional[UUID] = None
    category: Optional[str] = None
    item_description: Optional[str] = None
    quantity: Optional[int] = None
    rate: Optional[float] = None
    duration_days: Optional[int] = None
    total_rental_cost: Optional[float] = None
    deposit_amount: Optional[float] = None
    status: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None


class RentalRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    vendor_id: Optional[UUID] = None
    category: str
    item_description: str
    quantity: int
    rate: float
    duration_days: int
    total_rental_cost: float
    deposit_amount: float
    status: str
    start_date: date
    end_date: Optional[date] = None
    created_at: datetime
    updated_at: datetime


# ── Rental Payments ─────────────────────────────────────────────────────────

class RentalPaymentCreate(BaseModel):
    rental_record_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    payment_method: Optional[str] = None


class RentalPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    rental_record_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime


# ── Production Expenses ─────────────────────────────────────────────────────

class ProductionExpenseCreate(BaseModel):
    project_id: UUID
    category: str
    description: str
    amount: float
    final_amount: Optional[float] = None
    status: str = "draft"
    vendor_id: Optional[UUID] = None
    notes: Optional[str] = None


class ProductionExpenseUpdate(BaseModel):
    project_id: Optional[UUID] = None
    category: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    final_amount: Optional[float] = None
    status: Optional[str] = None
    vendor_id: Optional[UUID] = None
    notes: Optional[str] = None


class ProductionExpenseResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    category: str
    description: str
    amount: float
    final_amount: Optional[float] = None
    status: str
    vendor_id: Optional[UUID] = None
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Expense Payments ────────────────────────────────────────────────────────

class ExpensePaymentCreate(BaseModel):
    expense_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    payment_method: Optional[str] = None


class ExpensePaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    expense_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    payment_method: Optional[str] = None
    created_at: datetime


# ── Office Rentals ──────────────────────────────────────────────────────────

class OfficeRentalCreate(BaseModel):
    project_id: UUID
    location: str
    monthly_rent: float
    deposit: float = 0
    start_date: date
    end_date: Optional[date] = None
    status: str = "active"


class OfficeRentalUpdate(BaseModel):
    project_id: Optional[UUID] = None
    location: Optional[str] = None
    monthly_rent: Optional[float] = None
    deposit: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class OfficeRentalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    location: str
    monthly_rent: float
    deposit: float
    start_date: date
    end_date: Optional[date] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Office Rent Payments ────────────────────────────────────────────────────

class OfficeRentPaymentCreate(BaseModel):
    office_rental_id: UUID
    amount: float
    month: str
    payment_date: date
    payment_ref: Optional[str] = None


class OfficeRentPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    office_rental_id: UUID
    amount: float
    month: str
    payment_date: date
    payment_ref: Optional[str] = None
    created_at: datetime


# ── Maintenance Records ────────────────────────────────────────────────────

class MaintenanceRecordCreate(BaseModel):
    project_id: UUID
    item: str
    description: Optional[str] = None
    estimated_cost: float = 0
    actual_cost: float = 0
    status: str = "pending"
    date: date


class MaintenanceRecordResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    item: str
    description: Optional[str] = None
    estimated_cost: float
    actual_cost: float
    status: str
    date: date
    created_at: datetime


# ── Film Locations ──────────────────────────────────────────────────────────

class FilmLocationCreate(BaseModel):
    project_id: UUID
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: str = "scouting"
    notes: Optional[str] = None


class FilmLocationUpdate(BaseModel):
    project_id: Optional[UUID] = None
    name: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class FilmLocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    category: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Location Scouting ───────────────────────────────────────────────────────

class LocationScoutingCreate(BaseModel):
    location_id: UUID
    scout_date: date
    scout_by: Optional[str] = None
    status: str = "planned"
    notes: Optional[str] = None
    estimated_cost: float = 0


class LocationScoutingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    location_id: UUID
    scout_date: date
    scout_by: Optional[str] = None
    status: str
    notes: Optional[str] = None
    estimated_cost: float
    created_at: datetime


# ── Location Agreements ─────────────────────────────────────────────────────

class LocationAgreementCreate(BaseModel):
    location_id: UUID
    project_id: UUID
    agreed_amount: float
    deposit: float = 0
    start_date: date
    end_date: Optional[date] = None
    status: str = "draft"


class LocationAgreementUpdate(BaseModel):
    location_id: Optional[UUID] = None
    project_id: Optional[UUID] = None
    agreed_amount: Optional[float] = None
    deposit: Optional[float] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[str] = None


class LocationAgreementResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    location_id: UUID
    project_id: UUID
    agreed_amount: float
    deposit: float
    start_date: date
    end_date: Optional[date] = None
    status: str
    created_at: datetime
    updated_at: datetime


# ── Location Payments ───────────────────────────────────────────────────────

class LocationPaymentCreate(BaseModel):
    agreement_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    payment_type: Optional[str] = None


class LocationPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    agreement_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    payment_type: Optional[str] = None
    created_at: datetime


# ── Hotels ──────────────────────────────────────────────────────────────────

class HotelCreate(BaseModel):
    name: str
    city: str
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    star_rating: Optional[int] = None


class HotelResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    city: str
    address: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    star_rating: Optional[int] = None
    created_at: datetime


# ── Hotel Bookings ──────────────────────────────────────────────────────────

class HotelBookingCreate(BaseModel):
    project_id: UUID
    hotel_id: UUID
    guest_name: str
    guest_type: str = "crew"
    room_type: Optional[str] = None
    check_in: date
    check_out: date
    rate_per_night: float
    total_amount: float
    deposit: float = 0
    status: str = "confirmed"


class HotelBookingUpdate(BaseModel):
    project_id: Optional[UUID] = None
    hotel_id: Optional[UUID] = None
    guest_name: Optional[str] = None
    guest_type: Optional[str] = None
    room_type: Optional[str] = None
    check_in: Optional[date] = None
    check_out: Optional[date] = None
    rate_per_night: Optional[float] = None
    total_amount: Optional[float] = None
    deposit: Optional[float] = None
    status: Optional[str] = None


class HotelBookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    hotel_id: UUID
    guest_name: str
    guest_type: str
    room_type: Optional[str] = None
    check_in: date
    check_out: date
    rate_per_night: float
    total_amount: float
    deposit: float
    status: str
    created_at: datetime
    updated_at: datetime


# ── Hotel Payments ──────────────────────────────────────────────────────────

class HotelPaymentCreate(BaseModel):
    booking_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None


class HotelPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    booking_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    created_at: datetime


# ── Trips / Travel ──────────────────────────────────────────────────────────

class TripCreate(BaseModel):
    project_id: UUID
    traveler_name: str
    traveler_type: Optional[str] = None
    category: str = "cab"
    origin: str
    destination: str
    travel_date: date
    return_date: Optional[date] = None
    total_cost: float
    status: str = "planned"


class TripUpdate(BaseModel):
    project_id: Optional[UUID] = None
    traveler_name: Optional[str] = None
    traveler_type: Optional[str] = None
    category: Optional[str] = None
    origin: Optional[str] = None
    destination: Optional[str] = None
    travel_date: Optional[date] = None
    return_date: Optional[date] = None
    total_cost: Optional[float] = None
    status: Optional[str] = None


class TripResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    traveler_name: str
    traveler_type: Optional[str] = None
    category: str
    origin: str
    destination: str
    travel_date: date
    return_date: Optional[date] = None
    total_cost: float
    status: str
    created_at: datetime
    updated_at: datetime


# ── Travel Payments ─────────────────────────────────────────────────────────

class TravelPaymentCreate(BaseModel):
    trip_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None


class TravelPaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    trip_id: UUID
    amount: float
    payment_date: date
    payment_ref: Optional[str] = None
    created_at: datetime


# ── Prop Items ──────────────────────────────────────────────────────────────

class PropItemCreate(BaseModel):
    project_id: UUID
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    purchase_cost: float = 0
    rental_cost: float = 0
    status: str = "available"
    vendor: Optional[str] = None


class PropItemUpdate(BaseModel):
    project_id: Optional[UUID] = None
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    purchase_cost: Optional[float] = None
    rental_cost: Optional[float] = None
    status: Optional[str] = None
    vendor: Optional[str] = None


class PropItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    category: Optional[str] = None
    description: Optional[str] = None
    purchase_cost: float
    rental_cost: float
    status: str
    vendor: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Production Sets ─────────────────────────────────────────────────────────

class ProductionSetCreate(BaseModel):
    project_id: UUID
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: str = "planned"
    estimated_cost: float = 0


class ProductionSetUpdate(BaseModel):
    project_id: Optional[UUID] = None
    name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    estimated_cost: Optional[float] = None


class ProductionSetResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: str
    estimated_cost: float
    created_at: datetime
    updated_at: datetime


# ── Production Vehicles ─────────────────────────────────────────────────────

class ProductionVehicleCreate(BaseModel):
    project_id: UUID
    type: str
    registration_number: Optional[str] = None
    driver_name: Optional[str] = None
    daily_rate: float = 0
    status: str = "available"


class ProductionVehicleUpdate(BaseModel):
    project_id: Optional[UUID] = None
    type: Optional[str] = None
    registration_number: Optional[str] = None
    driver_name: Optional[str] = None
    daily_rate: Optional[float] = None
    status: Optional[str] = None


class ProductionVehicleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    type: str
    registration_number: Optional[str] = None
    driver_name: Optional[str] = None
    daily_rate: float
    status: str
    created_at: datetime
    updated_at: datetime


# ── Caravans ────────────────────────────────────────────────────────────────

class CaravanCreate(BaseModel):
    project_id: UUID
    type: str
    registration_number: Optional[str] = None
    capacity: Optional[int] = None
    daily_rate: float = 0
    total_rental_cost: float = 0
    deposit_paid: float = 0
    status: str = "available"


class CaravanUpdate(BaseModel):
    project_id: Optional[UUID] = None
    type: Optional[str] = None
    registration_number: Optional[str] = None
    capacity: Optional[int] = None
    daily_rate: Optional[float] = None
    total_rental_cost: Optional[float] = None
    deposit_paid: Optional[float] = None
    status: Optional[str] = None


class CaravanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    type: str
    registration_number: Optional[str] = None
    capacity: Optional[int] = None
    daily_rate: float
    total_rental_cost: float
    deposit_paid: float
    status: str
    created_at: datetime
    updated_at: datetime


# ── Stunt Plans ─────────────────────────────────────────────────────────────

class StuntPlanCreate(BaseModel):
    project_id: UUID
    scene_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    risk_level: str = "medium"
    status: str = "planned"
    coordinator: Optional[str] = None


class StuntPlanUpdate(BaseModel):
    project_id: Optional[UUID] = None
    scene_id: Optional[UUID] = None
    title: Optional[str] = None
    description: Optional[str] = None
    risk_level: Optional[str] = None
    status: Optional[str] = None
    coordinator: Optional[str] = None


class StuntPlanResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    scene_id: Optional[UUID] = None
    title: str
    description: Optional[str] = None
    risk_level: str
    status: str
    coordinator: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Stunt Equipment ─────────────────────────────────────────────────────────

class StuntEquipmentCreate(BaseModel):
    project_id: UUID
    name: str
    category: Optional[str] = None
    purchase_cost: float = 0
    status: str = "available"
    vendor: Optional[str] = None


class StuntEquipmentUpdate(BaseModel):
    project_id: Optional[UUID] = None
    name: Optional[str] = None
    category: Optional[str] = None
    purchase_cost: Optional[float] = None
    status: Optional[str] = None
    vendor: Optional[str] = None


class StuntEquipmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    name: str
    category: Optional[str] = None
    purchase_cost: float
    status: str
    vendor: Optional[str] = None
    created_at: datetime
    updated_at: datetime


# ── Prop Transactions ──────────────────────────────────────────────────────

class PropTransactionCreate(BaseModel):
    prop_id: UUID
    type: str
    amount: float = 0
    date: date
    notes: Optional[str] = None


class PropTransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    prop_id: UUID
    type: str
    amount: Optional[float] = None
    date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime


# ── Set Tasks ──────────────────────────────────────────────────────────────

class SetTaskCreate(BaseModel):
    set_id: UUID
    title: str
    status: str = "pending"
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class SetTaskUpdate(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None


class SetTaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    set_id: UUID
    title: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[str] = None
    due_date: Optional[date] = None
    notes: Optional[str] = None
    created_at: datetime


# ── Vehicle Allocations ────────────────────────────────────────────────────

class VehicleAllocationCreate(BaseModel):
    vehicle_id: UUID
    project_id: UUID
    allocated_to: Optional[str] = None
    date: date
    purpose: Optional[str] = None
    status: str = "allocated"


class VehicleAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    vehicle_id: UUID
    project_id: UUID
    allocated_to: Optional[str] = None
    date: Optional[date] = None
    purpose: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime


# ── Caravan Allocations ────────────────────────────────────────────────────

class CaravanAllocationCreate(BaseModel):
    caravan_id: UUID
    allocated_to: Optional[str] = None
    date: date
    status: str = "allocated"


class CaravanAllocationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    caravan_id: UUID
    allocated_to: Optional[str] = None
    date: Optional[date] = None
    status: Optional[str] = None
    created_at: datetime


# ── Driver Profiles ────────────────────────────────────────────────────────

class DriverProfileCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    status: str = "active"


class DriverProfileUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    license_number: Optional[str] = None
    status: Optional[str] = None


class DriverProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    name: str
    phone: Optional[str] = None
    license_number: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime


# ── Driver Assignments ─────────────────────────────────────────────────────

class DriverAssignmentCreate(BaseModel):
    driver_id: UUID
    vehicle_id: Optional[UUID] = None
    project_id: UUID
    date: date
    shift: Optional[str] = None
    status: str = "assigned"


class DriverAssignmentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    driver_id: UUID
    vehicle_id: Optional[UUID] = None
    project_id: UUID
    date: Optional[date] = None
    shift: Optional[str] = None
    status: Optional[str] = None
    created_at: datetime

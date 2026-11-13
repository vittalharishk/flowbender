from __future__ import annotations

"""Crew department sub-module models for Flowbender."""

import uuid
from datetime import date, datetime
from decimal import Decimal
from typing import Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from .compat import PortableUUID, PortableJSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base

__all__ = [
    "RentalVendor",
    "RentalRecord",
    "RentalPayment",
    "ProductionExpense",
    "ExpensePayment",
    "OfficeRental",
    "OfficeRentPayment",
    "MaintenanceRecord",
    "FilmLocation",
    "LocationScouting",
    "LocationAgreement",
    "LocationPayment",
    "Hotel",
    "HotelBooking",
    "HotelPayment",
    "Trip",
    "TravelPayment",
    "PropItem",
    "PropTransaction",
    "ProductionSet",
    "SetTask",
    "ProductionVehicle",
    "VehicleAllocation",
    "Caravan",
    "CaravanAllocation",
    "DriverProfile",
    "DriverAssignment",
    "StuntPlan",
    "StuntSafetyChecklist",
    "StuntEquipment",
    "StuntEquipmentTransaction",
]


# ---------------------------------------------------------------------------
# Rentals
# ---------------------------------------------------------------------------


class RentalVendor(Base):
    __tablename__ = "rental_vendors"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    contact_person: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    address: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    gst_number: Mapped[Optional[str]] = mapped_column(String(50))
    bank_details: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    status: Mapped[Optional[str]] = mapped_column(String(50), default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    rental_records: Mapped[list["RentalRecord"]] = relationship(back_populates="vendor")

    __table_args__ = (
        Index("ix_rental_vendors_org", "organization_id"),
        Index("ix_rental_vendors_name", "name"),
    )


class RentalRecord(Base):
    __tablename__ = "rental_records"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    vendor_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("rental_vendors.id"), nullable=False
    )
    category: Mapped[Optional[str]] = mapped_column(String(100))
    item_description: Mapped[Optional[str]] = mapped_column(Text)
    quantity: Mapped[Optional[int]] = mapped_column(Integer, default=1)
    rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    duration_days: Mapped[Optional[int]] = mapped_column(Integer)
    total_rental_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    deposit_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(
        String(30), default="active", nullable=False
    )  # active / returned / overdue / cancelled
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    vendor: Mapped["RentalVendor"] = relationship(back_populates="rental_records")
    payments: Mapped[list["RentalPayment"]] = relationship(back_populates="rental_record")

    __table_args__ = (
        Index("ix_rental_records_org", "organization_id"),
        Index("ix_rental_records_project", "project_id"),
        Index("ix_rental_records_vendor", "vendor_id"),
        Index("ix_rental_records_status", "status"),
    )


class RentalPayment(Base):
    __tablename__ = "rental_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    rental_record_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("rental_records.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[Optional[date]] = mapped_column(Date)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    rental_record: Mapped["RentalRecord"] = relationship(back_populates="payments")

    __table_args__ = (
        Index("ix_rental_payments_org", "organization_id"),
        Index("ix_rental_payments_record", "rental_record_id"),
    )


# ---------------------------------------------------------------------------
# Production Expenses
# ---------------------------------------------------------------------------


class ProductionExpense(Base):
    __tablename__ = "production_expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    category: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    final_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[str] = mapped_column(
        String(30), default="draft", nullable=False
    )  # draft / pending / approved / rejected / paid
    approved_by: Mapped[Optional[str]] = mapped_column(String(255))
    vendor_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(), ForeignKey("rental_vendors.id"), nullable=True
    )
    receipt_url: Mapped[Optional[str]] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    payments: Mapped[list["ExpensePayment"]] = relationship(back_populates="expense")

    __table_args__ = (
        Index("ix_production_expenses_org", "organization_id"),
        Index("ix_production_expenses_project", "project_id"),
        Index("ix_production_expenses_status", "status"),
    )


class ExpensePayment(Base):
    __tablename__ = "expense_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    expense_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("production_expenses.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[Optional[date]] = mapped_column(Date)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    payment_method: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    expense: Mapped["ProductionExpense"] = relationship(back_populates="payments")

    __table_args__ = (
        Index("ix_expense_payments_org", "organization_id"),
        Index("ix_expense_payments_expense", "expense_id"),
    )


# ---------------------------------------------------------------------------
# Office Rentals
# ---------------------------------------------------------------------------


class OfficeRental(Base):
    __tablename__ = "office_rentals"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    location: Mapped[Optional[str]] = mapped_column(String(500))
    monthly_rent: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    deposit: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[Optional[str]] = mapped_column(String(50), default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    rent_payments: Mapped[list["OfficeRentPayment"]] = relationship(back_populates="office_rental")

    __table_args__ = (
        Index("ix_office_rentals_org", "organization_id"),
        Index("ix_office_rentals_project", "project_id"),
    )


class OfficeRentPayment(Base):
    __tablename__ = "office_rent_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    office_rental_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("office_rentals.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    month: Mapped[Optional[str]] = mapped_column(String(20))
    payment_date: Mapped[Optional[date]] = mapped_column(Date)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    office_rental: Mapped["OfficeRental"] = relationship(back_populates="rent_payments")

    __table_args__ = (
        Index("ix_office_rent_payments_org", "organization_id"),
        Index("ix_office_rent_payments_rental", "office_rental_id"),
    )


# ---------------------------------------------------------------------------
# Maintenance
# ---------------------------------------------------------------------------


class MaintenanceRecord(Base):
    __tablename__ = "maintenance_records"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    item: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    estimated_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    actual_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="pending")
    date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    __table_args__ = (
        Index("ix_maintenance_records_org", "organization_id"),
        Index("ix_maintenance_records_project", "project_id"),
    )


# ---------------------------------------------------------------------------
# Film Locations
# ---------------------------------------------------------------------------


class FilmLocation(Base):
    __tablename__ = "film_locations"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    address: Mapped[Optional[str]] = mapped_column(Text)
    city: Mapped[Optional[str]] = mapped_column(String(100))
    state: Mapped[Optional[str]] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(
        String(30), default="scouting", nullable=False
    )  # scouting / permit-pending / locked / completed
    geo_lat: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    geo_lng: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    cover_image_url: Mapped[Optional[str]] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    scouting_records: Mapped[list["LocationScouting"]] = relationship(back_populates="location")
    agreements: Mapped[list["LocationAgreement"]] = relationship(back_populates="location")

    __table_args__ = (
        Index("ix_film_locations_org", "organization_id"),
        Index("ix_film_locations_project", "project_id"),
        Index("ix_film_locations_status", "status"),
    )


class LocationScouting(Base):
    __tablename__ = "location_scouting"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("film_locations.id"), nullable=False
    )
    scout_date: Mapped[Optional[date]] = mapped_column(Date)
    scout_by: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[Optional[str]] = mapped_column(String(50))
    photos: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    notes: Mapped[Optional[str]] = mapped_column(Text)
    estimated_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    location: Mapped["FilmLocation"] = relationship(back_populates="scouting_records")

    __table_args__ = (
        Index("ix_location_scouting_org", "organization_id"),
        Index("ix_location_scouting_location", "location_id"),
    )


class LocationAgreement(Base):
    __tablename__ = "location_agreements"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    location_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("film_locations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    agreed_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    deposit: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    end_date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[Optional[str]] = mapped_column(String(50), default="draft")
    document_url: Mapped[Optional[str]] = mapped_column(String(500))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    location: Mapped["FilmLocation"] = relationship(back_populates="agreements")
    payments: Mapped[list["LocationPayment"]] = relationship(back_populates="agreement")

    __table_args__ = (
        Index("ix_location_agreements_org", "organization_id"),
        Index("ix_location_agreements_location", "location_id"),
        Index("ix_location_agreements_project", "project_id"),
    )


class LocationPayment(Base):
    __tablename__ = "location_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    agreement_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("location_agreements.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[Optional[date]] = mapped_column(Date)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    payment_type: Mapped[Optional[str]] = mapped_column(String(50))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    agreement: Mapped["LocationAgreement"] = relationship(back_populates="payments")

    __table_args__ = (
        Index("ix_location_payments_org", "organization_id"),
        Index("ix_location_payments_agreement", "agreement_id"),
    )


# ---------------------------------------------------------------------------
# Hotels & Bookings
# ---------------------------------------------------------------------------


class Hotel(Base):
    __tablename__ = "hotels"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    city: Mapped[Optional[str]] = mapped_column(String(100))
    address: Mapped[Optional[str]] = mapped_column(Text)
    contact_person: Mapped[Optional[str]] = mapped_column(String(255))
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    email: Mapped[Optional[str]] = mapped_column(String(255))
    star_rating: Mapped[Optional[int]] = mapped_column(Integer)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    bookings: Mapped[list["HotelBooking"]] = relationship(back_populates="hotel")

    __table_args__ = (
        Index("ix_hotels_org", "organization_id"),
        Index("ix_hotels_city", "city"),
    )


class HotelBooking(Base):
    __tablename__ = "hotel_bookings"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    hotel_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("hotels.id"), nullable=False
    )
    guest_name: Mapped[Optional[str]] = mapped_column(String(255))
    guest_type: Mapped[Optional[str]] = mapped_column(String(30))  # cast / crew
    room_type: Mapped[Optional[str]] = mapped_column(String(50))
    check_in: Mapped[Optional[date]] = mapped_column(Date)
    check_out: Mapped[Optional[date]] = mapped_column(Date)
    rate_per_night: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    total_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    deposit: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="confirmed")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    hotel: Mapped["Hotel"] = relationship(back_populates="bookings")
    payments: Mapped[list["HotelPayment"]] = relationship(back_populates="booking")

    __table_args__ = (
        Index("ix_hotel_bookings_org", "organization_id"),
        Index("ix_hotel_bookings_project", "project_id"),
        Index("ix_hotel_bookings_hotel", "hotel_id"),
    )


class HotelPayment(Base):
    __tablename__ = "hotel_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    booking_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("hotel_bookings.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[Optional[date]] = mapped_column(Date)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    booking: Mapped["HotelBooking"] = relationship(back_populates="payments")

    __table_args__ = (
        Index("ix_hotel_payments_org", "organization_id"),
        Index("ix_hotel_payments_booking", "booking_id"),
    )


# ---------------------------------------------------------------------------
# Travel
# ---------------------------------------------------------------------------


class Trip(Base):
    __tablename__ = "trips"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    traveler_name: Mapped[Optional[str]] = mapped_column(String(255))
    traveler_type: Mapped[Optional[str]] = mapped_column(String(50))
    category: Mapped[Optional[str]] = mapped_column(
        String(30)
    )  # flight / train / bus / cab / auto / self / other
    origin: Mapped[Optional[str]] = mapped_column(String(255))
    destination: Mapped[Optional[str]] = mapped_column(String(255))
    travel_date: Mapped[Optional[date]] = mapped_column(Date)
    return_date: Mapped[Optional[date]] = mapped_column(Date)
    total_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="planned")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    payments: Mapped[list["TravelPayment"]] = relationship(back_populates="trip")

    __table_args__ = (
        Index("ix_trips_org", "organization_id"),
        Index("ix_trips_project", "project_id"),
    )


class TravelPayment(Base):
    __tablename__ = "travel_payments"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    trip_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("trips.id"), nullable=False
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(14, 2), nullable=False)
    payment_date: Mapped[Optional[date]] = mapped_column(Date)
    payment_ref: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    trip: Mapped["Trip"] = relationship(back_populates="payments")

    __table_args__ = (
        Index("ix_travel_payments_org", "organization_id"),
        Index("ix_travel_payments_trip", "trip_id"),
    )


# ---------------------------------------------------------------------------
# Props
# ---------------------------------------------------------------------------


class PropItem(Base):
    __tablename__ = "prop_items"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    description: Mapped[Optional[str]] = mapped_column(Text)
    purchase_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    rental_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="available")
    vendor: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    transactions: Mapped[list["PropTransaction"]] = relationship(back_populates="prop")

    __table_args__ = (
        Index("ix_prop_items_org", "organization_id"),
        Index("ix_prop_items_project", "project_id"),
    )


class PropTransaction(Base):
    __tablename__ = "prop_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    prop_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("prop_items.id"), nullable=False
    )
    type: Mapped[str] = mapped_column(
        String(30), nullable=False
    )  # purchase / rental / return / damage
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    prop: Mapped["PropItem"] = relationship(back_populates="transactions")

    __table_args__ = (
        Index("ix_prop_transactions_org", "organization_id"),
        Index("ix_prop_transactions_prop", "prop_id"),
    )


# ---------------------------------------------------------------------------
# Production Sets
# ---------------------------------------------------------------------------


class ProductionSet(Base):
    __tablename__ = "production_sets"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text)
    location: Mapped[Optional[str]] = mapped_column(String(500))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="planned")
    estimated_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    actual_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    start_date: Mapped[Optional[date]] = mapped_column(Date)
    completion_date: Mapped[Optional[date]] = mapped_column(Date)
    linked_expense_ids: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    tasks: Mapped[list["SetTask"]] = relationship(back_populates="production_set")

    __table_args__ = (
        Index("ix_production_sets_org", "organization_id"),
        Index("ix_production_sets_project", "project_id"),
    )


class SetTask(Base):
    __tablename__ = "set_tasks"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    set_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("production_sets.id"), nullable=False
    )
    title: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="pending")
    assigned_to: Mapped[Optional[str]] = mapped_column(String(255))
    due_date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    production_set: Mapped["ProductionSet"] = relationship(back_populates="tasks")

    __table_args__ = (
        Index("ix_set_tasks_org", "organization_id"),
        Index("ix_set_tasks_set", "set_id"),
    )


# ---------------------------------------------------------------------------
# Vehicles & Caravans
# ---------------------------------------------------------------------------


class ProductionVehicle(Base):
    __tablename__ = "production_vehicles"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    type: Mapped[Optional[str]] = mapped_column(String(100))
    registration_number: Mapped[Optional[str]] = mapped_column(String(50))
    driver_name: Mapped[Optional[str]] = mapped_column(String(255))
    daily_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="available")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    allocations: Mapped[list["VehicleAllocation"]] = relationship(back_populates="vehicle")
    driver_assignments: Mapped[list["DriverAssignment"]] = relationship(back_populates="vehicle")

    __table_args__ = (
        Index("ix_production_vehicles_org", "organization_id"),
        Index("ix_production_vehicles_project", "project_id"),
    )


class VehicleAllocation(Base):
    __tablename__ = "vehicle_allocations"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    vehicle_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("production_vehicles.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    allocated_to: Mapped[Optional[str]] = mapped_column(String(255))
    date: Mapped[Optional[date]] = mapped_column(Date)
    purpose: Mapped[Optional[str]] = mapped_column(String(255))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="allocated")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    vehicle: Mapped["ProductionVehicle"] = relationship(back_populates="allocations")

    __table_args__ = (
        Index("ix_vehicle_allocations_org", "organization_id"),
        Index("ix_vehicle_allocations_vehicle", "vehicle_id"),
        Index("ix_vehicle_allocations_date", "date"),
    )


class Caravan(Base):
    __tablename__ = "caravans"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    type: Mapped[Optional[str]] = mapped_column(String(100))
    registration_number: Mapped[Optional[str]] = mapped_column(String(50))
    capacity: Mapped[Optional[int]] = mapped_column(Integer)
    daily_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    total_rental_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    deposit_paid: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="available")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    allocations: Mapped[list["CaravanAllocation"]] = relationship(back_populates="caravan")

    __table_args__ = (
        Index("ix_caravans_org", "organization_id"),
        Index("ix_caravans_project", "project_id"),
    )


class CaravanAllocation(Base):
    __tablename__ = "caravan_allocations"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    caravan_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("caravans.id"), nullable=False
    )
    allocated_to: Mapped[Optional[str]] = mapped_column(String(255))
    date: Mapped[Optional[date]] = mapped_column(Date)
    status: Mapped[Optional[str]] = mapped_column(String(50), default="allocated")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    caravan: Mapped["Caravan"] = relationship(back_populates="allocations")

    __table_args__ = (
        Index("ix_caravan_allocations_org", "organization_id"),
        Index("ix_caravan_allocations_caravan", "caravan_id"),
        Index("ix_caravan_allocations_date", "date"),
    )


# ---------------------------------------------------------------------------
# Drivers
# ---------------------------------------------------------------------------


class DriverProfile(Base):
    __tablename__ = "driver_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(50))
    license_number: Mapped[Optional[str]] = mapped_column(String(100))
    vehicle_types: Mapped[Optional[dict]] = mapped_column(PortableJSON())
    status: Mapped[Optional[str]] = mapped_column(String(50), default="active")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    assignments: Mapped[list["DriverAssignment"]] = relationship(back_populates="driver")

    __table_args__ = (
        Index("ix_driver_profiles_org", "organization_id"),
    )


class DriverAssignment(Base):
    __tablename__ = "driver_assignments"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    driver_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("driver_profiles.id"), nullable=False
    )
    vehicle_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PortableUUID(), ForeignKey("production_vehicles.id"), nullable=True
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    date: Mapped[Optional[date]] = mapped_column(Date)
    shift: Mapped[Optional[str]] = mapped_column(String(50))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="assigned")
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    driver: Mapped["DriverProfile"] = relationship(back_populates="assignments")
    vehicle: Mapped[Optional["ProductionVehicle"]] = relationship(back_populates="driver_assignments")

    __table_args__ = (
        Index("ix_driver_assignments_org", "organization_id"),
        Index("ix_driver_assignments_driver", "driver_id"),
        Index("ix_driver_assignments_date", "date"),
    )


# ---------------------------------------------------------------------------
# Stunts
# ---------------------------------------------------------------------------


class StuntPlan(Base):
    __tablename__ = "stunt_plans"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    scene_id: Mapped[Optional[str]] = mapped_column(String(100))
    title: Mapped[Optional[str]] = mapped_column(String(255))
    description: Mapped[Optional[str]] = mapped_column(Text)
    risk_level: Mapped[str] = mapped_column(
        String(20), default="medium", nullable=False
    )  # low / medium / high / extreme
    status: Mapped[Optional[str]] = mapped_column(String(50), default="planned")
    coordinator: Mapped[Optional[str]] = mapped_column(String(255))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    safety_checklist: Mapped[list["StuntSafetyChecklist"]] = relationship(back_populates="stunt_plan")

    __table_args__ = (
        Index("ix_stunt_plans_org", "organization_id"),
        Index("ix_stunt_plans_project", "project_id"),
        Index("ix_stunt_plans_risk_level", "risk_level"),
    )


class StuntSafetyChecklist(Base):
    __tablename__ = "stunt_safety_checklists"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    stunt_plan_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("stunt_plans.id"), nullable=False
    )
    item: Mapped[Optional[str]] = mapped_column(String(255))
    is_checked: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    checked_by: Mapped[Optional[str]] = mapped_column(String(255))
    checked_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    stunt_plan: Mapped["StuntPlan"] = relationship(back_populates="safety_checklist")

    __table_args__ = (
        Index("ix_stunt_safety_checklists_org", "organization_id"),
        Index("ix_stunt_safety_checklists_plan", "stunt_plan_id"),
    )


class StuntEquipment(Base):
    __tablename__ = "stunt_equipment"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("projects.id"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    category: Mapped[Optional[str]] = mapped_column(String(100))
    purchase_cost: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    status: Mapped[Optional[str]] = mapped_column(String(50), default="available")
    vendor: Mapped[Optional[str]] = mapped_column(String(255))
    certification_date: Mapped[Optional[date]] = mapped_column(Date)
    certification_expiry: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    transactions: Mapped[list["StuntEquipmentTransaction"]] = relationship(
        back_populates="equipment"
    )

    __table_args__ = (
        Index("ix_stunt_equipment_org", "organization_id"),
        Index("ix_stunt_equipment_project", "project_id"),
    )


class StuntEquipmentTransaction(Base):
    __tablename__ = "stunt_equipment_transactions"

    id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), primary_key=True, default=uuid.uuid4
    )
    organization_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("organizations.id"), nullable=False
    )
    equipment_id: Mapped[uuid.UUID] = mapped_column(
        PortableUUID(), ForeignKey("stunt_equipment.id"), nullable=False
    )
    type: Mapped[Optional[str]] = mapped_column(String(50))
    amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(14, 2))
    date: Mapped[Optional[date]] = mapped_column(Date)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    equipment: Mapped["StuntEquipment"] = relationship(back_populates="transactions")

    __table_args__ = (
        Index("ix_stunt_equipment_transactions_org", "organization_id"),
        Index("ix_stunt_equipment_transactions_equip", "equipment_id"),
    )

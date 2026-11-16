"""Copy the app's live data (PostgreSQL app_state table) into the backend's normalized tables.

The Next.js app stores each data section as one JSONB row in app_state (plus module
sections as "mod:<key>" rows and user accounts in "_demoAccounts"). This script
upserts every record into the matching SQLAlchemy table so the FastAPI backend
serves the same data the app shows.

- Frontend ids ("p1", "c3-p8") become stable UUIDs via uuid5, so re-runs update
  rows in place instead of duplicating them.
- Field names are converted camelCase -> snake_case; only columns the table has
  are written, and values are coerced to each column's type.
- Projects owned by signed-up accounts (company profile set) go into that
  account's own organization, with a backend login for the same email/password.
  Everything else goes into the "Flowbender Demo" organization.

Usage:  python sync_app_state.py          (idempotent; safe to re-run)
"""
import asyncio
import json
import re
import uuid
from datetime import date, datetime, time, timezone
from decimal import Decimal

import sqlalchemy as sa
from sqlalchemy import select, text
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app.auth.utils import hash_password
from app.database import AsyncSessionLocal, Base
from app.models import *  # noqa: F401,F403
from app.models import Organization, Project, User
from app.models.compat import PortableJSON, PortableUUID

NS = uuid.UUID("f10b3bde-0000-4000-8000-f10bbe4de400")  # same namespace as migrate_demo_data.py
DEMO_ORG = "Flowbender Demo"

# app_state section -> model class name. Module-store sections are prefixed "mod:".
SECTIONS = {
    "projects": "Project", "scripts": "Script", "castMembers": "CastMember",
    "crewMembers": "CrewMember", "scenes": "Scene", "scheduleEntries": "ScheduleEntry",
    "shootDays": "ShootDay", "callSheets": "CallSheet", "characters": "CharacterProfile",
    "filmLocations": "FilmLocation", "dprReports": "DprReport", "productionTasks": "ProductionTask",
    "equipmentInventory": "EquipmentItem", "vendors": "Vendor", "budgetLineItems": "BudgetLineItem",
    "expenseItems": "ExpenseItem", "payrollEntries": "PayrollEntry",
    "postProductionItems": "PostProductionItem", "vfxShots": "VfxShot",
    "deliverables": "DeliverableItem", "rightsDeals": "RightsDeal",
    "distributionAgreements": "DistributionAgreement", "distributionReleases": "DistributionRelease",
    "distributionRevenue": "DistributionRevenue", "distributionSettlements": "DistributionSettlement",
    "notifications": "Notification", "attendanceRecords": "AttendanceRecord",
    "cameraCards": "CameraCard", "storageDevices": "StorageDevice",
    "footageMetadata": "FootageMetadata", "subtitleLanguages": "SubtitleLanguage",
    "castCandidates": "CastCandidate", "castDecisionLog": "CastDecisionLogEntry",
    "artistAvailability": "ArtistAvailability", "castContracts": "CastContract",
    "cateringAdjustments": "CateringAdjustment", "preProdChecklist": "PreProdChecklistItem",
    "postProdMilestones": "PostProdMilestone", "calendarEvents": "CalendarEvent",
    "crewAssignments": "CrewAssignment", "remunerationAgreements": "RemunerationAgreement",
    "crewPaymentRecords": "CrewPaymentRecord", "rentalVendors": "RentalVendor",
    "rentalRecords": "RentalRecord", "rentalPayments": "RentalPayment",
    "productionExpenses": "ProductionExpense", "expensePayments": "ExpensePayment",
    "officeRentals": "OfficeRental", "officeRentPayments": "OfficeRentPayment",
    "maintenanceRecords": "MaintenanceRecord", "locationScouting": "LocationScouting",
    "locationAgreements": "LocationAgreement", "locationPayments": "LocationPayment",
    "hotels": "Hotel", "hotelBookings": "HotelBooking", "hotelPayments": "HotelPayment",
    "trips": "Trip", "travelPayments": "TravelPayment", "propItems": "PropItem",
    "propTransactions": "PropTransaction", "productionSets": "ProductionSet", "setTasks": "SetTask",
    "productionVehicles": "ProductionVehicle", "vehicleAllocations": "VehicleAllocation",
    "caravans": "Caravan", "caravanAllocations": "CaravanAllocation",
    "driverProfiles": "DriverProfile", "driverAssignments": "DriverAssignment",
    "stuntPlans": "StuntPlan", "stuntSafetyChecklists": "StuntSafetyChecklist",
    "stuntEquipment": "StuntEquipment", "stuntEquipmentTransactions": "StuntEquipmentTransaction",
    "projectBudgets": "ProjectBudget", "departmentBudgets": "DepartmentBudget",
    "budgetRevisions": "BudgetRevision", "purchaseOrders": "PurchaseOrder",
    "insurancePolicies": "InsurancePolicy", "equipmentAllocations": "EquipmentAllocation",
    "equipmentMaintenance": "EquipmentMaintenance", "vfxVersions": "VfxVersion",
    "vfxReviews": "VfxReview", "mediaAssets": "MediaAsset", "mediaVersions": "MediaVersion",
    "mod:bgmCues": "BgmCue", "mod:investors": "Investor", "mod:investorProjects": "InvestorProject",
    "mod:loans": "Loan", "mod:brandingDeals": "BrandingDeal", "mod:fundingTranches": "FundingTranche",
    "mod:ostReceivables": "OstReceivable", "mod:burnRecords": "BurnRecord",
    "mod:distributionTerritories": "DistributionTerritory", "mod:digitalDistribution": "DigitalDistribution",
    "mod:satelliteDistribution": "SatelliteDistribution", "mod:audioDistribution": "AudioDistribution",
    "mod:dubbingSessions": "DubbingSession", "mod:editingTasks": "EditingTask",
    "mod:marketingCampaigns": "MarketingCampaign", "mod:publicityAssets": "PublicityAsset",
    "mod:receivables": "Receivable", "mod:receivablePayments": "ReceivablePayment",
    "mod:teamMembers": "TeamMember", "mod:teamProjectAssignments": "TeamProjectAssignment",
    "mod:trailersTeasers": "TrailerTeaser",
}

# Frontend field -> backend column, where the names differ beyond camel/snake case.
ALIASES = {
    "Scene": {"heading": "title", "pages": "page_count"},
    "Script": {"type": "format"},
    "CastCandidate": {"roleId": "character_profile_id"},
    "CastDecisionLogEntry": {"roleId": "character_profile_id"},
    "ArtistAvailability": {"castId": "cast_member_id"},
    "CastContract": {"castId": "cast_member_id"},
    "DriverAssignment": {"driverProfileId": "driver_id"},
    "MediaVersion": {"assetId": "media_asset_id"},
    "PropTransaction": {"propItemId": "prop_id"},
    "RentalPayment": {"rentalId": "rental_record_id"},
    "VfxVersion": {"shotId": "vfx_shot_id"},
    "VfxReview": {"shotId": "vfx_shot_id", "versionId": "vfx_version_id"},
    "TeamProjectAssignment": {"memberId": "member_id"},
    "TeamMember": {"departmentId": None},  # resolved by department code below
    "Scene": {"heading": "title", "pages": "page_count", "synopsis": "description"},
    "ShootDay": {"shootDayNumber": "day_number"},
    "CallSheet": {"shootDay": "shoot_day_id", "notes": "special_notes", "project": "title"},
    "CharacterProfile": {"ageBracket": "tier"},
    "FilmLocation": {"imagePlaceholder": "cover_image_url"},
    "DprReport": {"completedScenes": "scenes_completed", "producerNote": "notes"},
    "ProductionTask": {"owner": "assigned_to", "department": "category", "notes": "description"},
    "EquipmentItem": {"vendorId": "vendor"},
    "Vendor": {"contactName": "contact_person", "paymentStatus": "status"},
    "PayrollEntry": {"payeeName": "name", "dueDate": "payment_date"},
    "PostProductionItem": {"task": "title", "owner": "assigned_to"},
    "VfxShot": {"shotCode": "shot_number", "vendorId": "vendor"},
    "DeliverableItem": {"name": "title", "dueDate": "delivery_date", "territory": "recipient"},
    "DistributionRelease": {"plannedDate": "release_date", "channel": "release_type", "title": "notes"},
    "DistributionRevenue": {"dueDate": "collection_date", "revenueType": "source", "status": "payment_status"},
    "DistributionSettlement": {"grossRevenue": "gross_amount", "netPayable": "amount_payable", "settledAmount": "paid_amount", "status": "payment_status"},
    "AttendanceRecord": {"personId": "person_id", "checkIn": "check_in_time", "checkOut": "check_out_time", "role": "person_type"},
    "CameraCard": {"cardId": "card_number", "capacity": "capacity_gb"},
    "StorageDevice": {"deviceId": "name", "capacity": "capacity_tb", "used": "used_tb", "content": "notes"},
    "FootageMetadata": {"duration": "duration_seconds"},
    "SubtitleLanguage": {"qcStatus": "status", "fileSize": "delivery_format"},
    "CastDecisionLogEntry": {"roleId": "character_profile_id", "toStatus": "decision", "note": "notes", "createdBy": "decided_by"},
    "ArtistAvailability": {"castId": "cast_member_id", "state": "status", "note": "notes"},
    "CastContract": {"castId": "cast_member_id", "contractStage": "status"},
    "CateringAdjustment": {"delta": "count", "reason": "notes"},
    "PreProdChecklistItem": {"owner": "completed_by"},
    "PostProdMilestone": {"targetDate": "date"},
    "CalendarEvent": {"type": "category"},
    "CrewAssignment": {"designation": "role"},
    "RemunerationAgreement": {"period": "rate_type", "agreedAmount": "rate_amount"},
    "CrewPaymentRecord": {"paymentReference": "payment_ref", "type": "status"},
    "RentalVendor": {"gstin": "gst_number"},
    "RentalRecord": {"itemName": "item_description", "rateAmount": "rate", "rentalDays": "duration_days", "deposit": "deposit_amount", "rentalStartDate": "start_date", "expectedReturnDate": "end_date"},
    "RentalPayment": {"rentalId": "rental_record_id", "paymentReference": "payment_ref"},
    "ProductionExpense": {"finalAmount": "amount", "paymentStatus": "status", "attachmentPlaceholder": "receipt_url"},
    "ExpensePayment": {"referenceNumber": "payment_ref"},
    "OfficeRental": {"propertyName": "location", "securityDeposit": "deposit", "leaseStartDate": "start_date", "leaseEndDate": "end_date", "agreementNotes": "notes"},
    "OfficeRentPayment": {"referenceNumber": "payment_ref"},
    "MaintenanceRecord": {"title": "item", "reportedDate": "date"},
    "LocationScouting": {"scoutingDate": "scout_date", "assignedManager": "scout_by"},
    "LocationAgreement": {"usageStartDate": "start_date", "usageEndDate": "end_date", "agreementReference": "document_url"},
    "LocationPayment": {"referenceNumber": "payment_ref"},
    "HotelBooking": {"checkInDate": "check_in", "checkOutDate": "check_out"},
    "HotelPayment": {"referenceNumber": "payment_ref"},
    "Trip": {"title": "traveler_name", "departureDateTime": "travel_date", "arrivalDateTime": "return_date"},
    "TravelPayment": {"referenceNumber": "payment_ref"},
    "PropItem": {"rentalCostPerDay": "rental_cost", "condition": "status", "vendorId": "vendor"},
    "PropTransaction": {"propItemId": "prop_id", "transactionType": "type", "checkoutDate": "date"},
    "ProductionSet": {"estimatedBudget": "estimated_cost", "constructionStartDate": "start_date", "constructionEndDate": "completion_date", "locationId": "location"},
    "ProductionVehicle": {"category": "type", "name": "driver_name"},
    "VehicleAllocation": {"startDate": "date", "pickupLocation": "purpose", "driverCrewId": "allocated_to"},
    "Caravan": {"category": "type", "identificationNumber": "registration_number", "rentalCostPerDay": "daily_rate"},
    "CaravanAllocation": {"assignedTo": "allocated_to", "startDate": "date"},
    "DriverProfile": {"licenseType": "vehicle_types", "crewMemberId": "name"},
    "DriverAssignment": {"driverProfileId": "driver_id", "dutyStart": "date"},
    "StuntPlan": {"actionDirector": "coordinator"},
    "StuntSafetyChecklist": {"safetyOfficerName": "checked_by", "safetyOfficerSignOff": "is_checked", "approvalNotes": "notes", "updatedAt": "checked_at"},
    "StuntEquipment": {"condition": "status", "vendorId": "vendor"},
    "StuntEquipmentTransaction": {"checkoutDate": "date"},
    "ProjectBudget": {"approvedAmount": "total_budget", "budgetStatus": "status"},
    "DepartmentBudget": {"departmentDisplayName": "department", "allocatedBudget": "allocated", "revisedBudget": "committed"},
    "BudgetRevision": {"previousAmount": "previous_total", "revisedAmount": "new_total", "requestedBy": "approved_by"},
    "PurchaseOrder": {"lineItems": "items", "totalTax": "tax_amount", "grandTotal": "total_amount", "totalDiscount": "discount_amount", "expectedDeliveryDate": "delivery_date", "contactPerson": "vendor_name"},
    "InsurancePolicy": {"policyType": "type", "premiumAmount": "premium"},
    "EquipmentAllocation": {"startDate": "allocated_date", "endDate": "return_date", "crewMemberId": "allocated_to"},
    "EquipmentMaintenance": {"maintenanceType": "type", "scheduledDate": "date", "actualCost": "cost"},
    "VfxVersion": {"shotId": "vfx_shot_id", "assetReference": "file_url", "submittedBy": "created_by"},
    "VfxReview": {"shotId": "vfx_shot_id", "versionId": "vfx_version_id", "reviewerRole": "reviewer", "decision": "status"},
    "MediaAsset": {"mediaType": "type", "fileReference": "file_url"},
    "MediaVersion": {"assetId": "media_asset_id", "fileReference": "file_url"},
    "DistributionTerritory": {"distributor": "licensee", "dealType": "rights_category"},
    "DigitalDistribution": {"dealAmount": "contract_value", "revenueEarned": "actual_receipts", "windowStart": "license_start", "windowEnd": "license_end"},
    "SatelliteDistribution": {"channel": "broadcaster", "dealAmount": "contract_value", "advancePaid": "collected_amount", "premiereDate": "rights_start"},
    "AudioDistribution": {"label": "music_label", "dealAmount": "contract_value", "revenueEarned": "collected_amount", "revenueSharePercent": "revenue_share_pct"},
    "Receivable": {"party": "customer", "agreedAmount": "amount", "balanceAmount": "outstanding_amount", "source": "source_type", "description": "notes"},
}

# Frontend id-reference fields whose value is the frontend id of another record.
ID_FIELD = re.compile(r"^[a-z][A-Za-z]*Id$")


def fid(value):
    return uuid.uuid5(NS, str(value)) if value not in (None, "") else None


def snake(name):
    return re.sub(r"(?<!^)(?=[A-Z])", "_", name).lower()


def as_date(v):
    if isinstance(v, str) and re.match(r"^\d{4}-\d{2}-\d{2}", v):
        try:
            return date.fromisoformat(v[:10])
        except ValueError:
            return None
    return None


def as_datetime(v):
    if not isinstance(v, str) or not v:
        return None
    try:
        out = datetime.fromisoformat(v.replace("Z", "+00:00"))
        return out if out.tzinfo else out.replace(tzinfo=timezone.utc)
    except ValueError:
        d = as_date(v)
        return datetime(d.year, d.month, d.day, tzinfo=timezone.utc) if d else None


def as_time(v):
    if not isinstance(v, str):
        return None
    m = re.match(r"^\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?\s*$", v, re.I)
    if not m:
        return None
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3)
    if ap and ap.upper() == "PM" and h < 12:
        h += 12
    if ap and ap.upper() == "AM" and h == 12:
        h = 0
    return time(h % 24, mi)


def as_number(v, integer=False):
    if isinstance(v, bool):
        return int(v)
    if isinstance(v, (int, float, Decimal)):
        return int(v) if integer else v
    if isinstance(v, str):
        m = re.match(r"^\s*(-?[\d.]+)", v)
        if m:
            try:
                n = float(m.group(1))
                return int(n) if integer else n
            except ValueError:
                return None
    return None


def coerce(column, value):
    """Convert a JSON value to the Python type the column expects (None if impossible)."""
    if value is None:
        return None
    ctype = column.type
    if isinstance(ctype, PortableJSON):
        return value
    try:
        py = ctype.python_type
    except NotImplementedError:
        py = None
    if isinstance(ctype, (sa.Uuid, PortableUUID)) or py is uuid.UUID:
        if isinstance(value, uuid.UUID):
            return value
        try:
            return uuid.UUID(str(value))
        except ValueError:
            return fid(value)
    if py is datetime:
        return as_datetime(value)
    if py is date:
        return as_date(value)
    if py is time:
        return as_time(value) if isinstance(value, str) else None
    if py is bool:
        return bool(value)
    if py is int:
        return as_number(value, integer=True)
    if py in (float, Decimal):
        return as_number(value)
    if py is str:
        if isinstance(value, (list, dict)):
            return ", ".join(map(str, value)) if isinstance(value, list) else json.dumps(value)
        s = str(value)
        length = getattr(ctype, "length", None)
        return s[:length] if length else s
    return value  # JSON / ARRAY columns take lists and dicts as-is


def default_for(column):
    """Value for a NOT NULL column the frontend record doesn't provide."""
    if isinstance(column.type, PortableJSON):
        return []
    if isinstance(column.type, PortableUUID):
        return None
    try:
        py = column.type.python_type
    except NotImplementedError:
        py = None
    if py is str:
        return ""
    if py in (int, float, Decimal):
        return 0
    if py is bool:
        return False
    if py is date:
        return date.today()
    if py is datetime:
        return datetime.now(timezone.utc)
    if py in (list,):
        return []
    if py in (dict,):
        return {}
    return None


async def load_app_state(db):
    rows = (await db.execute(text("SELECT key, data FROM app_state"))).all()
    return {key: data for key, data in rows}


async def ensure_org(db, name, slug):
    org = (await db.execute(select(Organization).where(Organization.name == name))).scalar_one_or_none()
    if org:
        return org
    org = Organization(name=name, slug=slug)
    db.add(org)
    await db.flush()
    return org


async def ensure_user(db, org, account):
    user = (await db.execute(select(User).where(User.email == account["email"]))).scalar_one_or_none()
    if user:
        return user
    parts = (account.get("user", {}).get("full_name") or account.get("label") or account["email"]).split(" ", 1)
    user = User(
        organization_id=org.id, email=account["email"], password_hash=hash_password(account["password"]),
        first_name=parts[0], last_name=parts[1] if len(parts) > 1 else "",
        role="owner", is_active=True,
    )
    db.add(user)
    await db.flush()
    return user


async def department_id(db, org_id, frontend_id):
    """Map a frontend department id ("dept-direction") to the org's Department row,
    matching by code and creating the department if the backend doesn't have it."""
    from app.models import Department

    code = frontend_id.removeprefix("dept-")
    dept = (await db.execute(select(Department).where(
        Department.organization_id == org_id, sa.func.lower(Department.code) == code.lower()
    ))).scalar_one_or_none()
    if dept is None:
        dept = Department(organization_id=org_id, code=code, name=code.replace("-", " ").title())
        db.add(dept)
        await db.flush()
    return dept.id


async def main():
    models = {m.class_.__name__: m.class_ for m in Base.registry.mappers}
    report = {}

    async with AsyncSessionLocal() as db:
        state = await load_app_state(db)
        demo_org = (await db.execute(select(Organization).where(Organization.name == DEMO_ORG))).scalar_one_or_none()
        if not demo_org:
            print("Demo organization not found. Run seed_demo.py first.")
            return

        # Which organization owns each project: signed-up accounts get their own.
        project_org = {}
        for account in state.get("_demoAccounts") or []:
            profile = account.get("companyProfile")
            if profile is None and "companyProfile" not in account:
                continue  # built-in demo account
            company = (profile or {}).get("companyName") or account.get("label") or account["email"]
            slug = re.sub(r"[^a-z0-9]+", "-", f"{company}-{account['user']['id']}".lower()).strip("-")
            org = await ensure_org(db, company, slug)
            await ensure_user(db, org, account)
            for pid in account.get("assignedProjectIds") or []:
                project_org[pid] = org.id
        await db.commit()

        # Collect records per model, keyed by section order (parents before children).
        pending = {}
        for section, model_name in SECTIONS.items():
            records = state.get(section)
            if not isinstance(records, list) or model_name not in models:
                report[section] = "skipped (no data or no table)"
                continue
            pending.setdefault(model_name, []).extend(records)

        crew_by_id = {c["id"]: c for c in state.get("crewMembers") or [] if isinstance(c, dict)}

        def org_for(record):
            pid = record.get("projectId")
            return project_org.get(pid, demo_org.id)

        order = [t.name for t in Base.metadata.sorted_tables]
        model_order = sorted(pending, key=lambda n: order.index(models[n].__tablename__))

        for model_name in model_order:
            model = models[model_name]
            table = model.__table__
            columns = {c.name: c for c in table.columns}
            aliases = ALIASES.get(model_name, {})
            fk_targets = {}
            for c in table.columns:
                for fk in c.foreign_keys:
                    fk_targets[c.name] = fk.column.table
            inserted = failed = defaulted = no_project = 0
            errors = []
            needs_project = "project_id" in columns and not columns["project_id"].nullable
            for record in pending[model_name]:
                if not isinstance(record, dict) or record.get("id") in (None, ""):
                    failed += 1
                    continue
                if needs_project and not record.get("projectId"):
                    no_project += 1  # e.g. shared equipment pool: the backend requires a project
                    continue
                row = {}
                for key, value in record.items():
                    col = aliases[key] if key in aliases else snake(key)
                    if col is None or col not in columns:
                        continue
                    row[col] = coerce(columns[col], value)
                row["id"] = fid(record["id"])
                if model_name == "TeamMember" and record.get("departmentId"):
                    row["department_id"] = await department_id(db, demo_org.id, record["departmentId"])
                if model_name == "DistributionSettlement" and isinstance(record.get("deductions"), (int, float)):
                    row["deductions"] = {"total": record["deductions"], "distributor_commission": record.get("distributorCommission")}
                if model_name == "DriverProfile" and "name" in columns:
                    crew = crew_by_id.get(record.get("crewMemberId"), {})
                    row["name"] = crew.get("name") or row.get("name")
                    if "phone" in columns:
                        row["phone"] = crew.get("phone")
                    if "status" in columns:
                        row["status"] = "available" if record.get("available") else "assigned"
                if "organization_id" in columns:
                    row["organization_id"] = org_for(record) if model_name != "Project" else project_org.get(record["id"], demo_org.id)
                # Drop references to rows that don't exist (keeps foreign keys valid).
                for col, target in fk_targets.items():
                    if col in ("organization_id",) or row.get(col) is None:
                        continue
                    exists = (await db.execute(
                        select(sa.literal(1)).select_from(target).where(target.c.id == row[col]).limit(1)
                    )).first()
                    if not exists:
                        row[col] = None
                for name, col in columns.items():
                    if row.get(name) is None and not col.nullable and col.default is None and col.server_default is None and not col.primary_key:
                        row[name] = default_for(col)
                        defaulted += 1
                stmt = pg_insert(table).values(**row)
                update_cols = {k: stmt.excluded[k] for k in row if k != "id"}
                stmt = stmt.on_conflict_do_update(index_elements=["id"], set_=update_cols) if update_cols else stmt.on_conflict_do_nothing()
                try:
                    async with db.begin_nested():
                        await db.execute(stmt)
                    inserted += 1
                except Exception as exc:  # one bad record must not stop the rest
                    failed += 1
                    if len(errors) < 2:
                        errors.append(f"{type(exc).__name__}: {str(exc).splitlines()[0][:160]}")
            await db.commit()
            report[model_name] = (
                f"{inserted} upserted"
                + (f", {no_project} skipped (belong to no project)" if no_project else "")
                + (f", {failed} failed {errors}" if failed else "")
                + (f", {defaulted} default values" if defaulted else "")
            )

    width = max(len(k) for k in report)
    for name, line in report.items():
        print(f"  {name.ljust(width)}  {line}")


if __name__ == "__main__":
    asyncio.run(main())

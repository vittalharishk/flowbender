"""Migrate frontend dummy data (frontend/data/flowbender-demo-data.json) into the DB.

Frontend string ids (p1..p7, c1, etc.) are preserved as deterministic UUIDs via
uuid5(NAMESPACE, "<frontend-id>") so re-runs and FK wiring stay stable.

Usage: python migrate_demo_data.py
Idempotent: exits if projects already exist for the demo organization.
"""
import asyncio
import json
import os
import re
import uuid
from datetime import datetime, date, time

from sqlalchemy import select, func

from app.database import AsyncSessionLocal
from app.models import *  # noqa

NS = uuid.UUID("f10b3bde-0000-4000-8000-f10bbe4de400")
JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..",
                         "frontend", "data", "flowbender-demo-data.json")

summary = {}


def fid(frontend_id):
    return uuid.uuid5(NS, str(frontend_id)) if frontend_id else None


def d(v):
    if not v or not isinstance(v, str):
        return None
    try:
        return date.fromisoformat(v[:10])
    except ValueError:
        return None


def dt(v):
    if not v or not isinstance(v, str):
        return None
    try:
        return datetime.fromisoformat(v.replace("Z", "+00:00"))
    except ValueError:
        dd = d(v)
        return datetime(dd.year, dd.month, dd.day) if dd else None


def t(v):
    if not v or not isinstance(v, str):
        return None
    m = re.match(r"^(\d{1,2}):(\d{2})\s*(AM|PM)?$", v.strip(), re.I)
    if not m:
        return None
    h, mi, ap = int(m.group(1)), int(m.group(2)), m.group(3)
    if ap and ap.upper() == "PM" and h < 12:
        h += 12
    if ap and ap.upper() == "AM" and h == 12:
        h = 0
    return time(h % 24, mi)


def num(v):
    """Extract leading number from values like '512GB' / '4TB'; pass numbers through."""
    if v is None or isinstance(v, (int, float)):
        return v
    m = re.match(r"^\s*([\d.]+)", str(v))
    return float(m.group(1)) if m else None


async def run_section(name, fn, model=None, *args):
    async with AsyncSessionLocal() as db:
        try:
            if model is not None:
                existing = (await db.execute(
                    select(func.count()).select_from(model))).scalar_one()
                if existing > 0:
                    summary[name] = (0, existing, 0)
                    print(f"  SKIP {name}: {existing} rows already present")
                    return
            inserted, skipped = await fn(db, *args)
            await db.commit()
            summary[name] = (inserted, skipped, 0)
            print(f"  OK {name}: {inserted} inserted, {skipped} skipped")
        except Exception as e:
            await db.rollback()
            summary[name] = (0, 0, 1)
            print(f"  FAIL {name}: {type(e).__name__}: {e}")


async def main():
    with open(JSON_PATH, encoding="utf-8") as f:
        data = json.load(f)["data"]

    async with AsyncSessionLocal() as db:
        org_id = (await db.execute(select(Organization.id).where(
            Organization.name == "Flowbender Demo"))).scalar_one_or_none()
        if not org_id:
            print("Demo organization not found. Run seed_demo.py first.")
            return

    pmap = {p["id"]: fid(p["id"]) for p in data["projects"]}
    ptitle = {p["title"]: fid(p["id"]) for p in data["projects"]}
    vendors_by_id = {v["id"]: v for v in data.get("vendors", [])}

    def pj(rec, key="projectId"):
        return pmap.get(rec.get(key))

    # ------------------------------------------------------------------ projects
    async def mig_projects(db):
        ins = 0
        for p in data["projects"]:
            db.add(Project(
                id=fid(p["id"]), organization_id=org_id, title=p["title"],
                type=p.get("type"), status=p.get("status"), genre=p.get("genre"),
                language=p.get("language"), director=p.get("director"),
                producer=p.get("producer"), production_house=p.get("productionHouse"),
                start_date=d(p.get("startDate")), end_date=d(p.get("endDate")),
                release_date=d(p.get("releaseDate")), budget=p.get("budget"),
                spent=p.get("spent"), poster_color=p.get("posterColor"),
                poster_image=p.get("posterImage"), logline=p.get("logline"),
                description=p.get("description"), shoot_progress=p.get("shootProgress"),
                total_shoot_days=p.get("totalShootDays"),
                completed_shoot_days=p.get("completedShootDays"),
                next_shoot_date=d(p.get("nextShootDate")),
            ))
            ins += 1
        return ins, 0

    async def mig_cast(db):
        ins = sk = 0
        for c in data["castMembers"]:
            if not pj(c):
                sk += 1
                continue
            db.add(CastMember(
                id=fid(c["id"]), organization_id=org_id, project_id=pj(c),
                name=c["name"], character=c.get("character"),
                character_description=c.get("characterDescription"),
                category=c.get("category"), initials=c.get("initials"),
                email=c.get("email"), phone=c.get("phone"), agency=c.get("agency"),
                languages=c.get("languages"), contract_status=c.get("contractStatus"),
                payment_status=c.get("paymentStatus"), total_fee=c.get("totalFee"),
                paid_amount=c.get("paidAmount"), notes=c.get("notes"),
                joined_date=d(c.get("joinedDate")),
            ))
            ins += 1
        return ins, sk

    async def mig_crew(db):
        ins = sk = 0
        for c in data["crewMembers"]:
            if not pj(c):
                sk += 1
                continue
            db.add(CrewMember(
                id=fid(c["id"]), organization_id=org_id, project_id=pj(c),
                name=c["name"], initials=c.get("initials"),
                profile_image=c.get("profileImage"), department=c.get("department"),
                role=c.get("role"), email=c.get("email"), phone=c.get("phone"),
                contract_status=c.get("contractStatus"),
                payment_status=c.get("paymentStatus"), day_rate=c.get("dayRate"),
                total_days=c.get("totalDays"), days_worked=c.get("daysWorked"),
                total_paid=c.get("totalPaid"), availability=c.get("availability"),
                notes=c.get("notes"), joined_date=d(c.get("joinedDate")),
            ))
            ins += 1
        return ins, sk

    async def mig_scripts(db):
        ins = sk = 0
        for s in data["scripts"]:
            if not pj(s):
                sk += 1
                continue
            db.add(Script(
                id=fid(s["id"]), organization_id=org_id, project_id=pj(s),
                title=s.get("title"), writer=s.get("writer"),
                screenplay_by=s.get("screenplayBy"), dialogues_by=s.get("dialoguesBy"),
                format=s.get("type"), status=s.get("status"),
            ))
            ins += 1
        return ins, sk

    async def mig_scenes(db):
        ins = sk = 0
        for s in data["scenes"]:
            if not pj(s):
                sk += 1
                continue
            db.add(Scene(
                id=fid(s["id"]), organization_id=org_id, project_id=pj(s),
                scene_number=str(s.get("sceneNumber") or ""), title=s.get("heading"),
                location=s.get("location"), time_of_day=s.get("timeOfDay"),
                int_ext=s.get("intExt"), status=s.get("status"),
                page_count=num(s.get("pages")), characters=s.get("characters"),
                props=s.get("props"), notes=s.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_script_versions(db):
        main_script = {}
        for s in data["scripts"]:
            if s.get("isMain") and s.get("projectId"):
                main_script[s["projectId"]] = fid(s["id"])
        ins = sk = 0
        for v in data["scriptVersions"]:
            sid = main_script.get(v.get("projectId"))
            if not sid:
                sk += 1
                continue
            vn = num(v.get("version"))
            db.add(ScriptVersion(
                id=fid(v["id"]), organization_id=org_id, script_id=sid,
                version_number=int(vn) if vn is not None else None,
                label=v.get("label"), created_by=v.get("author"),
            ))
            ins += 1
        return ins, sk

    async def mig_schedule(db):
        ins = sk = 0
        for s in data["scheduleEntries"]:
            if not pj(s) or not d(s.get("date")):
                sk += 1
                continue
            db.add(ScheduleEntry(
                id=fid(s["id"]), organization_id=org_id, project_id=pj(s),
                date=d(s["date"]), call_time=t(s.get("callTime")),
                location=s.get("location"), scenes=s.get("scenes"),
                shoot_day_number=s.get("shootDayNumber"),
                total_shoot_days=s.get("totalShootDays"),
                call_sheet_status=s.get("callSheetStatus"), status=s.get("status"),
            ))
            ins += 1
        return ins, sk

    async def mig_shoot_days(db):
        ins = sk = 0
        for s in data["shootDays"]:
            if not pj(s) or not d(s.get("date")):
                sk += 1
                continue
            db.add(ShootDay(
                id=fid(s["id"]), organization_id=org_id, project_id=pj(s),
                day_number=s.get("shootDayNumber"), date=d(s["date"]),
                location=s.get("location"), status=s.get("status"),
                scenes_planned=s.get("scenes"), notes=s.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_call_sheets(db):
        ins = sk = 0
        for c in data["callSheets"]:
            proj = pmap.get(c.get("project")) or ptitle.get(c.get("project"))
            dd = d(c.get("date"))
            if not proj or not dd:
                sk += 1
                continue
            db.add(CallSheet(
                id=fid(c["id"]), organization_id=org_id, project_id=proj,
                title=f"Day {c.get('shootDay')}" if c.get("shootDay") else "Call Sheet",
                date=dd, location=c.get("location"), status=c.get("status"),
                cast_call={"cast": c.get("cast")} if c.get("cast") is not None else None,
                crew_call={"crew": c.get("crew")} if c.get("crew") is not None else None,
                special_notes=c.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_locations(db):
        ins = sk = 0
        for l in data["locations"]:
            if not pj(l):
                sk += 1
                continue
            db.add(FilmLocation(
                id=fid(l["id"]), organization_id=org_id, project_id=pj(l),
                name=l.get("name"), category=l.get("type"), address=l.get("address"),
                city=l.get("city"), status=l.get("status"), notes=l.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_dpr(db):
        day_numbers = {s["id"]: s.get("shootDayNumber") for s in data["shootDays"]}
        ins = sk = 0
        for r in data["dprReports"]:
            day_no = day_numbers.get(r.get("shootDayId"))
            if not pj(r) or not d(r.get("date")) or day_no is None:
                sk += 1
                continue
            db.add(DprReport(
                id=fid(r["id"]), organization_id=org_id, project_id=pj(r),
                shoot_day_id=fid(r.get("shootDayId")), date=d(r["date"]),
                day_number=day_no,
                scenes_completed=r.get("completedScenes"), delays=r.get("delays"),
                notes=r.get("producerNote"),
            ))
            ins += 1
        return ins, sk

    async def mig_tasks(db):
        ins = sk = 0
        for x in data["productionTasks"]:
            if not pj(x):
                sk += 1
                continue
            db.add(ProductionTask(
                id=fid(x["id"]), organization_id=org_id, project_id=pj(x),
                title=x.get("title"), category=x.get("department"),
                status=x.get("status"), priority=x.get("priority"),
                assigned_to=x.get("owner"), due_date=d(x.get("dueDate")),
            ))
            ins += 1
        return ins, sk

    async def mig_vendors(db):
        ins = 0
        for v in data["vendors"]:
            db.add(Vendor(
                id=fid(v["id"]), organization_id=org_id, name=v["name"],
                category=v.get("category"), contact_person=v.get("contactName"),
                phone=v.get("phone"),
                address={"city": v["city"]} if v.get("city") else None,
            ))
            ins += 1
        return ins, 0

    async def mig_equipment(db):
        ins = sk = 0
        for e in data["equipmentInventory"]:
            if not pj(e):
                sk += 1
                continue
            vend = vendors_by_id.get(e.get("vendorId"), {}).get("name")
            db.add(EquipmentItem(
                id=fid(e["id"]), organization_id=org_id, project_id=pj(e),
                name=e.get("name"), category=e.get("category"),
                status=e.get("status"), vendor=vend, notes=e.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_budget_lines(db):
        ins = sk = 0
        for b in data["budgetLineItems"]:
            if not pj(b):
                sk += 1
                continue
            db.add(BudgetLineItem(
                id=fid(b["id"]), organization_id=org_id, project_id=pj(b),
                category=b.get("category"), allocated=b.get("allocated"),
                committed=b.get("committed"), spent=b.get("spent"),
                notes=b.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_project_budgets(db):
        ins = sk = 0
        for b in data["projectBudgets"]:
            if not pj(b):
                sk += 1
                continue
            db.add(ProjectBudget(
                id=fid(b["id"]), organization_id=org_id, project_id=pj(b),
                total_budget=b.get("approvedAmount"), status=b.get("budgetStatus"),
                notes=b.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_expenses(db):
        ins = sk = 0
        for e in data["expenseItems"]:
            if not pj(e):
                sk += 1
                continue
            db.add(ProductionExpense(
                id=fid(e["id"]), organization_id=org_id, project_id=pj(e),
                category=e.get("category"), description=e.get("description"),
                amount=e.get("amount"), status=e.get("status"),
                created_at=dt(e.get("date")),
            ))
            ins += 1
        return ins, sk

    async def mig_payroll(db):
        ins = sk = 0
        for p in data["payrollEntries"]:
            if not pj(p):
                sk += 1
                continue
            db.add(PayrollEntry(
                id=fid(p["id"]), organization_id=org_id, project_id=pj(p),
                name=p.get("payeeName"), department=p.get("department"),
                gross_amount=p.get("grossAmount"), status=p.get("status"),
                payment_date=d(p.get("dueDate")),
                notes=f"period: {p.get('period')}; paid so far: {p.get('paidAmount')}",
            ))
            ins += 1
        return ins, sk

    async def mig_post_prod(db):
        ins = sk = 0
        for x in data["postProductionItems"]:
            if not pj(x):
                sk += 1
                continue
            db.add(PostProductionItem(
                id=fid(x["id"]), organization_id=org_id, project_id=pj(x),
                title=x.get("task"), department=x.get("department"),
                status=x.get("status"), assigned_to=x.get("owner"),
                due_date=d(x.get("dueDate")),
            ))
            ins += 1
        return ins, sk

    async def mig_vfx(db):
        ins = sk = 0
        for v in data["vfxShots"]:
            if not pj(v):
                sk += 1
                continue
            vend = vendors_by_id.get(v.get("vendorId"), {}).get("name")
            db.add(VfxShot(
                id=fid(v["id"]), organization_id=org_id, project_id=pj(v),
                shot_number=v.get("shotCode"), sequence=v.get("sequence"),
                description=v.get("description"), status=v.get("status"),
                priority=v.get("priority"), vendor=vend, due_date=d(v.get("dueDate")),
            ))
            ins += 1
        return ins, sk

    async def mig_rights(db):
        ins = sk = 0
        for r in data["rightsDeals"]:
            if not pj(r):
                sk += 1
                continue
            db.add(RightsDeal(
                id=fid(r["id"]), organization_id=org_id, project_id=pj(r),
                territory=r.get("territory"), distributor=r.get("distributor"),
                rights_type=r.get("rightsType"), status=r.get("status"),
                minimum_guarantee=r.get("minimumGuarantee"),
                advance_received=r.get("advanceReceived"),
                delivery_status=r.get("deliveryStatus"),
            ))
            ins += 1
        return ins, sk

    async def mig_attendance(db):
        ins = sk = 0
        for a in data["attendanceRecords"]:
            dd = d(a.get("date"))
            if not pj(a) or not dd:
                sk += 1
                continue
            ci, co = t(a.get("checkIn")), t(a.get("checkOut"))
            db.add(AttendanceRecord(
                id=fid(a["id"]), organization_id=org_id, project_id=pj(a),
                date=dd, person_id=a.get("personId"), person_type=a.get("role"),
                status=a.get("status"),
                check_in_time=datetime.combine(dd, ci) if ci else None,
                check_out_time=datetime.combine(dd, co) if co else None,
                notes=a.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_camera_cards(db):
        ins = sk = 0
        for c in data["cameraCards"]:
            if not pj(c):
                sk += 1
                continue
            db.add(CameraCard(
                id=fid(c["id"]), organization_id=org_id, project_id=pj(c),
                card_number=c.get("cardId"), capacity_gb=num(c.get("capacity")),
                format=c.get("format"), status=c.get("status"), notes=c.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_storage(db):
        ins = sk = 0
        for s in data["storageDevices"]:
            if not pj(s):
                sk += 1
                continue
            db.add(StorageDevice(
                id=fid(s["id"]), organization_id=org_id, project_id=pj(s),
                name=s.get("deviceId"), type=s.get("type"),
                capacity_tb=num(s.get("capacity")), used_tb=num(s.get("used")),
                status=s.get("status"), location=s.get("location"),
            ))
            ins += 1
        return ins, sk

    async def mig_footage(db):
        ins = sk = 0
        for x in data["footageMetadata"]:
            if not pj(x):
                sk += 1
                continue
            db.add(FootageMetadata(
                id=fid(x["id"]), organization_id=org_id, project_id=pj(x),
                scene_id=x.get("sceneId"), take_number=x.get("takeNumber"),
                duration_seconds=num(x.get("duration")), format=x.get("format"),
                resolution=x.get("resolution"), fps=num(x.get("fps")),
                status=x.get("status"), notes=x.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_subtitles(db):
        ins = sk = 0
        for s in data["subtitleLanguages"]:
            if not pj(s):
                sk += 1
                continue
            total, done = s.get("totalLines") or 0, s.get("completedLines") or 0
            db.add(SubtitleLanguage(
                id=fid(s["id"]), organization_id=org_id, project_id=pj(s),
                language=s.get("language"), translator=s.get("translator"),
                qc_status=s.get("qcStatus"),
                progress_percent=round(done / total * 100, 1) if total else None,
                notes=s.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_pos(db):
        ins = sk = 0
        for p in data["purchaseOrders"]:
            if not pj(p):
                sk += 1
                continue
            vend = vendors_by_id.get(p.get("vendorId"), {})
            db.add(PurchaseOrder(
                id=fid(p["id"]), organization_id=org_id, project_id=pj(p),
                po_number=p.get("poNumber"),
                vendor_id=fid(p.get("vendorId")) if p.get("vendorId") in vendors_by_id else None,
                vendor_name=vend.get("name"), department=p.get("department"),
                items=p.get("lineItems"), subtotal=p.get("subtotal"),
                discount_amount=p.get("totalDiscount"), tax_amount=p.get("totalTax"),
                total_amount=p.get("grandTotal") or p.get("totalAmount") or p.get("total"),
                status=p.get("status"), delivery_date=d(p.get("expectedDeliveryDate")),
                notes=p.get("notes"),
            ))
            ins += 1
        return ins, sk

    async def mig_insurance(db):
        ins = sk = 0
        for i in data["insurancePolicies"]:
            if not pj(i):
                sk += 1
                continue
            db.add(InsurancePolicy(
                id=fid(i["id"]), organization_id=org_id, project_id=pj(i),
                policy_number=i.get("policyNumber"), provider=i.get("provider"),
                type=i.get("policyType"), coverage_amount=i.get("coverageAmount"),
                premium=i.get("premiumAmount"), deductible=i.get("deductible"),
                start_date=d(i.get("startDate")), end_date=d(i.get("endDate")),
                status=i.get("status"), notes=i.get("notes"),
            ))
            ins += 1
        return ins, sk

    await run_section("projects", mig_projects, Project)
    await run_section("cast_members", mig_cast, CastMember)
    await run_section("crew_members", mig_crew, CrewMember)
    await run_section("scripts", mig_scripts, Script)
    await run_section("scenes", mig_scenes, Scene)
    await run_section("script_versions", mig_script_versions, ScriptVersion)
    await run_section("schedule_entries", mig_schedule, ScheduleEntry)
    await run_section("shoot_days", mig_shoot_days, ShootDay)
    await run_section("call_sheets", mig_call_sheets, CallSheet)
    await run_section("film_locations", mig_locations, FilmLocation)
    await run_section("dpr_reports", mig_dpr, DprReport)
    await run_section("production_tasks", mig_tasks, ProductionTask)
    await run_section("vendors", mig_vendors, Vendor)
    await run_section("equipment_items", mig_equipment, EquipmentItem)
    await run_section("budget_line_items", mig_budget_lines, BudgetLineItem)
    await run_section("project_budgets", mig_project_budgets, ProjectBudget)
    await run_section("production_expenses", mig_expenses, ProductionExpense)
    await run_section("payroll_entries", mig_payroll, PayrollEntry)
    await run_section("post_production_items", mig_post_prod, PostProductionItem)
    await run_section("vfx_shots", mig_vfx, VfxShot)
    await run_section("rights_deals", mig_rights, RightsDeal)
    await run_section("attendance_records", mig_attendance, AttendanceRecord)
    await run_section("camera_cards", mig_camera_cards, CameraCard)
    await run_section("storage_devices", mig_storage, StorageDevice)
    await run_section("footage_metadata", mig_footage, FootageMetadata)
    await run_section("subtitle_languages", mig_subtitles, SubtitleLanguage)
    await run_section("purchase_orders", mig_pos, PurchaseOrder)
    await run_section("insurance_policies", mig_insurance, InsurancePolicy)

    print("\n=== SUMMARY (collection: inserted / skipped / failed-sections) ===")
    ti = ts = tf = 0
    for k, (i, s, f) in summary.items():
        print(f"  {k:24} {i:4} / {s:3} / {f}")
        ti, ts, tf = ti + i, ts + s, tf + f
    print(f"  {'TOTAL':24} {ti:4} / {ts:3} / {tf}")


if __name__ == "__main__":
    asyncio.run(main())

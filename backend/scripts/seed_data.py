"""
Seed script to populate the Flowbender database with demo data
matching the frontend's localStorage demo data.

Usage:
    cd backend
    python -m scripts.seed_data
"""
import asyncio
import uuid
from datetime import date, datetime, timedelta
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine, Base
from app.auth.utils import hash_password
from app.models import *  # noqa: F401,F403


ORG_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")
USER_ID = uuid.UUID("00000000-0000-0000-0000-000000000002")
PROJECT_ID = uuid.UUID("00000000-0000-0000-0000-000000000003")


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        org = Organization(
            id=ORG_ID,
            name="Flowbender Studios",
            slug="flowbender-studios",
            legal_name="Flowbender Studios Pvt Ltd",
            default_currency="INR",
        )
        db.add(org)

        user = User(
            id=USER_ID,
            organization_id=ORG_ID,
            email="admin@flowbender.com",
            password_hash=hash_password("Admin@123"),
            first_name="Admin",
            last_name="User",
            role="owner",
            is_active=True,
            email_verified=True,
        )
        db.add(user)

        project = Project(
            id=PROJECT_ID,
            organization_id=ORG_ID,
            title="Demo Feature Film",
            type="feature-film",
            status="production",
            genre="Drama",
            language="Hindi",
            director="Demo Director",
            producer="Demo Producer",
            production_house="Flowbender Studios",
            budget=Decimal("27760000000"),
        )
        db.add(project)

        departments = [
            "direction", "camera", "art", "costume", "makeup", "sound",
            "lighting", "production", "post-production", "vfx", "music",
            "stunts", "choreography", "catering", "transport", "accounts",
        ]
        cast_members = [
            ("Rajesh Kumar", "Lead Hero", "lead", Decimal("50000000")),
            ("Priya Sharma", "Lead Heroine", "lead", Decimal("35000000")),
            ("Vikram Singh", "Villain", "supporting", Decimal("20000000")),
            ("Anita Desai", "Mother", "supporting", Decimal("8000000")),
            ("Ravi Patel", "Friend", "junior", Decimal("3000000")),
        ]
        for name, character, category, fee in cast_members:
            db.add(CastMember(
                organization_id=ORG_ID,
                project_id=PROJECT_ID,
                name=name,
                character=character,
                category=category,
                contract_status="signed",
                total_fee=fee,
            ))

        crew_data = [
            ("Amit Verma", "camera", "Director of Photography", Decimal("50000"), 90),
            ("Sunita Rao", "art", "Production Designer", Decimal("40000"), 120),
            ("Kiran Joshi", "costume", "Costume Designer", Decimal("35000"), 100),
            ("Deepak Mehra", "sound", "Sound Engineer", Decimal("30000"), 90),
            ("Lakshmi Nair", "lighting", "Gaffer", Decimal("25000"), 90),
            ("Manoj Tiwari", "production", "Line Producer", Decimal("60000"), 150),
        ]
        for name, dept, role, rate, days in crew_data:
            db.add(CrewMember(
                organization_id=ORG_ID,
                project_id=PROJECT_ID,
                name=name,
                department=dept,
                role=role,
                contract_status="signed",
                day_rate=rate,
                total_days=days,
            ))

        today = date.today()
        for i in range(1, 61):
            db.add(ShootDay(
                organization_id=ORG_ID,
                project_id=PROJECT_ID,
                day_number=i,
                date=today - timedelta(days=60 - i),
                status="completed" if i <= 45 else "scheduled",
            ))

        budget = ProjectBudget(
            organization_id=ORG_ID,
            project_id=PROJECT_ID,
            total_budget=Decimal("27760000000"),
            status="approved",
        )
        db.add(budget)

        dept_budgets = [
            ("Cast & Talent", Decimal("11600000000")),
            ("Crew & Production", Decimal("5000000000")),
            ("Equipment & Rentals", Decimal("2000000000")),
            ("Locations & Travel", Decimal("1500000000")),
            ("Post-Production", Decimal("3000000000")),
            ("VFX & Music", Decimal("2500000000")),
            ("Marketing & Distribution", Decimal("1500000000")),
            ("Contingency", Decimal("660000000")),
        ]
        for dept, amount in dept_budgets:
            db.add(BudgetLineItem(
                organization_id=ORG_ID,
                project_id=PROJECT_ID,
                category=dept,
                allocated=amount,
                committed=amount * Decimal("0.6"),
                spent=amount * Decimal("0.35"),
            ))

        territories = [
            ("India - Hindi Belt", "Star Network", "satellite", Decimal("800000000")),
            ("India - South", "Sun TV", "satellite", Decimal("300000000")),
            ("Worldwide - Digital", "Netflix", "digital", Decimal("1200000000")),
            ("North America", "Yash Raj Films", "theatrical", Decimal("150000000")),
            ("UK & Europe", "Eros International", "theatrical", Decimal("100000000")),
        ]
        for territory, distributor, rights_type, mg in territories:
            db.add(RightsDeal(
                organization_id=ORG_ID,
                project_id=PROJECT_ID,
                territory=territory,
                distributor=distributor,
                rights_type=rights_type,
                status="signed",
                minimum_guarantee=mg,
                advance_received=mg * Decimal("0.3"),
                delivery_status="pending",
            ))

        await db.commit()
        print("Seed data created successfully!")
        print(f"  Organization: {ORG_ID}")
        print(f"  Admin user: admin@flowbender.com / Admin@123")
        print(f"  Project: {PROJECT_ID}")


if __name__ == "__main__":
    asyncio.run(seed())

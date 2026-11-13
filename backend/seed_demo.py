"""Seed the database with demo data for development.

Usage: python seed_demo.py

Creates a demo organization, Business Owner user, and basic department structure.
Safe to run multiple times — skips if data already exists.
"""
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.config import get_settings
from app.database import engine, AsyncSessionLocal, create_all_tables
from app.models import *  # noqa
from app.auth.utils import hash_password
from sqlalchemy import select


DEMO_ORG = "Flowbender Demo"
DEMO_EMAIL = "producer@flowbender.demo"
DEMO_PASSWORD = "Demo1234"

DEPARTMENTS = [
    ("direction", "DIR", "Direction"),
    ("production", "PROD", "Production"),
    ("camera", "CAM", "Camera"),
    ("art", "ART", "Art"),
    ("costumes", "COS", "Costumes"),
    ("makeup", "MKP", "Makeup"),
    ("sound", "SND", "Sound"),
    ("editing", "EDT", "Editing"),
    ("vfx", "VFX", "VFX"),
    ("publicity", "PUB", "Publicity"),
    ("accounts", "ACC", "Accounts"),
    ("locations", "LOC", "Locations"),
]


async def seed():
    await create_all_tables()

    async with AsyncSessionLocal() as db:
        # Check if already seeded
        result = await db.execute(select(User).where(User.email == DEMO_EMAIL))
        if result.scalar_one_or_none():
            print("Demo data already exists. Skipping.")
            return

        # Create organization
        org = Organization(name=DEMO_ORG, slug="flowbender-demo")
        db.add(org)
        await db.flush()
        print(f"Created organization: {DEMO_ORG} ({org.id})")

        # Create Business Owner
        owner = User(
            organization_id=org.id,
            email=DEMO_EMAIL,
            password_hash=hash_password(DEMO_PASSWORD),
            first_name="Demo",
            last_name="Producer",
            role="owner",
            is_active=True,
        )
        db.add(owner)
        await db.flush()
        print(f"Created Business Owner: {DEMO_EMAIL} / {DEMO_PASSWORD}")

        # Create Administrator
        admin = User(
            organization_id=org.id,
            email="admin@flowbender.demo",
            password_hash=hash_password(DEMO_PASSWORD),
            first_name="Demo",
            last_name="Admin",
            role="admin",
            is_active=True,
        )
        db.add(admin)
        await db.flush()
        print(f"Created Administrator: admin@flowbender.demo / {DEMO_PASSWORD}")

        # Create Executive Producer (manager role)
        ep = User(
            organization_id=org.id,
            email="ep@flowbender.demo",
            password_hash=hash_password(DEMO_PASSWORD),
            first_name="Demo",
            last_name="EP",
            role="manager",
            is_active=True,
        )
        db.add(ep)
        await db.flush()
        print(f"Created Executive Producer: ep@flowbender.demo / {DEMO_PASSWORD}")

        # Create departments
        for code, short, name in DEPARTMENTS:
            dept = Department(
                organization_id=org.id,
                name=name,
                code=short,
            )
            db.add(dept)
        await db.flush()
        print(f"Created {len(DEPARTMENTS)} departments")

        await db.commit()
        print("\nDemo seed complete!")
        print(f"\nLogin credentials:")
        print(f"  Business Owner:      {DEMO_EMAIL} / {DEMO_PASSWORD}")
        print(f"  Administrator:       admin@flowbender.demo / {DEMO_PASSWORD}")
        print(f"  Executive Producer:  ep@flowbender.demo / {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())

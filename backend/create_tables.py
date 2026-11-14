"""Create all tables on the configured database. Usage: python create_tables.py"""
import asyncio

from sqlalchemy import text

from app.database import create_all_tables, engine
from app.models import *  # noqa


async def main():
    await create_all_tables()
    async with engine.connect() as c:
        n = (await c.execute(text(
            "SELECT count(*) FROM information_schema.tables WHERE table_schema='public'"
        ))).scalar()
        print("Tables in database:", n)


if __name__ == "__main__":
    asyncio.run(main())

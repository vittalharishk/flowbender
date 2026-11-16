import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import event
from .config import get_settings

settings = get_settings()

connect_args = {}
if settings.DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DATABASE_ECHO,
    connect_args=connect_args,
    # pre_ping + recycle: the remote PostgreSQL drops idle connections; without
    # these the first request after an idle period fails with a 500.
    **({"pool_size": 20, "max_overflow": 10, "pool_pre_ping": True, "pool_recycle": 300} if not settings.DATABASE_URL.startswith("sqlite") else {}),
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        if settings.DATABASE_URL.startswith("sqlite"):
            await session.execute(__import__("sqlalchemy").text("PRAGMA foreign_keys=ON"))
        try:
            yield session
        finally:
            await session.close()


async def create_all_tables():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

import asyncio
import uuid
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

from app.database import Base, get_db
from app.main import app
from app.auth.utils import create_access_token, hash_password
from app.models import *  # noqa: F401,F403

# Remap PostgreSQL UUID type to SQLite-compatible CHAR(32)
from sqlalchemy import String

PG_UUID.impl = String(32)

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    async with TestSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
def org_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def user_id() -> uuid.UUID:
    return uuid.uuid4()


@pytest.fixture
def auth_headers(user_id, org_id) -> dict:
    token = create_access_token(user_id, org_id, "owner")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def staff_headers(org_id) -> dict:
    token = create_access_token(uuid.uuid4(), org_id, "staff")
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def viewer_headers(org_id) -> dict:
    token = create_access_token(uuid.uuid4(), org_id, "viewer")
    return {"Authorization": f"Bearer {token}"}

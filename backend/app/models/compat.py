"""Cross-database compatibility helpers for SQLAlchemy models.

Provides portable UUID and JSON column types that work on both PostgreSQL and SQLite.
"""
import uuid
from sqlalchemy import String, TypeDecorator, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy import JSON


class PortableUUID(TypeDecorator):
    """UUID type that uses PostgreSQL UUID natively but stores as CHAR(36) on SQLite."""
    impl = String(36)
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(String(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return value if isinstance(value, uuid.UUID) else uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if not isinstance(value, uuid.UUID):
            return uuid.UUID(str(value))
        return value


class PortableJSON(TypeDecorator):
    """JSON type that works on both PostgreSQL (JSONB) and SQLite (TEXT with JSON)."""
    impl = Text
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            from sqlalchemy.dialects.postgresql import JSONB
            return dialect.type_descriptor(JSONB)
        return dialect.type_descriptor(Text)

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name != "postgresql":
            import json
            return json.dumps(value)
        return value

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if dialect.name != "postgresql" and isinstance(value, str):
            import json
            return json.loads(value)
        return value

import os
from pydantic_settings import BaseSettings
from functools import lru_cache


def _default_db_url() -> str:
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return f"sqlite+aiosqlite:///{os.path.join(backend_dir, 'flowbender.db')}"


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Flowbender API"
    APP_VERSION: str = "1.1.0"
    DEBUG: bool = True

    # Database — defaults to SQLite for development; set to postgresql+asyncpg://... for production
    DATABASE_URL: str = _default_db_url()
    DATABASE_ECHO: bool = False

    # Redis (optional — gracefully degrades if unavailable)
    REDIS_URL: str = "redis://localhost:6379/0"

    # Auth
    SECRET_KEY: str = "change-this-in-production-use-openssl-rand-hex-32"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    ALGORITHM: str = "HS256"

    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]

    # MinIO / S3 (optional)
    MINIO_ENDPOINT: str = "localhost:9000"
    MINIO_ACCESS_KEY: str = "minioadmin"
    MINIO_SECRET_KEY: str = "minioadmin"
    MINIO_BUCKET: str = "flowbender"
    MINIO_USE_SSL: bool = False

    # Pagination
    DEFAULT_PAGE_SIZE: int = 50
    MAX_PAGE_SIZE: int = 200

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


_PLACEHOLDER_SECRETS = {
    "change-this-in-production-use-openssl-rand-hex-32",
    "secret",
    "changeme",
    "change-me",
}


def _validate_production_settings(settings: "Settings") -> None:
    """Reject unsafe configuration when running in production (DEBUG=false)."""
    if settings.DEBUG:
        return
    errors = []
    if settings.SECRET_KEY in _PLACEHOLDER_SECRETS or len(settings.SECRET_KEY) < 32:
        errors.append(
            "SECRET_KEY is a placeholder or too short (min 32 chars). "
            "Generate one with: openssl rand -hex 32"
        )
    if settings.DATABASE_URL.startswith("sqlite"):
        errors.append(
            "SQLite is not supported in production. "
            "Set DATABASE_URL=postgresql+asyncpg://user:pass@host:5432/dbname"
        )
    if errors:
        raise RuntimeError(
            "Refusing to start in production mode with unsafe configuration:\n- "
            + "\n- ".join(errors)
        )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    _validate_production_settings(settings)
    return settings

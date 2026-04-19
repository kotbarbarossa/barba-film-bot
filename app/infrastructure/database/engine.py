from sqlalchemy.ext.asyncio import AsyncEngine, create_async_engine

from app.core.config import settings
from app.core.settings import Environment


def create_engine() -> AsyncEngine:
    return create_async_engine(
        settings.database_url,
        echo=settings.environment == Environment.local,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
    )

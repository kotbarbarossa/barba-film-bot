from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.core.config import settings
from app.infrastructure import arq_pool

from .engine import create_engine
from .session_manager import session_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_engine()
    session_manager.init(engine)
    await arq_pool.init(settings.redis_url)

    yield

    await arq_pool.close()
    await session_manager.close()

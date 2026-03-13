from contextlib import asynccontextmanager

from fastapi import FastAPI

from .engine import create_engine
from .session_manager import session_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    engine = create_engine()
    session_manager.init(engine)

    yield

    await session_manager.close()

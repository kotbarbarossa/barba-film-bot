from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from .session_manager import session_manager


async def get_session() -> AsyncGenerator[AsyncSession]:
    session = session_manager.get_session()

    async with session:
        yield session

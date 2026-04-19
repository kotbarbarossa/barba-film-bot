from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession

from .session_manager import session_manager


async def get_session() -> AsyncGenerator[AsyncSession]:
    async with session_manager.get_session() as session:
        async with session.begin():
            yield session

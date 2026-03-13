from types import TracebackType

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.session_manager import session_manager


class UnitOfWork:
    def __init__(self):
        self.session: AsyncSession | None = None

    async def __aenter__(self):
        self.session = session_manager.get_session()
        return self

    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc: BaseException | None,
        tb: TracebackType | None,
    ) -> None:

        if self.session is None:
            return

        if exc_type:
            await self.session.rollback()
        else:
            await self.session.commit()

        await self.session.close()

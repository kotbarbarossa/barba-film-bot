from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
)


class SessionManager:
    def __init__(self):
        self.engine: AsyncEngine | None = None
        self.session_factory: async_sessionmaker[AsyncSession] | None = None

    def init(self, engine: AsyncEngine) -> None:
        if self.session_factory is not None:
            raise RuntimeError('SessionManager already initialized')

        self.engine = engine

        self.session_factory = async_sessionmaker(
            bind=engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    def get_session(self) -> AsyncSession:
        if self.session_factory is None:
            raise RuntimeError('Session factory not initialized')

        return self.session_factory()

    async def close(self):
        if self.engine:
            await self.engine.dispose()


session_manager = SessionManager()

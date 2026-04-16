from dataclasses import dataclass

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.repositories.base_repository import BaseRepository
from app.user.models import AuthProvider, User


@dataclass
class UserFilter:
    provider: AuthProvider | None = None
    search: str | None = None  # ILIKE по username, first_name, last_name


class UserRepository(BaseRepository[User]):
    def __init__(self, session: AsyncSession):
        super().__init__(User, session)

    async def get_by_provider(
        self,
        provider: AuthProvider,
        provider_user_id: str,
    ) -> User | None:
        stmt = select(User).where(
            User.provider == provider,
            User.provider_user_id == provider_user_id,
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_filtered(self, filters: UserFilter) -> list[User]:
        stmt = select(User)
        if filters.provider is not None:
            stmt = stmt.where(User.provider == filters.provider)
        if filters.search is not None:
            pattern = f'%{filters.search}%'
            stmt = stmt.where(
                or_(
                    User.username.ilike(pattern),
                    User.first_name.ilike(pattern),
                    User.last_name.ilike(pattern),
                )
            )
        return list((await self.session.execute(stmt)).scalars().all())

    async def create(
        self,
        *,
        provider: AuthProvider,
        provider_user_id: str,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> User:
        user = User(
            provider=provider,
            provider_user_id=provider_user_id,
            username=username,
            first_name=first_name,
            last_name=last_name,
        )
        return await self.add(user)

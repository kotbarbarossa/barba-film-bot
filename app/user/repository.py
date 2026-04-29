from dataclasses import dataclass

from sqlalchemy import or_, select
from sqlalchemy.orm import selectinload

from app.infrastructure.database.repositories.base_repository import BaseRepository
from app.user.models import AuthProvider, User, UserAuthProvider


@dataclass
class UserFilter:
    provider: AuthProvider | None = None
    search: str | None = None  # ILIKE по username, first_name, last_name


class UserAuthProviderRepository(BaseRepository[UserAuthProvider]):
    model = UserAuthProvider

    async def get_by_provider(
        self,
        provider: AuthProvider,
        provider_user_id: str,
    ) -> UserAuthProvider | None:
        stmt = (
            select(UserAuthProvider)
            .where(
                UserAuthProvider.provider == provider,
                UserAuthProvider.provider_user_id == provider_user_id,
            )
            .options(selectinload(UserAuthProvider.user))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_user(self, user_id: int) -> list[UserAuthProvider]:
        stmt = select(UserAuthProvider).where(UserAuthProvider.user_id == user_id)
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def create(
        self,
        *,
        user_id: int,
        provider: AuthProvider,
        provider_user_id: str,
    ) -> UserAuthProvider:
        uap = UserAuthProvider(
            user_id=user_id,
            provider=provider,
            provider_user_id=provider_user_id,
        )
        return await self.add(uap)


class UserRepository(BaseRepository[User]):
    model = User

    async def get_by_provider(
        self,
        provider: AuthProvider,
        provider_user_id: str,
    ) -> User | None:
        stmt = (
            select(User)
            .join(UserAuthProvider, User.id == UserAuthProvider.user_id)
            .where(
                UserAuthProvider.provider == provider,
                UserAuthProvider.provider_user_id == provider_user_id,
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_filtered(self, filters: UserFilter) -> list[User]:
        stmt = select(User)
        if filters.provider is not None:
            stmt = stmt.join(UserAuthProvider, User.id == UserAuthProvider.user_id).where(
                UserAuthProvider.provider == filters.provider
            )
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

    async def get_with_providers(self, id_: int) -> User | None:
        stmt = select(User).where(User.id == id_).options(selectinload(User.auth_providers))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        username: str | None = None,
        first_name: str | None = None,
        last_name: str | None = None,
    ) -> User:
        user = User(username=username, first_name=first_name, last_name=last_name)
        return await self.add(user)

from typing import TypeVar

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.base import BaseModel

Model = TypeVar('Model', bound=BaseModel)


class BaseRepository[Model: BaseModel]:
    def __init__(
        self,
        model: type[Model],
        session: AsyncSession,
    ):
        self.model = model
        self.session = session

    async def get(self, id_: int) -> Model | None:
        result = await self.session.execute(select(self.model).where(self.model.id == id_))
        return result.scalar_one_or_none()

    async def list(self) -> list[Model]:
        result = await self.session.execute(select(self.model))
        return list(result.scalars().all())

    async def add(self, entity: Model) -> None:
        self.session.add(entity)
        await self.session.flush()

    async def delete(self, entity: Model):
        await self.session.delete(entity)

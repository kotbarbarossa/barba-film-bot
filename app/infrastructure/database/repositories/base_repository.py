from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.database.base import BaseModel


class BaseRepository[Model: BaseModel]:
    model: type[Model]

    def __init_subclass__(cls, **kwargs: Any) -> None:
        super().__init_subclass__(**kwargs)
        if not hasattr(cls, 'model'):
            raise TypeError(f'{cls.__name__} must define class variable `model`')

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, id_: int) -> Model | None:
        result = await self.session.execute(select(self.model).where(self.model.id == id_))
        return result.scalar_one_or_none()

    async def get_all(self) -> list[Model]:
        result = await self.session.execute(select(self.model))
        return list(result.scalars().all())

    async def add(self, entity: Model) -> Model:
        self.session.add(entity)
        await self.session.flush()
        return entity

    async def update(self, entity: Model, data: dict[str, Any]) -> Model:
        for key, value in data.items():
            setattr(entity, key, value)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity

    async def delete(self, entity: Model) -> None:
        await self.session.delete(entity)
        await self.session.flush()

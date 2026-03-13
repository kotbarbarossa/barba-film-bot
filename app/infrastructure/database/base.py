import re

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase, declared_attr

from app.infrastructure.database.mixins.id import IdMixin
from app.infrastructure.database.mixins.timestamp import TimestampMixin

convention = {
    'ix': 'ix_%(column_0_label)s',
    'uq': 'uq_%(table_name)s_%(column_0_name)s',
    'ck': 'ck_%(table_name)s_%(constraint_name)s',
    'fk': 'fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s',
    'pk': 'pk_%(table_name)s',
}


CAMEL_TO_SNAKE_1 = re.compile(r'(.)([A-Z][a-z]+)')
CAMEL_TO_SNAKE_2 = re.compile(r'([a-z0-9])([A-Z])')


def camel_to_snake(name: str) -> str:
    name = CAMEL_TO_SNAKE_1.sub(r'\1_\2', name)
    name = CAMEL_TO_SNAKE_2.sub(r'\1_\2', name)
    return name.lower()


class Base(DeclarativeBase):
    metadata = MetaData(naming_convention=convention)

    @declared_attr.directive
    def __tablename__(cls) -> str:
        return camel_to_snake(cls.__name__)


class BaseModel(Base, IdMixin, TimestampMixin):
    __abstract__ = True

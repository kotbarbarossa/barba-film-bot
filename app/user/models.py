from enum import StrEnum

from sqlalchemy import Enum, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.database.base import BaseModel


class AuthProvider(StrEnum):
    TELEGRAM = 'telegram'


class User(BaseModel):
    provider: Mapped[AuthProvider] = mapped_column(
        Enum(AuthProvider, name='authprovider'), nullable=False
    )
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(128), nullable=True)

    __table_args__ = (UniqueConstraint('provider', 'provider_user_id'),)

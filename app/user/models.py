from enum import StrEnum

from sqlalchemy import Boolean, Enum, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.database.base import BaseModel


class AuthProvider(StrEnum):
    TELEGRAM = 'telegram'
    GOOGLE = 'google'
    APPLE = 'apple'


class User(BaseModel):
    username: Mapped[str | None] = mapped_column(String(64), nullable=True)
    first_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    last_name: Mapped[str | None] = mapped_column(String(128), nullable=True)
    is_admin: Mapped[bool] = mapped_column(
        Boolean, nullable=False, default=False, server_default='false'
    )

    auth_providers: Mapped[list['UserAuthProvider']] = relationship(back_populates='user')


class UserAuthProvider(BaseModel):
    user_id: Mapped[int] = mapped_column(ForeignKey('user.id'), nullable=False)
    provider: Mapped[AuthProvider] = mapped_column(
        Enum(AuthProvider, name='authprovider'), nullable=False
    )
    provider_user_id: Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped['User'] = relationship(back_populates='auth_providers')

    __table_args__ = (UniqueConstraint('provider', 'provider_user_id'),)

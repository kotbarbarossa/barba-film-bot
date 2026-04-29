from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.user.models import AuthProvider


class UserAuthProviderResponse(BaseModel):
    provider: AuthProvider
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserAuthProviderAdminResponse(UserAuthProviderResponse):
    provider_user_id: str


class UserBase(BaseModel):
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class UserCreate(BaseModel):
    provider: AuthProvider
    provider_user_id: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class UserUpdate(BaseModel):
    username: str | None
    first_name: str | None
    last_name: str | None


class UserAdminUpdate(BaseModel):
    is_admin: bool


class UserResponse(UserBase):
    id: int
    is_admin: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserDetailResponse(UserResponse):
    auth_providers: list[UserAuthProviderResponse]


class UserDetailAdminResponse(UserDetailResponse):
    auth_providers: list[UserAuthProviderAdminResponse]

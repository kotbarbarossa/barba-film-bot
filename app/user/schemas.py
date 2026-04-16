from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.user.models import AuthProvider


class UserBase(BaseModel):
    provider: AuthProvider
    provider_user_id: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    username: str | None
    first_name: str | None
    last_name: str | None


class UserResponse(UserBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

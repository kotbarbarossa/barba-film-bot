from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: int


class TelegramBotAuthRequest(BaseModel):
    telegram_id: str
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None


class RefreshRequest(BaseModel):
    refresh_token: str


class OAuthRequest(BaseModel):
    id_token: str
    first_name: str | None = None
    last_name: str | None = None

from datetime import UTC, datetime, timedelta
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import APIKeyHeader, HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.infrastructure.database.dependencies import get_session
from app.user.models import User
from app.user.repository import UserRepository

_TOKEN_TYPE_ACCESS = 'access'
_TOKEN_TYPE_REFRESH = 'refresh'

_http_bearer = HTTPBearer()
_admin_key_header = APIKeyHeader(name='x-admin-key')


def create_access_token(user_id: int) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)
    payload: dict[str, Any] = {'sub': str(user_id), 'type': _TOKEN_TYPE_ACCESS, 'exp': expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def create_refresh_token(user_id: int) -> str:
    expire = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
    payload: dict[str, Any] = {'sub': str(user_id), 'type': _TOKEN_TYPE_REFRESH, 'exp': expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def _decode_token(token: str, expected_type: str) -> int:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except jwt.ExpiredSignatureError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail='Token expired'
        ) from e
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token'
        ) from e

    if payload.get('type') != expected_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Invalid token type')

    return int(payload['sub'])


def decode_access_token(token: str) -> int:
    return _decode_token(token, _TOKEN_TYPE_ACCESS)


def decode_refresh_token(token: str) -> int:
    return _decode_token(token, _TOKEN_TYPE_REFRESH)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_http_bearer),
    session: AsyncSession = Depends(get_session),
) -> User:
    user_id = decode_access_token(credentials.credentials)

    repo = UserRepository(session)
    user = await repo.get(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')

    return user


async def require_admin_key(
    x_admin_key: str = Depends(_admin_key_header),
) -> None:
    if x_admin_key != settings.admin_api_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')


async def require_admin(
    current_user: User = Depends(get_current_user),
) -> None:
    if not current_user.is_admin:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail='Forbidden')

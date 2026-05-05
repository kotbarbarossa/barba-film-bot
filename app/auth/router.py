from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.providers import OAuthUserInfo, verify_apple_token, verify_google_token
from app.auth.schemas import OAuthRequest, RefreshRequest, TelegramBotAuthRequest, TokenResponse
from app.core.auth import create_access_token, create_refresh_token, decode_refresh_token
from app.core.config import settings
from app.core.limiter import limiter
from app.infrastructure.database.dependencies import get_session
from app.user.models import AuthProvider
from app.user.repository import UserAuthProviderRepository, UserRepository

router = APIRouter(prefix='/auth', tags=['auth'])


async def _get_or_create_user_by_provider(
    session: AsyncSession,
    provider: AuthProvider,
    info: OAuthUserInfo,
) -> int:
    repo = UserRepository(session)
    uap_repo = UserAuthProviderRepository(session)

    user = await repo.get_by_provider(provider, info.provider_user_id)
    if user is None:
        user = await repo.create(
            username=info.username,
            first_name=info.first_name,
            last_name=info.last_name,
        )
        await uap_repo.create(
            user_id=user.id,
            provider=provider,
            provider_user_id=info.provider_user_id,
        )

    return user.id


@router.post('/telegram/bot', response_model=TokenResponse)
@limiter.limit('20/minute')  # type: ignore[misc]
async def telegram_bot_auth(
    request: Request,
    data: TelegramBotAuthRequest,
    x_bot_secret: Annotated[str | None, Header()] = None,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    if x_bot_secret != settings.bot_secret:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='Forbidden')

    user_id = await _get_or_create_user_by_provider(
        session,
        AuthProvider.TELEGRAM,
        OAuthUserInfo(
            provider_user_id=data.telegram_id,
            username=data.username,
            first_name=data.first_name,
            last_name=data.last_name,
        ),
    )
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        user_id=user_id,
    )


@router.post('/google', response_model=TokenResponse)
@limiter.limit('10/minute')  # type: ignore[misc]
async def google_auth(
    request: Request,
    data: OAuthRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    try:
        info = await verify_google_token(data.id_token, settings.google_client_id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e

    user_id = await _get_or_create_user_by_provider(session, AuthProvider.GOOGLE, info)
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        user_id=user_id,
    )


@router.post('/apple', response_model=TokenResponse)
@limiter.limit('10/minute')  # type: ignore[misc]
async def apple_auth(
    request: Request,
    data: OAuthRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    extra = ['host.exp.Exponent'] if settings.environment != 'prod' else []
    try:
        info = await verify_apple_token(data.id_token, settings.apple_bundle_id, extra)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e)) from e

    if data.first_name:
        info.first_name = data.first_name
    if data.last_name:
        info.last_name = data.last_name

    user_id = await _get_or_create_user_by_provider(session, AuthProvider.APPLE, info)
    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        user_id=user_id,
    )


@router.post('/refresh', response_model=TokenResponse)
@limiter.limit('20/minute')  # type: ignore[misc]
async def refresh_token(
    request: Request,
    data: RefreshRequest,
    session: AsyncSession = Depends(get_session),
) -> TokenResponse:
    user_id = decode_refresh_token(data.refresh_token)

    repo = UserRepository(session)
    user = await repo.get(user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail='User not found')

    return TokenResponse(
        access_token=create_access_token(user_id),
        refresh_token=create_refresh_token(user_id),
        user_id=user_id,
    )

import asyncio
from dataclasses import dataclass
from typing import Any

import jwt
from jwt import PyJWKClient

_google_jwks = PyJWKClient(
    'https://www.googleapis.com/oauth2/v3/certs',
    cache_jwk_set=True,
    lifespan=3600,
)
_apple_jwks = PyJWKClient(
    'https://appleid.apple.com/auth/keys',
    cache_jwk_set=True,
    lifespan=3600,
)


@dataclass
class OAuthUserInfo:
    provider_user_id: str
    first_name: str | None
    last_name: str | None
    username: str | None


async def verify_google_token(id_token: str, client_id: str) -> OAuthUserInfo:
    try:
        signing_key = await asyncio.to_thread(_google_jwks.get_signing_key_from_jwt, id_token)
        payload: dict[str, Any] = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=['RS256'],
            audience=client_id,
            issuer=['accounts.google.com', 'https://accounts.google.com'],
        )
    except jwt.PyJWTError as e:
        raise ValueError(str(e)) from e

    return OAuthUserInfo(
        provider_user_id=payload['sub'],
        first_name=payload.get('given_name'),
        last_name=payload.get('family_name'),
        username=payload.get('name'),
    )


async def verify_apple_token(id_token: str, bundle_id: str) -> OAuthUserInfo:
    try:
        signing_key = await asyncio.to_thread(_apple_jwks.get_signing_key_from_jwt, id_token)
        payload: dict[str, Any] = jwt.decode(
            id_token,
            signing_key.key,
            algorithms=['RS256'],
            audience=bundle_id,
            issuer='https://appleid.apple.com',
        )
    except jwt.PyJWTError as e:
        raise ValueError(str(e)) from e

    return OAuthUserInfo(
        provider_user_id=payload['sub'],
        first_name=None,
        last_name=None,
        username=None,
    )

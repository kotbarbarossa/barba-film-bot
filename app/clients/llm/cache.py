import hashlib
import logging
from typing import Any

from app.clients.llm.base import LLMClient
from app.clients.llm.schemas import LLMMovieData
from app.movie.models import MediaType

logger = logging.getLogger(__name__)

_TTL = 60 * 60 * 24 * 7  # 7 days


def _cache_key(op: str, title: str, media_type: MediaType, year: int | None) -> str:
    raw = f'{op}:{title.lower().strip()}:{media_type.value}:{year}'
    return f'llm:{hashlib.md5(raw.encode()).hexdigest()}'  # noqa: S324


class CachedLLMClient:
    def __init__(self, inner: LLMClient, redis: Any) -> None:
        self._inner = inner
        self._redis = redis

    async def fetch_movie_data(
        self,
        *,
        title: str,
        media_type: MediaType,
        user_query: str | None,
        year: int | None = None,
    ) -> LLMMovieData | None:
        # Skip cache when user_query is present — result depends on context
        key = _cache_key('lookup', title, media_type, year) if not user_query else None
        if key:
            cached = await self._redis.get(key)
            if cached:
                logger.debug('LLM cache hit: %r', title)
                return LLMMovieData.model_validate_json(cached)

        result = await self._inner.fetch_movie_data(
            title=title, media_type=media_type, user_query=user_query, year=year
        )
        if result and key:
            await self._redis.set(key, result.model_dump_json(), ex=_TTL)
        return result

    async def fetch_movie_data_enriched(
        self,
        *,
        title_original: str,
        title_ru: str | None,
        year: int | None,
        overview: str | None,
        media_type: MediaType,
    ) -> LLMMovieData | None:
        key = _cache_key('enrich', title_original, media_type, year)
        cached = await self._redis.get(key)
        if cached:
            logger.debug('LLM cache hit: %r (enrich)', title_original)
            return LLMMovieData.model_validate_json(cached)

        result = await self._inner.fetch_movie_data_enriched(
            title_original=title_original,
            title_ru=title_ru,
            year=year,
            overview=overview,
            media_type=media_type,
        )
        if result:
            await self._redis.set(key, result.model_dump_json(), ex=_TTL)
        return result

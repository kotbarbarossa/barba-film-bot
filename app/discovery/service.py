from sqlalchemy.ext.asyncio import AsyncSession

from app.discovery.repository import DiscoveryRepository
from app.discovery.schemas import GlobalTrendingResponse
from app.infrastructure import arq_pool

_CACHE_KEY = 'discovery:global_trending'
_CACHE_TTL = 3600  # 1 hour
_TOP_LIMIT = 10


async def get_global_trending(session: AsyncSession) -> GlobalTrendingResponse:
    redis = arq_pool.get()

    cached = await redis.get(_CACHE_KEY)
    if cached:
        return GlobalTrendingResponse.model_validate_json(cached)

    result = await _compute_global_trending(session)

    await redis.set(_CACHE_KEY, result.model_dump_json(), ex=_CACHE_TTL)
    return result


async def _compute_global_trending(session: AsyncSession) -> GlobalTrendingResponse:
    repo = DiscoveryRepository(session)

    for min_count in (3, 2, 1):
        entries = await repo.get_global_trending(min_count=min_count, limit=_TOP_LIMIT)
        if len(entries) >= _TOP_LIMIT:
            return GlobalTrendingResponse(
                entries=entries, is_trending=True, min_count_used=min_count
            )

    entries = await repo.get_all_time_top(limit=_TOP_LIMIT)
    return GlobalTrendingResponse(entries=entries, is_trending=False, min_count_used=0)

import json

from sqlalchemy.ext.asyncio import AsyncSession

from app.discovery.repository import DiscoveryRepository
from app.discovery.schemas import ChartResponse, GlobalTrendingResponse, MovieChartPosition
from app.infrastructure import arq_pool

_CACHE_TTL = 3600
_TOP_LIMIT = 10

_KEY_GLOBAL_TRENDING = 'discovery:global_trending'
_KEY_TOP_RATED = 'discovery:top_rated'
_KEY_TOP_WANT = 'discovery:top_want'
_KEY_TOP_WATCHED = 'discovery:top_watched'
_KEY_TOP_CONTROVERSIAL = 'discovery:top_controversial'
_KEY_TOP_QUICK = 'discovery:top_quick'
_KEY_TOP_POSTPONED = 'discovery:top_postponed'


_ALL_CHART_KEYS: list[tuple[str, str]] = [
    ('global-trending', _KEY_GLOBAL_TRENDING),
    ('top-rated', _KEY_TOP_RATED),
    ('top-want', _KEY_TOP_WANT),
    ('top-watched', _KEY_TOP_WATCHED),
    ('top-controversial', _KEY_TOP_CONTROVERSIAL),
    ('top-quick', _KEY_TOP_QUICK),
    ('top-postponed', _KEY_TOP_POSTPONED),
]


async def get_movie_chart_positions(movie_id: int) -> list[MovieChartPosition]:
    redis = arq_pool.get()
    slugs = [slug for slug, _ in _ALL_CHART_KEYS]
    keys = [key for _, key in _ALL_CHART_KEYS]
    cached_values = await redis.mget(*keys)

    positions: list[MovieChartPosition] = []
    for slug, cached in zip(slugs, cached_values, strict=False):
        if not cached:
            continue
        entries = json.loads(cached).get('entries', [])
        for rank, entry in enumerate(entries, 1):
            if entry.get('movie_id') == movie_id:
                positions.append(MovieChartPosition(chart_slug=slug, rank=rank))
                break
    return positions


async def get_global_trending(session: AsyncSession) -> GlobalTrendingResponse:
    redis = arq_pool.get()
    cached = await redis.get(_KEY_GLOBAL_TRENDING)
    if cached:
        return GlobalTrendingResponse.model_validate_json(cached)

    result = await _compute_global_trending(session)
    if result.entries:
        await redis.set(_KEY_GLOBAL_TRENDING, result.model_dump_json(), ex=_CACHE_TTL)
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


async def get_top_rated(session: AsyncSession) -> ChartResponse:
    redis = arq_pool.get()
    cached = await redis.get(_KEY_TOP_RATED)
    if cached:
        return ChartResponse.model_validate_json(cached)

    repo = DiscoveryRepository(session)
    for min_count in (3, 2, 1):
        entries = await repo.get_top_rated(min_count=min_count, limit=_TOP_LIMIT)
        if len(entries) >= _TOP_LIMIT:
            result = ChartResponse(entries=entries)
            await redis.set(_KEY_TOP_RATED, result.model_dump_json(), ex=_CACHE_TTL)
            return result

    entries = await repo.get_all_time_top(limit=_TOP_LIMIT)
    result = ChartResponse(entries=entries)
    if result.entries:
        await redis.set(_KEY_TOP_RATED, result.model_dump_json(), ex=_CACHE_TTL)
    return result


async def get_top_want(session: AsyncSession) -> ChartResponse:
    redis = arq_pool.get()
    cached = await redis.get(_KEY_TOP_WANT)
    if cached:
        return ChartResponse.model_validate_json(cached)

    repo = DiscoveryRepository(session)
    entries = await repo.get_top_want(limit=_TOP_LIMIT)
    if len(entries) < _TOP_LIMIT:
        entries = await repo.get_top_want(window_days=None, limit=_TOP_LIMIT)

    result = ChartResponse(entries=entries)
    if result.entries:
        await redis.set(_KEY_TOP_WANT, result.model_dump_json(), ex=_CACHE_TTL)
    return result


async def get_top_watched(session: AsyncSession) -> ChartResponse:
    redis = arq_pool.get()
    cached = await redis.get(_KEY_TOP_WATCHED)
    if cached:
        return ChartResponse.model_validate_json(cached)

    repo = DiscoveryRepository(session)
    entries = await repo.get_top_watched(limit=_TOP_LIMIT)
    result = ChartResponse(entries=entries)
    if result.entries:
        await redis.set(_KEY_TOP_WATCHED, result.model_dump_json(), ex=_CACHE_TTL)
    return result


async def get_top_controversial(session: AsyncSession) -> ChartResponse:
    redis = arq_pool.get()
    cached = await redis.get(_KEY_TOP_CONTROVERSIAL)
    if cached:
        return ChartResponse.model_validate_json(cached)

    repo = DiscoveryRepository(session)
    entries = []
    for min_count in (3, 2):
        entries = await repo.get_top_controversial(min_count=min_count, limit=_TOP_LIMIT)
        if len(entries) >= _TOP_LIMIT:
            break

    result = ChartResponse(entries=entries)
    if result.entries:
        await redis.set(_KEY_TOP_CONTROVERSIAL, result.model_dump_json(), ex=_CACHE_TTL)
    return result


async def get_top_quick(session: AsyncSession) -> ChartResponse:
    redis = arq_pool.get()
    cached = await redis.get(_KEY_TOP_QUICK)
    if cached:
        return ChartResponse.model_validate_json(cached)

    repo = DiscoveryRepository(session)
    entries = []
    for min_count in (3, 2, 1):
        entries = await repo.get_top_quick(min_count=min_count, limit=_TOP_LIMIT)
        if len(entries) >= _TOP_LIMIT:
            break

    result = ChartResponse(entries=entries)
    if result.entries:
        await redis.set(_KEY_TOP_QUICK, result.model_dump_json(), ex=_CACHE_TTL)
    return result


async def get_top_postponed(session: AsyncSession) -> ChartResponse:
    redis = arq_pool.get()
    cached = await redis.get(_KEY_TOP_POSTPONED)
    if cached:
        return ChartResponse.model_validate_json(cached)

    repo = DiscoveryRepository(session)
    entries = await repo.get_top_postponed(limit=_TOP_LIMIT)
    if not entries:
        entries = await repo.get_top_postponed(older_than_days=None, limit=_TOP_LIMIT)

    result = ChartResponse(entries=entries)
    if result.entries:
        await redis.set(_KEY_TOP_POSTPONED, result.model_dump_json(), ex=_CACHE_TTL)
    return result

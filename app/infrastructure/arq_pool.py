from arq import ArqRedis, create_pool
from arq.connections import RedisSettings

_pool: ArqRedis | None = None


async def init(redis_url: str) -> None:
    global _pool
    _pool = await create_pool(RedisSettings.from_dsn(redis_url))


def get() -> ArqRedis:
    if _pool is None:
        raise RuntimeError('ARQ pool is not initialized')
    return _pool


async def close() -> None:
    global _pool
    if _pool is not None:
        await _pool.aclose()
        _pool = None

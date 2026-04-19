import asyncio
import logging
from typing import Any

from arq.connections import RedisSettings

from app.core.config import settings
from app.core.sentry import init_sentry
from app.infrastructure.database.engine import create_engine
from app.infrastructure.database.session_manager import session_manager
from app.worker.tasks import process_movie


async def startup(ctx: dict[str, Any]) -> None:
    logging.basicConfig(level=logging.INFO)
    init_sentry('worker')
    engine = create_engine()
    session_manager.init(engine)


async def shutdown(ctx: dict[str, Any]) -> None:
    await session_manager.close()


class WorkerSettings:
    functions = [process_movie]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_tries = 3
    job_timeout = 60


if __name__ == '__main__':
    from arq import run_worker

    asyncio.run(run_worker(WorkerSettings))  # type: ignore[arg-type]

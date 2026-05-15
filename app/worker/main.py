import asyncio
import logging
from typing import Any

from arq.connections import RedisSettings
from arq.cron import cron

from app.clients.llm import CachedLLMClient, ClaudeLLMClient, GroqLLMClient, LLMProvider
from app.clients.llm.observability import get_langfuse
from app.core.config import settings
from app.core.sentry import init_sentry
from app.infrastructure.database.engine import create_engine
from app.infrastructure.database.session_manager import session_manager
from app.worker.tasks import process_movie, recover_pending_movies


async def startup(ctx: dict[str, Any]) -> None:
    logging.basicConfig(level=logging.INFO)
    init_sentry('worker')
    engine = create_engine()
    session_manager.init(engine)
    llm_clients = {
        LLMProvider.groq: CachedLLMClient(
            inner=GroqLLMClient(api_key=settings.groq_api_key, model=settings.groq_model),
            redis=ctx['redis'],
        ),
    }
    if settings.anthropic_api_key:
        llm_clients[LLMProvider.claude] = CachedLLMClient(
            inner=ClaudeLLMClient(
                api_key=settings.anthropic_api_key, model=settings.anthropic_model
            ),
            redis=ctx['redis'],
        )
    ctx['llm'] = llm_clients
    await recover_pending_movies(ctx)


async def shutdown(ctx: dict[str, Any]) -> None:
    await session_manager.close()
    lf = get_langfuse()
    if lf:
        lf.flush()


class WorkerSettings:
    functions = [process_movie]
    cron_jobs = [
        cron(recover_pending_movies, minute={0, 10, 20, 30, 40, 50}),
    ]
    on_startup = startup
    on_shutdown = shutdown
    redis_settings = RedisSettings.from_dsn(settings.redis_url)
    max_tries = 3
    job_timeout = 60


if __name__ == '__main__':
    from arq import run_worker

    asyncio.run(run_worker(WorkerSettings))  # type: ignore[arg-type]

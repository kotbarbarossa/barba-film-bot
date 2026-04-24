import logging
from datetime import timedelta
from typing import Any

from arq import Retry

import app.user.models  # noqa: F401 — registers User table in SQLAlchemy metadata
from app.clients.groq import GroqRateLimitError
from app.infrastructure.database.session_manager import session_manager
from app.movie.processing_use_case import ProcessMovieUseCase
from app.movie.repository import MovieRepository

logger = logging.getLogger(__name__)


async def process_movie(_ctx: dict[str, Any], *, movie_id: int, year: int | None = None) -> None:
    session = session_manager.get_session()
    try:
        async with session.begin():
            movie = await MovieRepository(session).get(movie_id)
            if movie is None:
                raise Retry(defer=timedelta(seconds=3))
            await ProcessMovieUseCase(session).execute(movie_id, year)
    except GroqRateLimitError:
        logger.warning('Movie %d: Groq 429 — stays PENDING, recover cron will retry', movie_id)


async def recover_pending_movies(ctx: dict[str, Any]) -> None:
    """Re-enqueue PENDING movies that were never picked up or exhausted all retries."""
    session = session_manager.get_session()
    async with session.begin():
        movies = await MovieRepository(session).get_stale_pending(older_than_minutes=10)

    if not movies:
        return

    logger.info('recover_pending_movies: found %d stale PENDING movies', len(movies))
    redis = ctx['redis']
    for movie in movies:
        await redis.enqueue_job('process_movie', movie_id=movie.id)
        logger.info('recover_pending_movies: re-enqueued movie_id=%d', movie.id)

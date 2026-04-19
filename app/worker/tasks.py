import logging
from datetime import timedelta
from typing import Any

from arq import Retry

import app.user.models  # noqa: F401 — registers User table in SQLAlchemy metadata
from app.infrastructure.database.session_manager import session_manager
from app.movie.processing_use_case import ProcessMovieUseCase
from app.movie.repository import MovieRepository

logger = logging.getLogger(__name__)


async def process_movie(_ctx: dict[str, Any], *, movie_id: int) -> None:
    session = session_manager.get_session()
    async with session.begin():
        movie = await MovieRepository(session).get(movie_id)
        if movie is None:
            raise Retry(defer=timedelta(seconds=3))
        await ProcessMovieUseCase(session).execute(movie_id)

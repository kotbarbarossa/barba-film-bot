"""Backfill description_original and poster_url_original for processed movies.

Fetches English data from TMDB for movies that have a tmdb_id but are missing
one or both original-language fields. Skips movies without tmdb_id.
"""

import asyncio
import logging

from sqlalchemy import or_, select, update

from app.clients.tmdb import fetch_movie_by_id
from app.core.config import settings
from app.infrastructure.database.engine import create_engine
from app.infrastructure.database.session_manager import session_manager
from app.movie.models import Movie, ProcessingStatus

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)


async def main() -> None:
    engine = create_engine()
    session_manager.init(engine)

    try:
        async with session_manager.get_session() as session:
            result = await session.execute(
                select(Movie).where(
                    Movie.processing_status == ProcessingStatus.PROCESSED,
                    Movie.tmdb_id.is_not(None),
                    Movie.media_type.is_not(None),
                    or_(
                        Movie.poster_url_original.is_(None),
                        Movie.description_original.is_(None),
                    ),
                )
            )
            movies = result.scalars().all()

        logger.info('Found %d movies to backfill', len(movies))

        updated = 0
        skipped = 0

        for movie in movies:
            tmdb_en = await fetch_movie_by_id(
                tmdb_id=movie.tmdb_id,  # type: ignore[arg-type]
                media_type=movie.media_type,  # type: ignore[arg-type]
                api_key=settings.tmdb_api_key,
            )

            if tmdb_en is None:
                logger.warning(
                    'Movie %d (%r): TMDB fetch failed, skipping', movie.id, movie.title_original
                )
                skipped += 1
                await asyncio.sleep(1)
                continue

            fields: dict[str, str] = {}
            if movie.poster_url_original is None and tmdb_en.poster_url:
                fields['poster_url_original'] = tmdb_en.poster_url
            if movie.description_original is None and tmdb_en.overview:
                fields['description_original'] = tmdb_en.overview

            if fields:
                async with session_manager.get_session() as session:
                    await session.execute(
                        update(Movie).where(Movie.id == movie.id).values(**fields)
                    )
                    await session.commit()
                logger.info(
                    'Movie %d (%r): updated %s',
                    movie.id,
                    movie.title_original or movie.title_ru,
                    ', '.join(fields.keys()),
                )
                updated += 1
            else:
                logger.info('Movie %d (%r): nothing to update', movie.id, movie.title_original)
                skipped += 1

            await asyncio.sleep(1)

    finally:
        await session_manager.close()

    logger.info('Done. Updated: %d, skipped: %d', updated, skipped)


if __name__ == '__main__':
    asyncio.run(main())

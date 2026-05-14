"""Replace poster_url for all processed movies with TMDB (en-US) posters."""

import asyncio
import logging

from sqlalchemy import select, update

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
                )
            )
            movies = result.scalars().all()

        logger.info('Found %d movies to process', len(movies))
        updated = skipped = 0

        for movie in movies:
            tmdb = await fetch_movie_by_id(
                tmdb_id=movie.tmdb_id,  # type: ignore[arg-type]
                media_type=movie.media_type,  # type: ignore[arg-type]
                api_key=settings.tmdb_api_key,
                language='ru-RU',
            )
            if tmdb is None or not tmdb.poster_url:
                logger.warning(
                    'Movie %d (%r): no TMDB poster, skipping',
                    movie.id,
                    movie.title_original or movie.title_ru,
                )
                skipped += 1
                await asyncio.sleep(0.3)
                continue

            async with session_manager.get_session() as session:
                await session.execute(
                    update(Movie).where(Movie.id == movie.id).values(poster_url=tmdb.poster_url)
                )
                await session.commit()
            logger.info(
                'Movie %d (%r): updated poster',
                movie.id,
                movie.title_original or movie.title_ru,
            )
            updated += 1
            await asyncio.sleep(0.3)

    finally:
        await session_manager.close()

    logger.info('Done. Updated: %d, skipped: %d', updated, skipped)


if __name__ == '__main__':
    asyncio.run(main())

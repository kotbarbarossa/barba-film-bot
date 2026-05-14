import asyncio
import logging

from sqlalchemy import or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.tmdb import fetch_movie_by_id
from app.core.config import settings
from app.infrastructure import arq_pool
from app.movie.models import MediaType, Movie, ProcessingStatus
from app.movie.repository import MoviePersonRepository, MovieRepository
from app.utils.text import is_cyrillic

logger = logging.getLogger(__name__)

_CLEARED_FIELDS: dict[str, None] = {
    'description': None,
    'description_original': None,
    'year': None,
    'duration_minutes': None,
    'age_rating': None,
    'imdb_rating': None,
    'kinopoisk_rating': None,
    'tmdb_rating': None,
    'country': None,
    'poster_url': None,
    'poster_url_original': None,
    'trailer_url': None,
    'tmdb_id': None,
    'user_query': None,
}


class ReprocessMovieUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.movie_repo = MovieRepository(session)
        self.movie_person_repo = MoviePersonRepository(session)

    async def execute(
        self,
        *,
        movie_id: int,
        title: str,
        media_type: MediaType,
        user_query: str | None = None,
        year: int | None = None,
    ) -> None:
        movie = await self.movie_repo.get(movie_id)
        if movie is None:
            raise ValueError(f'Movie {movie_id} not found')

        title_ru = title if is_cyrillic(title) else None
        title_original = title if not is_cyrillic(title) else None

        await self.movie_repo.update(
            movie,
            {
                **_CLEARED_FIELDS,
                'title_ru': title_ru,
                'title_original': title_original,
                'media_type': media_type,
                'processing_status': ProcessingStatus.PENDING,
                'user_query': user_query,
            },
        )

        await self.session.refresh(movie, attribute_names=['categories'])
        movie.categories = []
        await self.session.flush()

        await self.movie_person_repo.delete_all_by_movie(movie_id)

        await arq_pool.get().enqueue_job('process_movie', movie_id=movie_id, year=year)
        logger.info('Movie %d reset and re-enqueued for processing', movie_id)


class BackfillEnglishFieldsUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def execute(self) -> dict[str, int]:
        result = await self.session.execute(
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

        updated = skipped = 0
        for movie in movies:
            tmdb = await fetch_movie_by_id(
                tmdb_id=movie.tmdb_id,  # type: ignore[arg-type]
                media_type=movie.media_type,  # type: ignore[arg-type]
                api_key=settings.tmdb_api_key,
            )
            if tmdb is None:
                logger.warning('Movie %d: TMDB fetch failed, skipping', movie.id)
                skipped += 1
                await asyncio.sleep(1)
                continue

            fields: dict[str, str] = {}
            if movie.poster_url_original is None and tmdb.poster_url:
                fields['poster_url_original'] = tmdb.poster_url
            if movie.description_original is None and tmdb.overview:
                fields['description_original'] = tmdb.overview

            if fields:
                await self.session.execute(
                    update(Movie).where(Movie.id == movie.id).values(**fields)
                )
                await self.session.flush()
                logger.info('Movie %d: updated %s', movie.id, ', '.join(fields.keys()))
                updated += 1
            else:
                skipped += 1

            await asyncio.sleep(1)

        return {'updated': updated, 'skipped': skipped}


class ReplacePosterUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def execute(self, movie_id: int) -> None:
        result = await self.session.execute(select(Movie).where(Movie.id == movie_id))
        movie = result.scalar_one_or_none()
        if movie is None:
            raise ValueError(f'Movie {movie_id} not found')
        if movie.tmdb_id is None or movie.media_type is None:
            raise ValueError(f'Movie {movie_id} has no TMDB ID or media type')

        tmdb = await fetch_movie_by_id(
            tmdb_id=movie.tmdb_id,
            media_type=movie.media_type,
            api_key=settings.tmdb_api_key,
            language='ru-RU',
        )
        if tmdb is None or not tmdb.poster_url:
            raise ValueError(f'Movie {movie_id}: no TMDB poster found')

        await self.session.execute(
            update(Movie).where(Movie.id == movie_id).values(poster_url=tmdb.poster_url)
        )
        await self.session.commit()
        logger.info('Movie %d: poster replaced', movie_id)

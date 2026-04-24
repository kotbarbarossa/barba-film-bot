import asyncio
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure import arq_pool
from app.movie.models import MediaType, Movie, ProcessingStatus
from app.movie.repository import MovieFilter, MovieRepository, UserMovieRepository
from app.utils.text import is_cyrillic

logger = logging.getLogger(__name__)


class CreateMovieUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = MovieRepository(session)

    async def execute(
        self,
        *,
        title_ru: str | None = None,
        title_original: str | None = None,
        media_type: MediaType | None = None,
        user_query: str | None = None,
    ) -> Movie:
        if not title_ru and not title_original:
            raise ValueError('At least one title must be provided')
        return await self.repo.create(
            title_ru=title_ru,
            title_original=title_original,
            media_type=media_type,
            user_query=user_query,
        )


class AddMovieToUserUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.movie_repo = MovieRepository(session)
        self.user_movie_repo = UserMovieRepository(session)

    async def execute(
        self,
        *,
        user_id: int,
        title: str,
        media_type: MediaType,
        user_query: str | None,
        year: int | None = None,
    ) -> tuple[Movie, bool]:
        """
        Returns (movie, found_existing) where found_existing=True means
        the movie was matched in the database (no new entry created).
        """
        title_ru = title if is_cyrillic(title) else None
        title_original = title if not is_cyrillic(title) else None

        movie = await self._find_existing(title, media_type, year)
        found_existing = movie is not None

        if movie is None:
            movie = await self.movie_repo.create(
                title_ru=title_ru,
                title_original=title_original,
                media_type=media_type,
                user_query=user_query,
            )
            try:
                await asyncio.wait_for(
                    arq_pool.get().enqueue_job(
                        'process_movie',
                        movie_id=movie.id,
                        year=year,
                        _job_id=f'process_movie:{movie.id}',
                    ),
                    timeout=5.0,
                )
            except TimeoutError:
                logger.error('enqueue_job timed out for movie_id=%d', movie.id)
            except Exception:
                logger.exception('enqueue_job failed for movie_id=%d', movie.id)

        existing_link = await self.user_movie_repo.get_by_user_and_movie(user_id, movie.id)
        if existing_link is None:
            await self.user_movie_repo.create(user_id=user_id, movie_id=movie.id)

        return movie, found_existing

    async def _find_existing(
        self, title: str, media_type: MediaType, year: int | None
    ) -> Movie | None:
        results = await self.movie_repo.get_filtered(
            MovieFilter(
                search=title,
                media_type=media_type,
                processing_status=ProcessingStatus.PROCESSED,
                year_from=year - 1 if year else None,
                year_to=year + 1 if year else None,
            )
        )
        return results[0] if len(results) == 1 else None

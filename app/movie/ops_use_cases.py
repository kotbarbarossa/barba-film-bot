import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure import arq_pool
from app.movie.models import MediaType, ProcessingStatus
from app.movie.repository import MoviePersonRepository, MovieRepository
from app.utils.text import is_cyrillic

logger = logging.getLogger(__name__)

_CLEARED_FIELDS: dict[str, None] = {
    'description': None,
    'year': None,
    'duration_minutes': None,
    'age_rating': None,
    'imdb_rating': None,
    'kinopoisk_rating': None,
    'tmdb_rating': None,
    'country': None,
    'poster_url': None,
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

        # Clear categories
        await self.session.refresh(movie, attribute_names=['categories'])
        movie.categories = []
        await self.session.flush()

        # Clear persons
        await self.movie_person_repo.delete_all_by_movie(movie_id)

        await arq_pool.get().enqueue_job('process_movie', movie_id=movie_id, year=year)
        logger.info('Movie %d reset and re-enqueued for processing', movie_id)

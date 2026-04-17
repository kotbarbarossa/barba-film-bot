import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.movie.models import Movie, ProcessingStatus
from app.movie.query_parser import parse_movie_query
from app.movie.repository import MovieFilter, MovieRepository, UserMovieRepository

logger = logging.getLogger(__name__)


class CreateMovieUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = MovieRepository(session)

    async def execute(self, user_query: str) -> Movie:
        if not user_query.strip():
            raise ValueError('Movie query cannot be empty')
        return await self.repo.create(user_query=user_query)


class AddMovieToUserUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.movie_repo = MovieRepository(session)
        self.user_movie_repo = UserMovieRepository(session)

    async def execute(self, *, user_id: int, user_query: str) -> Movie:
        if not user_query.strip():
            raise ValueError('Movie query cannot be empty')

        movie = await self._find_existing(user_query)
        if movie is None:
            movie = await self.movie_repo.create(user_query=user_query)
            # TODO: запустить фоновую задачу обработки фильма (ChatGPT API)

        await self.user_movie_repo.create(user_id=user_id, movie_id=movie.id)
        return movie

    async def _find_existing(self, user_query: str) -> Movie | None:
        parsed = parse_movie_query(user_query)
        logger.info('_find_existing: parsed=%s', parsed)
        if not parsed.title:
            return None

        results = await self.movie_repo.get_filtered(
            MovieFilter(
                search=parsed.title,
                year_from=parsed.year_from,
                year_to=parsed.year_to,
                media_type=parsed.media_type,
                processing_status=ProcessingStatus.PROCESSED,
            )
        )
        logger.info('_find_existing: results=%s', results)
        return results[0] if len(results) == 1 else None

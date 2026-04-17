from sqlalchemy.ext.asyncio import AsyncSession

from app.movie.models import Movie
from app.movie.repository import MovieRepository


class CreateMovieUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = MovieRepository(session)

    async def execute(self, user_query: str) -> Movie:
        if not user_query.strip():
            raise ValueError('Movie query cannot be empty')
        return await self.repo.create(user_query=user_query)

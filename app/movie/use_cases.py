from sqlalchemy.ext.asyncio import AsyncSession

from app.movie.models import MediaType, Movie
from app.movie.repository import MovieRepository

_CYRILLIC_DOMINANCE_THRESHOLD = 0.5


def _is_cyrillic(text: str) -> bool:
    cyrillic_count = sum(1 for ch in text if '\u0400' <= ch <= '\u04ff')
    cyrillic_ratio = cyrillic_count / len(text)
    return cyrillic_ratio > _CYRILLIC_DOMINANCE_THRESHOLD


class CreateMovieUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.repo = MovieRepository(session)

    async def execute(
        self,
        title: str,
        media_type: MediaType = MediaType.FILM,
    ) -> Movie:
        if not title.strip():
            raise ValueError('Movie title cannot be empty')
        if _is_cyrillic(title):
            return await self.repo.create(title_ru=title, media_type=media_type)
        return await self.repo.create(title_original=title, media_type=media_type)

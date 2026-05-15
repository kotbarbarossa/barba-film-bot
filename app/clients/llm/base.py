from enum import StrEnum
from typing import Protocol

from app.clients.llm.schemas import LLMMovieData
from app.movie.models import MediaType


class LLMProvider(StrEnum):
    groq = 'groq'
    claude = 'claude'


class LLMRateLimitError(Exception):
    pass


class LLMClient(Protocol):
    async def fetch_movie_data(
        self,
        *,
        title: str,
        media_type: MediaType,
        user_query: str | None,
        year: int | None = None,
    ) -> LLMMovieData | None: ...

    async def fetch_movie_data_enriched(
        self,
        *,
        title_original: str,
        title_ru: str | None,
        year: int | None,
        overview: str | None,
        media_type: MediaType,
    ) -> LLMMovieData | None: ...

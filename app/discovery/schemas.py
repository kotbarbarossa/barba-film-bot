from pydantic import BaseModel

from app.movie.models import MediaType


class ChartEntry(BaseModel):
    movie_id: int
    title_ru: str | None
    title_original: str | None
    poster_url: str | None
    poster_url_original: str | None = None
    year: int | None
    media_type: MediaType | None
    watch_count: int
    score: float


class ChartResponse(BaseModel):
    entries: list[ChartEntry]


class GlobalTrendingResponse(BaseModel):
    entries: list[ChartEntry]
    is_trending: bool  # True = 60-day window, False = all-time fallback
    min_count_used: int  # 1/2/3 for trending, 0 for all-time


class PublicPosterEntry(BaseModel):
    id: int
    title_ru: str | None
    title_original: str | None
    year: int | None
    poster_url: str
    poster_url_original: str | None


class PublicPostersResponse(BaseModel):
    entries: list[PublicPosterEntry]

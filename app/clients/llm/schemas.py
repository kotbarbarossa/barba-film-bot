from datetime import date

from pydantic import BaseModel

from app.movie.models import MediaType, RoleType


class CategoryData(BaseModel):
    name: str
    name_original: str | None = None


class PersonData(BaseModel):
    name: str | None = None
    original_name: str | None = None
    birth_date: date | None = None
    country: str | None = None
    role: RoleType
    character_name: str | None = None


class LLMMovieData(BaseModel):
    """Data returned directly by the LLM — no TMDB-specific fields."""

    title_original: str | None = None
    title_ru: str | None = None
    description: str | None = None
    description_original: str | None = None
    year: int | None = None
    duration_minutes: int | None = None
    age_rating: str | None = None
    imdb_rating: float | None = None
    kinopoisk_rating: float | None = None
    country: str | None = None
    media_type: MediaType
    categories: list[CategoryData]
    persons: list[PersonData]


class MovieData(LLMMovieData):
    """LLMMovieData enriched with TMDB poster, ID, and rating."""

    poster_url: str | None = None
    poster_url_original: str | None = None
    trailer_url: str | None = None
    tmdb_id: str | None = None
    tmdb_rating: float | None = None

from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict

from app.movie.models import MediaType, ProcessingStatus, RoleType, WatchStatus


class CategoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class PersonResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    original_name: str | None
    photo_url: str | None
    birth_date: date | None
    country: str | None


class PersonInMovieResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    role_type: RoleType
    character_name: str | None
    person: PersonResponse


class MovieListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_query: str | None
    processing_status: ProcessingStatus
    title_original: str | None
    title_ru: str | None
    year: int | None
    media_type: MediaType | None
    poster_url: str | None
    imdb_rating: Decimal | None
    kinopoisk_rating: Decimal | None
    tmdb_rating: Decimal | None


class MovieDetailResponse(MovieListResponse):
    description: str | None
    duration_minutes: int | None
    age_rating: str | None
    country: str | None
    trailer_url: str | None
    imdb_id: str | None
    kp_id: str | None
    tmdb_id: str | None
    categories: list[CategoryResponse]
    persons: list[PersonInMovieResponse]


class MoviePersonCreate(BaseModel):
    person_id: int
    role_type: RoleType
    character_name: str | None = None


class MovieCreate(BaseModel):
    title_ru: str | None = None
    title_original: str | None = None
    media_type: MediaType
    user_query: str | None = None


class MovieUpdate(BaseModel):
    user_query: str | None = None
    processing_status: ProcessingStatus | None = None
    title_original: str | None = None
    title_ru: str | None = None
    description: str | None = None
    year: int | None = None
    duration_minutes: int | None = None
    age_rating: str | None = None
    imdb_rating: Decimal | None = None
    kinopoisk_rating: Decimal | None = None
    tmdb_rating: Decimal | None = None
    country: str | None = None
    poster_url: str | None = None
    trailer_url: str | None = None
    imdb_id: str | None = None
    kp_id: str | None = None
    tmdb_id: str | None = None
    media_type: MediaType | None = None


class PersonCreate(BaseModel):
    name: str
    original_name: str | None = None
    photo_url: str | None = None
    birth_date: date | None = None
    country: str | None = None


class PersonUpdate(BaseModel):
    name: str | None = None
    original_name: str | None = None
    photo_url: str | None = None
    birth_date: date | None = None
    country: str | None = None


class UserMovieCreate(BaseModel):
    movie_id: int
    status: WatchStatus = WatchStatus.WANT


class UserMovieUpdate(BaseModel):
    status: WatchStatus
    rating: int | None
    note: str | None
    is_favorite: bool
    rewatch_count: int
    watched_at: datetime | None


class UserMovieBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    status: WatchStatus
    rating: int | None
    is_favorite: bool
    added_at: datetime


class UserMovieListResponse(UserMovieBase):
    movie: MovieListResponse


class UserMovieDetailResponse(UserMovieBase):
    note: str | None
    rewatch_count: int
    watched_at: datetime | None
    updated_at: datetime
    movie: MovieDetailResponse

from datetime import date, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import (
    CheckConstraint,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Numeric,
    SmallInteger,
    String,
    Table,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.infrastructure.database.base import Base, BaseModel
from app.infrastructure.database.mixins.id import IdMixin


class MediaType(StrEnum):
    FILM = 'film'
    SERIES = 'series'


class RoleType(StrEnum):
    ACTOR = 'actor'
    DIRECTOR = 'director'
    WRITER = 'writer'


class WatchStatus(StrEnum):
    WANT = 'want'
    WATCHING = 'watching'
    WATCHED = 'watched'
    DROPPED = 'dropped'


movie_category = Table(
    'movie_category',
    Base.metadata,
    Column('movie_id', ForeignKey('movie.id', ondelete='CASCADE'), primary_key=True),  # type: ignore
    Column('category_id', ForeignKey('category.id', ondelete='CASCADE'), primary_key=True),  # type: ignore
)


class Movie(BaseModel):
    title_original: Mapped[str | None] = mapped_column(String(512), nullable=True)
    title_ru: Mapped[str | None] = mapped_column(String(512), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    year: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    duration_minutes: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    age_rating: Mapped[str | None] = mapped_column(String(16), nullable=True)
    imdb_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    kinopoisk_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    tmdb_rating: Mapped[Decimal | None] = mapped_column(Numeric(3, 1), nullable=True)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)
    poster_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    trailer_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    imdb_id: Mapped[str | None] = mapped_column(String(16), unique=True, nullable=True)
    kp_id: Mapped[str | None] = mapped_column(String(16), unique=True, nullable=True)
    tmdb_id: Mapped[str | None] = mapped_column(String(16), unique=True, nullable=True)
    media_type: Mapped[MediaType] = mapped_column(
        Enum(MediaType, name='mediatype'), nullable=False, default=MediaType.FILM
    )

    __table_args__ = (
        CheckConstraint(
            'title_original IS NOT NULL OR title_ru IS NOT NULL',
            name='title_required',
        ),
    )

    categories: Mapped[list['Category']] = relationship(
        secondary=movie_category, back_populates='movies'
    )
    persons: Mapped[list['MoviePerson']] = relationship(back_populates='movie')
    user_movies: Mapped[list['UserMovie']] = relationship(back_populates='movie')


class Category(BaseModel):
    name: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)
    slug: Mapped[str] = mapped_column(String(128), nullable=False, unique=True)

    movies: Mapped[list['Movie']] = relationship(
        secondary=movie_category, back_populates='categories'
    )


class Person(BaseModel):
    name: Mapped[str] = mapped_column(String(256), nullable=False)
    original_name: Mapped[str | None] = mapped_column(String(256), nullable=True)
    photo_url: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    country: Mapped[str | None] = mapped_column(String(128), nullable=True)

    movie_roles: Mapped[list['MoviePerson']] = relationship(back_populates='person')


class MoviePerson(Base):
    movie_id: Mapped[int] = mapped_column(
        ForeignKey('movie.id', ondelete='CASCADE'), primary_key=True
    )
    person_id: Mapped[int] = mapped_column(
        ForeignKey('person.id', ondelete='CASCADE'), primary_key=True
    )
    role_type: Mapped[RoleType] = mapped_column(Enum(RoleType, name='roletype'), primary_key=True)
    character_name: Mapped[str | None] = mapped_column(String(256), nullable=True)

    movie: Mapped['Movie'] = relationship(back_populates='persons')
    person: Mapped['Person'] = relationship(back_populates='movie_roles')


class UserMovie(Base, IdMixin):
    user_id: Mapped[int] = mapped_column(ForeignKey('user.id', ondelete='CASCADE'), nullable=False)
    movie_id: Mapped[int] = mapped_column(
        ForeignKey('movie.id', ondelete='CASCADE'), nullable=False
    )
    status: Mapped[WatchStatus] = mapped_column(
        Enum(WatchStatus, name='watchstatus'), nullable=False, default=WatchStatus.WANT
    )
    rating: Mapped[int | None] = mapped_column(SmallInteger, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_favorite: Mapped[bool] = mapped_column(nullable=False, default=False)
    rewatch_count: Mapped[int] = mapped_column(SmallInteger, nullable=False, default=0)
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    watched_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    __table_args__ = (
        UniqueConstraint('user_id', 'movie_id'),
        CheckConstraint('rating >= 1 AND rating <= 10', name='rating_range'),
    )

    movie: Mapped['Movie'] = relationship(back_populates='user_movies')

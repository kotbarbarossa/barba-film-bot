from dataclasses import dataclass, field

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.infrastructure.database.repositories.base_repository import BaseRepository
from app.movie.models import (
    Category,
    MediaType,
    Movie,
    MoviePerson,
    Person,
    ProcessingStatus,
    RoleType,
    UserMovie,
    WatchStatus,
    movie_category,
)


@dataclass
class MovieFilter:
    media_type: MediaType | None = None
    year_from: int | None = None
    year_to: int | None = None
    category_id: int | None = None
    search: str | None = None  # exact case-insensitive по title_original, title_ru
    processing_status: ProcessingStatus | None = None


_ACTIVE_STATUSES = (WatchStatus.WANT, WatchStatus.WATCHING)


@dataclass
class UserMovieFilter:
    user_id: int
    status: WatchStatus | None = None
    statuses: list[WatchStatus] | None = field(default=None)
    is_favorite: bool | None = None
    search: str | None = None  # exact case-insensitive по title_original, title_ru
    year_from: int | None = None
    year_to: int | None = None
    category_id: int | None = None
    processing_status: ProcessingStatus | None = None


class MovieRepository(BaseRepository[Movie]):
    model = Movie

    async def get_filtered(self, filters: MovieFilter) -> list[Movie]:
        stmt = select(Movie)
        if filters.media_type is not None:
            stmt = stmt.where(Movie.media_type == filters.media_type)
        if filters.year_from is not None:
            stmt = stmt.where(Movie.year >= filters.year_from)
        if filters.year_to is not None:
            stmt = stmt.where(Movie.year <= filters.year_to)
        if filters.category_id is not None:
            stmt = stmt.join(Movie.categories).where(Category.id == filters.category_id)
        if filters.search is not None:
            term = filters.search.lower()
            stmt = stmt.where(
                or_(
                    func.lower(Movie.title_original) == term,
                    func.lower(Movie.title_ru) == term,
                )
            )
        if filters.processing_status is not None:
            stmt = stmt.where(Movie.processing_status == filters.processing_status)
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_detail(self, id_: int) -> Movie | None:
        stmt = (
            select(Movie)
            .where(Movie.id == id_)
            .options(
                selectinload(Movie.categories),
                selectinload(Movie.persons).selectinload(MoviePerson.person),
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        user_query: str | None = None,
        title_ru: str | None = None,
        title_original: str | None = None,
        media_type: MediaType | None = None,
    ) -> Movie:
        movie = Movie(
            user_query=user_query,
            title_ru=title_ru,
            title_original=title_original,
            media_type=media_type,
        )
        return await self.add(movie)


@dataclass
class CategoryFilter:
    search: str | None = None  # ILIKE по name


class CategoryRepository(BaseRepository[Category]):
    model = Category

    async def get_filtered(self, filters: CategoryFilter) -> list[Category]:
        stmt = select(Category)
        if filters.search is not None:
            stmt = stmt.where(Category.name.ilike(f'%{filters.search}%'))
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_by_name(self, name: str) -> Category | None:
        result = await self.session.execute(
            select(Category).where(func.lower(Category.name) == name.lower())
        )
        return result.scalar_one_or_none()

    async def create(self, *, name: str, name_original: str | None = None) -> Category:
        category = Category(name=name, name_original=name_original)
        return await self.add(category)

    async def get_many(self, ids: list[int]) -> list[Category]:
        result = await self.session.execute(select(Category).where(Category.id.in_(ids)))
        return list(result.scalars().all())

    async def get_by_user_active(self, user_id: int) -> list[Category]:
        """Categories from user's PROCESSED movies with status WANT or WATCHING."""
        stmt = (
            select(Category)
            .join(movie_category, Category.id == movie_category.c.category_id)
            .join(Movie, Movie.id == movie_category.c.movie_id)
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.user_id == user_id,
                UserMovie.status.in_(_ACTIVE_STATUSES),
                Movie.processing_status == ProcessingStatus.PROCESSED,
            )
            .distinct()
            .order_by(Category.name)
        )
        return list((await self.session.execute(stmt)).scalars().all())


@dataclass
class PersonFilter:
    name: str | None = None  # ILIKE по name и original_name


class PersonRepository(BaseRepository[Person]):
    model = Person

    async def get_by_name(self, name: str) -> Person | None:
        result = await self.session.execute(
            select(Person).where(
                or_(
                    func.lower(Person.name) == name.lower(),
                    func.lower(Person.original_name) == name.lower(),
                )
            )
        )
        return result.scalar_one_or_none()

    async def create(self, *, name: str, **kwargs: object) -> Person:
        person = Person(name=name, **kwargs)
        return await self.add(person)

    async def get_filtered(self, filters: PersonFilter) -> list[Person]:
        stmt = select(Person)
        if filters.name is not None:
            pattern = f'%{filters.name}%'
            stmt = stmt.where(
                or_(
                    Person.name.ilike(pattern),
                    Person.original_name.ilike(pattern),
                )
            )
        return list((await self.session.execute(stmt)).scalars().all())


class MoviePersonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, movie_id: int, person_id: int, role_type: RoleType) -> MoviePerson | None:
        result = await self.session.execute(
            select(MoviePerson).where(
                MoviePerson.movie_id == movie_id,
                MoviePerson.person_id == person_id,
                MoviePerson.role_type == role_type,
            )
        )
        return result.scalar_one_or_none()

    async def get_with_person(
        self, movie_id: int, person_id: int, role_type: RoleType
    ) -> MoviePerson | None:
        result = await self.session.execute(
            select(MoviePerson)
            .where(
                MoviePerson.movie_id == movie_id,
                MoviePerson.person_id == person_id,
                MoviePerson.role_type == role_type,
            )
            .options(selectinload(MoviePerson.person))
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        *,
        movie_id: int,
        person_id: int,
        role_type: RoleType,
        character_name: str | None = None,
    ) -> MoviePerson:
        entry = MoviePerson(
            movie_id=movie_id,
            person_id=person_id,
            role_type=role_type,
            character_name=character_name,
        )
        self.session.add(entry)
        await self.session.flush()
        return await self.get_with_person(movie_id, person_id, role_type)  # type: ignore[return-value]

    async def delete(self, entry: MoviePerson) -> None:
        await self.session.delete(entry)
        await self.session.flush()


class UserMovieRepository(BaseRepository[UserMovie]):  # type: ignore[type-var]
    model = UserMovie

    async def get_all_by_movie(self, movie_id: int) -> list[UserMovie]:
        result = await self.session.execute(
            select(UserMovie).where(UserMovie.movie_id == movie_id)
        )
        return list(result.scalars().all())

    async def get_by_user_and_movie(self, user_id: int, movie_id: int) -> UserMovie | None:
        result = await self.session.execute(
            select(UserMovie).where(
                UserMovie.user_id == user_id,
                UserMovie.movie_id == movie_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_filtered(self, filters: UserMovieFilter) -> list[UserMovie]:
        stmt = (
            select(UserMovie)
            .join(Movie, UserMovie.movie_id == Movie.id)
            .where(UserMovie.user_id == filters.user_id)
            .options(selectinload(UserMovie.movie))
            .order_by(Movie.imdb_rating.desc().nullslast())
        )
        if filters.status is not None:
            stmt = stmt.where(UserMovie.status == filters.status)
        if filters.statuses is not None:
            stmt = stmt.where(UserMovie.status.in_(filters.statuses))
        if filters.processing_status is not None:
            stmt = stmt.where(Movie.processing_status == filters.processing_status)
        if filters.is_favorite is not None:
            stmt = stmt.where(UserMovie.is_favorite == filters.is_favorite)
        if filters.search is not None:
            term = filters.search.lower()
            stmt = stmt.where(
                or_(
                    func.lower(Movie.title_original) == term,
                    func.lower(Movie.title_ru) == term,
                )
            )
        if filters.year_from is not None:
            stmt = stmt.where(Movie.year >= filters.year_from)
        if filters.year_to is not None:
            stmt = stmt.where(Movie.year <= filters.year_to)
        if filters.category_id is not None:
            stmt = stmt.where(
                UserMovie.movie_id.in_(
                    select(Movie.id)
                    .join(Movie.categories)
                    .where(Category.id == filters.category_id)
                )
            )
        return list((await self.session.execute(stmt)).scalars().all())

    async def get_random_active_processed(self, user_id: int) -> UserMovie | None:
        stmt = (
            select(UserMovie)
            .join(Movie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.user_id == user_id,
                UserMovie.status.in_(_ACTIVE_STATUSES),
                Movie.processing_status == ProcessingStatus.PROCESSED,
            )
            .order_by(func.random())
            .limit(1)
            .options(
                selectinload(UserMovie.movie).options(
                    selectinload(Movie.categories),
                    selectinload(Movie.persons).selectinload(MoviePerson.person),
                )
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_recently_watched(self, user_id: int, limit: int = 10) -> list[UserMovie]:
        stmt = (
            select(UserMovie)
            .join(Movie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.user_id == user_id,
                UserMovie.status == WatchStatus.WATCHED,
                Movie.processing_status == ProcessingStatus.PROCESSED,
            )
            .order_by(UserMovie.watched_at.desc().nullslast())
            .limit(limit)
            .options(selectinload(UserMovie.movie))
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def get_active_decades(self, user_id: int) -> list[int]:
        """
        Returns sorted list of decade start years (e.g. 1990, 2000)
        from user's active processed movies.
        """
        decade = (func.floor(Movie.year / 10) * 10).label('decade')
        stmt = (
            select(decade)
            .join(UserMovie, UserMovie.movie_id == Movie.id)
            .where(
                UserMovie.user_id == user_id,
                UserMovie.status.in_(_ACTIVE_STATUSES),
                Movie.processing_status == ProcessingStatus.PROCESSED,
                Movie.year.is_not(None),
            )
            .distinct()
            .order_by('decade')
        )
        result = await self.session.execute(stmt)
        return [int(row[0]) for row in result.all()]

    async def get_detail(self, user_id: int, movie_id: int) -> UserMovie | None:
        stmt = (
            select(UserMovie)
            .where(UserMovie.user_id == user_id, UserMovie.movie_id == movie_id)
            .options(
                selectinload(UserMovie.movie).options(
                    selectinload(Movie.categories),
                    selectinload(Movie.persons).selectinload(MoviePerson.person),
                )
            )
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def create(
        self, *, user_id: int, movie_id: int, status: WatchStatus = WatchStatus.WANT
    ) -> UserMovie:
        entry = UserMovie(user_id=user_id, movie_id=movie_id, status=status)
        await self.add(entry)
        result = await self.session.execute(
            select(UserMovie)
            .where(UserMovie.user_id == user_id, UserMovie.movie_id == movie_id)
            .options(selectinload(UserMovie.movie))
        )
        return result.scalar_one()

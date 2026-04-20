import logging
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.clients.groq import MovieData, PersonData, fetch_movie_data, fetch_movie_data_enriched
from app.clients.tmdb import search_movie
from app.core.config import settings
from app.movie.models import Category, Movie, Person, ProcessingStatus
from app.movie.repository import (
    CategoryRepository,
    MovieFilter,
    MoviePersonRepository,
    MovieRepository,
    PersonRepository,
    UserMovieRepository,
)

logger = logging.getLogger(__name__)


class ProcessMovieUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session
        self.movie_repo = MovieRepository(session)
        self.category_repo = CategoryRepository(session)
        self.person_repo = PersonRepository(session)
        self.movie_person_repo = MoviePersonRepository(session)
        self.user_movie_repo = UserMovieRepository(session)

    async def execute(self, movie_id: int) -> None:
        movie = await self.movie_repo.get(movie_id)
        if movie is None or movie.processing_status != ProcessingStatus.PENDING:
            logger.warning(
                'process_movie: movie %d skipped (not found or status=%r)',
                movie_id,
                getattr(movie, 'processing_status', None),
            )
            return

        if movie.media_type is None:
            logger.warning('process_movie: movie %d has no media_type, skipping', movie_id)
            return

        data = await self._fetch_movie_data(movie)

        if data is None:
            await self.movie_repo.update(
                movie, {'processing_status': ProcessingStatus.UNRECOGNIZED}
            )
            logger.info('Movie %d marked as UNRECOGNIZED', movie_id)
            return

        existing = await self._find_existing(data)
        if existing is not None:
            await self._reroute_to_existing(movie, existing)
            logger.info('Movie %d rerouted to existing movie %d', movie_id, existing.id)
        else:
            await self._fill_movie(movie, data)
            logger.info('Movie %d processed successfully', movie_id)

    async def _fetch_movie_data(self, movie: Movie) -> MovieData | None:
        """
        Try TMDB search first. If found — enrich via Groq (ratings, genres, persons).
        If not found — fall back to Groq full flow + TMDB for poster.
        """
        query = movie.title_ru or movie.title_original or ''

        tmdb = await search_movie(
            query=query,
            media_type=movie.media_type,  # type: ignore[arg-type]
            api_key=settings.tmdb_api_key,
        )

        if tmdb is not None and tmdb.title_original:
            logger.info('Movie %d found in TMDB: %r', movie.id, tmdb.title_original)
            data = await fetch_movie_data_enriched(
                title_original=tmdb.title_original,
                title_ru=tmdb.title_ru,
                year=tmdb.year,
                overview=tmdb.overview,
                media_type=movie.media_type,  # type: ignore[arg-type]
                api_key=settings.groq_api_key,
            )
            if data is not None:
                data.poster_url = tmdb.poster_url
                data.tmdb_id = tmdb.tmdb_id
                data.tmdb_rating = tmdb.tmdb_rating
                return data
            # Groq enrich failed — fall through to full Groq flow
            logger.warning('Movie %d: Groq enrich failed, falling back to full flow', movie.id)

        # Full Groq flow
        data = await fetch_movie_data(
            title=query,
            media_type=movie.media_type,  # type: ignore[arg-type]
            user_query=movie.user_query,
            api_key=settings.groq_api_key,
        )
        if data is None:
            return None

        # Get poster from TMDB: reuse existing result or search by Groq's title_original
        tmdb_for_poster = tmdb or (
            await search_movie(
                query=data.title_original,
                media_type=data.media_type,
                api_key=settings.tmdb_api_key,
            )
            if data.title_original
            else None
        )
        if tmdb_for_poster is not None:
            data.poster_url = tmdb_for_poster.poster_url
            data.tmdb_id = tmdb_for_poster.tmdb_id
            if data.tmdb_rating is None:
                data.tmdb_rating = tmdb_for_poster.tmdb_rating

        return data

    async def _find_existing(self, data: MovieData) -> Movie | None:
        for title in filter(None, [data.title_original, data.title_ru]):
            results = await self.movie_repo.get_filtered(
                MovieFilter(search=title, processing_status=ProcessingStatus.PROCESSED)
            )
            if results:
                return results[0]
        return None

    async def _reroute_to_existing(self, pending: Movie, existing: Movie) -> None:
        user_movies = await self.user_movie_repo.get_all_by_movie(pending.id)
        for um in user_movies:
            already_has = await self.user_movie_repo.get_by_user_and_movie(um.user_id, existing.id)
            if already_has is not None:
                await self.user_movie_repo.delete(um)
            else:
                await self.user_movie_repo.update(um, {'movie_id': existing.id})
        await self.movie_repo.delete(pending)

    async def _fill_movie(self, movie: Movie, data: MovieData) -> None:
        categories = await self._get_or_create_categories(data)
        persons_with_roles = await self._get_or_create_persons(data)

        await self.movie_repo.update(
            movie,
            {
                'title_original': data.title_original,
                'title_ru': data.title_ru,
                'description': data.description,
                'year': data.year,
                'duration_minutes': data.duration_minutes,
                'age_rating': data.age_rating,
                'imdb_rating': Decimal(str(data.imdb_rating))
                if data.imdb_rating is not None
                else None,
                'kinopoisk_rating': Decimal(str(data.kinopoisk_rating))
                if data.kinopoisk_rating is not None
                else None,
                'tmdb_rating': Decimal(str(data.tmdb_rating))
                if data.tmdb_rating is not None
                else None,
                'country': data.country,
                'poster_url': data.poster_url,
                'trailer_url': data.trailer_url,
                'tmdb_id': data.tmdb_id,
                'media_type': data.media_type,
                'processing_status': ProcessingStatus.PROCESSED,
            },
        )

        await self.session.refresh(movie, attribute_names=['categories'])
        movie.categories = categories
        await self.session.flush()

        for person, person_data in persons_with_roles:
            existing_mp = await self.movie_person_repo.get(movie.id, person.id, person_data.role)
            if existing_mp is None:
                await self.movie_person_repo.create(
                    movie_id=movie.id,
                    person_id=person.id,
                    role_type=person_data.role,
                    character_name=person_data.character_name,
                )

    async def _get_or_create_categories(self, data: MovieData) -> list[Category]:
        result: list[Category] = []
        for cat_data in data.categories:
            category = await self.category_repo.get_by_name(cat_data.name)
            if category is None:
                category = await self.category_repo.create(
                    name=cat_data.name,
                    name_original=cat_data.name_original,
                )
            result.append(category)
        return result

    async def _get_or_create_persons(self, data: MovieData) -> list[tuple[Person, PersonData]]:
        result: list[tuple[Person, PersonData]] = []
        for person_data in data.persons:
            person = await self.person_repo.get_by_name(person_data.name)
            if person is None:
                person = await self.person_repo.create(
                    name=person_data.name,
                    original_name=person_data.original_name,
                    birth_date=person_data.birth_date,
                    country=person_data.country,
                )
            result.append((person, person_data))
        return result

import logging
from dataclasses import dataclass
from typing import Any

import httpx

from app.movie.models import MediaType

logger = logging.getLogger(__name__)

_TMDB_API_URL = 'https://api.themoviedb.org/3'
_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500'


@dataclass
class TmdbMovieInfo:
    title_ru: str | None
    title_original: str | None
    overview: str | None
    year: int | None
    poster_url: str | None
    tmdb_id: str | None
    tmdb_rating: float | None


def _result_year(result: dict[str, Any], media_type: MediaType) -> int | None:
    raw: str = (
        result.get('first_air_date') or ''
        if media_type == MediaType.SERIES
        else result.get('release_date') or ''
    )
    return int(raw[:4]) if raw else None


async def search_movie(
    *,
    query: str,
    media_type: MediaType,
    api_key: str,
    year: int | None = None,
) -> TmdbMovieInfo | None:
    """Search TMDB with ru-RU locale. If year given, filters results to year ±1."""
    endpoint = 'tv' if media_type == MediaType.SERIES else 'movie'
    params: dict[str, str] = {
        'api_key': api_key,
        'query': query,
        'language': 'ru-RU',
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f'{_TMDB_API_URL}/search/{endpoint}', params=params)
            response.raise_for_status()

        results = response.json().get('results', [])
        if not results:
            return None

        if year is not None:
            year_range = range(year - 1, year + 2)
            results = [r for r in results if _result_year(r, media_type) in year_range]
            if not results:
                return None

        first = results[0]

        if media_type == MediaType.SERIES:
            title_ru = first.get('name') or None
            title_original = first.get('original_name') or None
        else:
            title_ru = first.get('title') or None
            title_original = first.get('original_title') or None

        poster_path: str | None = first.get('poster_path')
        vote_average: float | None = first.get('vote_average')

        return TmdbMovieInfo(
            title_ru=title_ru,
            title_original=title_original,
            overview=first.get('overview') or None,
            year=_result_year(first, media_type),
            poster_url=f'{_POSTER_BASE_URL}{poster_path}' if poster_path else None,
            tmdb_id=str(first['id']) if first.get('id') else None,
            tmdb_rating=float(vote_average) if vote_average else None,
        )

    except httpx.HTTPError as e:
        logger.error('search_movie: HTTP error for %r: %s', query, e)
        return None


async def fetch_movie_by_id(
    *,
    tmdb_id: str,
    media_type: MediaType,
    api_key: str,
    language: str = 'en-US',
) -> TmdbMovieInfo | None:
    """Fetch overview and poster by TMDB ID. Default locale is en-US."""
    endpoint = 'tv' if media_type == MediaType.SERIES else 'movie'
    params = {'api_key': api_key, 'language': language}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f'{_TMDB_API_URL}/{endpoint}/{tmdb_id}', params=params
            )
            response.raise_for_status()

        data = response.json()
        poster_path: str | None = data.get('poster_path')
        return TmdbMovieInfo(
            title_ru=None,
            title_original=None,
            overview=data.get('overview') or None,
            year=None,
            poster_url=f'{_POSTER_BASE_URL}{poster_path}' if poster_path else None,
            tmdb_id=tmdb_id,
            tmdb_rating=None,
        )

    except httpx.HTTPError as e:
        logger.error('fetch_movie_by_id: HTTP error for tmdb_id=%r: %s', tmdb_id, e)
        return None

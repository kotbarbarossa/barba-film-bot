import logging
from dataclasses import dataclass

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


async def search_movie(
    *,
    query: str,
    media_type: MediaType,
    api_key: str,
) -> TmdbMovieInfo | None:
    """Search TMDB with ru-RU locale. Returns None if not found or on error."""
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
        first = results[0]

        if media_type == MediaType.SERIES:
            title_ru = first.get('name') or None
            title_original = first.get('original_name') or None
            raw_date: str = first.get('first_air_date') or ''
        else:
            title_ru = first.get('title') or None
            title_original = first.get('original_title') or None
            raw_date = first.get('release_date') or ''

        poster_path: str | None = first.get('poster_path')
        vote_average: float | None = first.get('vote_average')

        return TmdbMovieInfo(
            title_ru=title_ru,
            title_original=title_original,
            overview=first.get('overview') or None,
            year=int(raw_date[:4]) if raw_date else None,
            poster_url=f'{_POSTER_BASE_URL}{poster_path}' if poster_path else None,
            tmdb_id=str(first['id']) if first.get('id') else None,
            tmdb_rating=float(vote_average) if vote_average else None,
        )

    except httpx.HTTPError as e:
        logger.error('search_movie: HTTP error for %r: %s', query, e)
        return None

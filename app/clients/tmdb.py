import logging

import httpx

from app.movie.models import MediaType

logger = logging.getLogger(__name__)

_TMDB_API_URL = 'https://api.themoviedb.org/3'
_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500'


async def fetch_poster_url(
    *,
    title_original: str,
    media_type: MediaType,
    year: int | None,
    api_key: str,
) -> str | None:
    endpoint = 'tv' if media_type == MediaType.SERIES else 'movie'
    params: dict[str, str | int] = {'api_key': api_key, 'query': title_original}
    if year:
        params['year'] = year

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f'{_TMDB_API_URL}/search/{endpoint}', params=params)
            response.raise_for_status()

        results = response.json().get('results', [])
        if not results:
            return None
        poster_path = results[0].get('poster_path')
        return f'{_POSTER_BASE_URL}{poster_path}' if poster_path else None

    except httpx.HTTPError as e:
        logger.error('fetch_poster_url: HTTP error for %r: %s', title_original, e)
        return None

import json
import logging
from datetime import date
from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from app.movie.models import MediaType, RoleType

logger = logging.getLogger(__name__)


class GroqRateLimitError(Exception):
    pass


_GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
_MODEL = 'llama-3.3-70b-versatile'

_SYSTEM_PROMPT = """\
You are a movie database assistant. Given a movie title and type, return structured JSON data.

If the movie/series is found, return:
{
  "found": true,
  "movie": {
    "title_original": "original title (English or native language) or null",
    "title_ru": "official Russian title as listed on Кинопоиск",
    "description": "brief description in Russian, 2-3 sentences, or null",
    "description_original": "brief description in English, 2-3 sentences, or null",
    "year": release year as integer or null,
    "duration_minutes": duration as integer or null,
    "age_rating": "e.g. 16+, R, PG-13, or null",
    "imdb_rating": float 0.0-10.0 or null,
    "kinopoisk_rating": float 0.0-10.0 or null,
    "tmdb_rating": float 0.0-10.0 or null,
    "country": "country of origin in Russian or null",
    "media_type": "film" or "series",
    "categories": [
      {"name": "genre in Russian", "name_original": "genre in English or null"}
    ],
    "persons": [
      {
        "name": "name in Russian or transliteration",
        "original_name": "original name or null",
        "birth_date": "YYYY-MM-DD or null",
        "country": "country in Russian or null",
        "role": "actor" or "director" or "writer",
        "character_name": "character name or null"
      }
    ]
  }
}

If the movie is not found or you are not confident, return:
{"found": false, "movie": null}

Rules:
- Always return valid JSON, nothing else
- Include up to 5 main actors, all directors, all main writers
- Include 3-7 genres
- description must be in Russian
- country fields must be in Russian (e.g. "США", "Великобритания", "Франция")
"""

_SYSTEM_PROMPT_ENRICH = """\
You are a movie database assistant. A film has been identified — provide the missing data.

Return JSON:
{
  "found": true,
  "movie": {
    "duration_minutes": duration as integer or null,
    "age_rating": "e.g. 16+, R, PG-13, or null",
    "imdb_rating": float 0.0-10.0 or null,
    "kinopoisk_rating": float 0.0-10.0 or null,
    "description_original": "brief description in English, 2-3 sentences, or null",
    "country": "country of origin in Russian or null",
    "categories": [
      {"name": "genre in Russian", "name_original": "genre in English or null"}
    ],
    "persons": [
      {
        "name": "name in Russian or transliteration",
        "original_name": "original name or null",
        "birth_date": "YYYY-MM-DD or null",
        "country": "country in Russian or null",
        "role": "actor" or "director" or "writer",
        "character_name": "character name or null"
      }
    ]
  }
}

If you are not confident about this film, return:
{"found": false, "movie": null}

Rules:
- Always return valid JSON, nothing else
- Include up to 5 main actors, all directors, all main writers
- Include 3-7 genres
- country fields must be in Russian (e.g. "США", "Великобритания", "Франция")
"""


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


class MovieData(BaseModel):
    title_original: str | None = None
    title_ru: str | None = None
    description: str | None = None
    description_original: str | None = None
    year: int | None = None
    duration_minutes: int | None = None
    age_rating: str | None = None
    imdb_rating: float | None = None
    kinopoisk_rating: float | None = None
    tmdb_rating: float | None = None
    country: str | None = None
    poster_url: str | None = None
    poster_url_original: str | None = None
    trailer_url: str | None = None
    tmdb_id: str | None = None
    media_type: MediaType
    categories: list[CategoryData]
    persons: list[PersonData]


class _GroqResponse(BaseModel):
    found: bool
    movie: MovieData | None = None


class _EnrichData(BaseModel):
    duration_minutes: int | None = None
    age_rating: str | None = None
    description_original: str | None = None
    imdb_rating: float | None = None
    kinopoisk_rating: float | None = None
    country: str | None = None
    categories: list[CategoryData]
    persons: list[PersonData]


class _EnrichResponse(BaseModel):
    found: bool
    movie: _EnrichData | None = None


async def _post(payload: dict[str, Any], api_key: str) -> str:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(
            _GROQ_API_URL,
            headers={'Authorization': f'Bearer {api_key}'},
            json=payload,
        )
        if response.status_code == 429:
            raise GroqRateLimitError()
        response.raise_for_status()
    return response.json()['choices'][0]['message']['content']  # type: ignore[no-any-return]


async def fetch_movie_data(
    *,
    title: str,
    media_type: MediaType,
    user_query: str | None,
    api_key: str,
    year: int | None = None,
) -> MovieData | None:
    user_message = f'Movie: "{title}" (type: {media_type.value})'
    if year:
        user_message += f', year: {year}'
    if user_query:
        user_message += f'\nAdditional context: {user_query}'

    payload: dict[str, Any] = {
        'model': _MODEL,
        'messages': [
            {'role': 'system', 'content': _SYSTEM_PROMPT},
            {'role': 'user', 'content': user_message},
        ],
        'response_format': {'type': 'json_object'},
        'temperature': 0.1,
    }

    try:
        raw = await _post(payload, api_key)
        data = _GroqResponse.model_validate(json.loads(raw))
        if not data.found:
            return None
        return data.movie

    except (ValidationError, KeyError, json.JSONDecodeError) as e:
        logger.error('fetch_movie_data: invalid response for %r: %s', title, e)
        return None
    except httpx.HTTPError as e:
        logger.error('fetch_movie_data: HTTP error for %r: %s', title, e)
        return None


async def fetch_movie_data_enriched(
    *,
    title_original: str,
    title_ru: str | None,
    year: int | None,
    overview: str | None,
    media_type: MediaType,
    api_key: str,
) -> MovieData | None:
    """Call Groq with already-known TMDB data to fill in ratings, genres, persons."""
    lines = [f'Movie: "{title_original}" ({media_type.value}']
    if year:
        lines[0] += f', {year}'
    lines[0] += ')'
    if title_ru:
        lines.append(f'Russian title: "{title_ru}"')
    if overview:
        lines.append(f'Overview: "{overview}"')
    user_message = '\n'.join(lines)

    payload: dict[str, Any] = {
        'model': _MODEL,
        'messages': [
            {'role': 'system', 'content': _SYSTEM_PROMPT_ENRICH},
            {'role': 'user', 'content': user_message},
        ],
        'response_format': {'type': 'json_object'},
        'temperature': 0.1,
    }

    try:
        raw = await _post(payload, api_key)
        data = _EnrichResponse.model_validate(json.loads(raw))
        if not data.found or data.movie is None:
            return None

        enrich = data.movie
        return MovieData(
            title_original=title_original,
            title_ru=title_ru,
            description=overview,
            description_original=enrich.description_original,
            year=year,
            duration_minutes=enrich.duration_minutes,
            age_rating=enrich.age_rating,
            imdb_rating=enrich.imdb_rating,
            kinopoisk_rating=enrich.kinopoisk_rating,
            country=enrich.country,
            media_type=media_type,
            categories=enrich.categories,
            persons=enrich.persons,
        )

    except (ValidationError, KeyError, json.JSONDecodeError) as e:
        logger.error('fetch_movie_data_enriched: invalid response for %r: %s', title_original, e)
        return None
    except httpx.HTTPError as e:
        logger.error('fetch_movie_data_enriched: HTTP error for %r: %s', title_original, e)
        return None

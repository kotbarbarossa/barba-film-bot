import json
import logging
from datetime import date
from typing import Any

import httpx
from pydantic import BaseModel, ValidationError

from app.movie.models import MediaType, RoleType

logger = logging.getLogger(__name__)

_GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'
_MODEL = 'llama-3.3-70b-versatile'

_SYSTEM_PROMPT = """\
You are a movie database assistant. Given a movie title and type, return structured JSON data.

If the movie/series is found, return:
{
  "found": true,
  "movie": {
    "title_original": "original title (English or native language) or null",
    "title_ru": "Russian title or null",
    "description": "brief description in Russian, 2-3 sentences, or null",
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


class CategoryData(BaseModel):
    name: str
    name_original: str | None = None


class PersonData(BaseModel):
    name: str
    original_name: str | None = None
    birth_date: date | None = None
    country: str | None = None
    role: RoleType
    character_name: str | None = None


class MovieData(BaseModel):
    title_original: str | None = None
    title_ru: str | None = None
    description: str | None = None
    year: int | None = None
    duration_minutes: int | None = None
    age_rating: str | None = None
    imdb_rating: float | None = None
    kinopoisk_rating: float | None = None
    tmdb_rating: float | None = None
    country: str | None = None
    poster_url: str | None = None
    trailer_url: str | None = None
    tmdb_id: str | None = None
    media_type: MediaType
    categories: list[CategoryData]
    persons: list[PersonData]


class _GroqResponse(BaseModel):
    found: bool
    movie: MovieData | None = None


async def fetch_movie_data(
    *,
    title: str,
    media_type: MediaType,
    user_query: str | None,
    api_key: str,
) -> MovieData | None:
    user_message = f'Movie: "{title}" (type: {media_type.value})'
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
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                _GROQ_API_URL,
                headers={'Authorization': f'Bearer {api_key}'},
                json=payload,
            )
            response.raise_for_status()

        raw = response.json()['choices'][0]['message']['content']
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

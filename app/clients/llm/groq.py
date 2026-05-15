import json
import logging
import time
from typing import Any

import httpx
from pydantic import ValidationError

from app.clients.llm.base import LLMRateLimitError
from app.clients.llm.observability import get_langfuse
from app.clients.llm.prompts import (
    MOVIE_ENRICH_TASK,
    MOVIE_LOOKUP_TASK,
    EnrichResponse,
    LookupResponse,
    build_enrich_message,
    build_lookup_message,
)
from app.clients.llm.schemas import LLMMovieData
from app.movie.models import MediaType

logger = logging.getLogger(__name__)

_GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

# json_object mode requires the expected structure to be described in the prompt
_LOOKUP_SCHEMA_HINT = """\

Return JSON — if found:
{
  "found": true,
  "movie": {
    "title_original": "...", "title_ru": "...",
    "description": "in Russian", "description_original": "in English",
    "year": int or null, "duration_minutes": int or null,
    "age_rating": "16+" or null, "imdb_rating": float or null,
    "kinopoisk_rating": float or null, "country": "in Russian or null",
    "media_type": "film" or "series",
    "categories": [{"name": "in Russian", "name_original": "in English or null"}],
    "persons": [{"name": "in Russian", "original_name": null, "birth_date": "YYYY-MM-DD or null",
                 "country": "in Russian or null", "role": "actor|director|writer",
                 "character_name": null}]
  }
}
If not found: {"found": false, "movie": null}
Always return valid JSON only.
"""

_ENRICH_SCHEMA_HINT = """\

Return JSON — if confident:
{
  "found": true,
  "movie": {
    "duration_minutes": int or null, "age_rating": "16+" or null,
    "imdb_rating": float or null, "kinopoisk_rating": float or null,
    "description_original": "in English or null", "country": "in Russian or null",
    "categories": [{"name": "in Russian", "name_original": "in English or null"}],
    "persons": [{"name": "in Russian", "original_name": null, "birth_date": "YYYY-MM-DD or null",
                 "country": "in Russian or null", "role": "actor|director|writer",
                 "character_name": null}]
  }
}
If not confident: {"found": false, "movie": null}
Always return valid JSON only.
"""

_MOVIE_LOOKUP_SYSTEM = MOVIE_LOOKUP_TASK + _LOOKUP_SCHEMA_HINT
_MOVIE_ENRICH_SYSTEM = MOVIE_ENRICH_TASK + _ENRICH_SCHEMA_HINT


class GroqLLMClient:
    def __init__(self, api_key: str, model: str) -> None:
        self._api_key = api_key
        self._model = model

    async def _post(
        self, payload: dict[str, Any], operation: str, metadata: dict[str, Any] | None = None
    ) -> str:
        t0 = time.monotonic()
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                _GROQ_API_URL,
                headers={'Authorization': f'Bearer {self._api_key}'},
                json=payload,
            )
            if response.status_code == 429:
                raise LLMRateLimitError()
            response.raise_for_status()
        body = response.json()
        usage = body.get('usage', {})
        logger.info(
            'LLM %s (groq): %d prompt + %d completion tokens, %.1fs',
            operation,
            usage.get('prompt_tokens', 0),
            usage.get('completion_tokens', 0),
            time.monotonic() - t0,
        )
        content: str = body['choices'][0]['message']['content']
        lf = get_langfuse()
        if lf:
            try:
                lf.start_observation(
                    name=f'groq_{operation}',
                    as_type='generation',
                    model=self._model,
                    model_parameters={'temperature': 0.1, 'response_format': 'json_object'},
                    input=payload['messages'],
                    output=content,
                    usage_details={
                        'input': usage.get('prompt_tokens', 0),
                        'output': usage.get('completion_tokens', 0),
                    },
                    metadata=metadata or {},
                ).end()
            except Exception:
                logger.warning('Langfuse tracking failed for %r', operation, exc_info=True)
        return content

    async def fetch_movie_data(
        self,
        *,
        title: str,
        media_type: MediaType,
        user_query: str | None,
        year: int | None = None,
    ) -> LLMMovieData | None:
        payload: dict[str, Any] = {
            'model': self._model,
            'messages': [
                {'role': 'system', 'content': _MOVIE_LOOKUP_SYSTEM},
                {
                    'role': 'user',
                    'content': build_lookup_message(title, media_type, year, user_query),
                },
            ],
            'response_format': {'type': 'json_object'},
            'temperature': 0.1,
        }

        for attempt in range(2):
            try:
                raw = await self._post(
                    payload,
                    'movie_lookup',
                    metadata={'title': title, 'media_type': media_type.value},
                )
                data = LookupResponse.model_validate(json.loads(raw))
                return data.movie if data.found else None
            except (ValidationError, json.JSONDecodeError) as e:
                if attempt == 0:
                    logger.warning('fetch_movie_data: parse error for %r, retrying: %s', title, e)
                else:
                    logger.error('fetch_movie_data: parse error for %r, giving up: %s', title, e)
            except httpx.HTTPError as e:
                logger.error('fetch_movie_data: HTTP error for %r: %s', title, e)
                return None
        return None

    async def fetch_movie_data_enriched(
        self,
        *,
        title_original: str,
        title_ru: str | None,
        year: int | None,
        overview: str | None,
        media_type: MediaType,
    ) -> LLMMovieData | None:
        payload: dict[str, Any] = {
            'model': self._model,
            'messages': [
                {'role': 'system', 'content': _MOVIE_ENRICH_SYSTEM},
                {
                    'role': 'user',
                    'content': build_enrich_message(
                        title_original, title_ru, year, overview, media_type
                    ),
                },
            ],
            'response_format': {'type': 'json_object'},
            'temperature': 0.1,
        }

        for attempt in range(2):
            try:
                raw = await self._post(
                    payload,
                    'movie_enrich',
                    metadata={'title': title_original, 'media_type': media_type.value},
                )
                data = EnrichResponse.model_validate(json.loads(raw))
                return data.to_llm_movie_data(
                    title_original=title_original,
                    title_ru=title_ru,
                    overview=overview,
                    year=year,
                    media_type=media_type,
                )
            except (ValidationError, json.JSONDecodeError) as e:
                if attempt == 0:
                    logger.warning(
                        'fetch_movie_data_enriched: parse error for %r, retrying: %s',
                        title_original,
                        e,
                    )
                else:
                    logger.error(
                        'fetch_movie_data_enriched: parse error for %r, giving up: %s',
                        title_original,
                        e,
                    )
            except httpx.HTTPError as e:
                logger.error('fetch_movie_data_enriched: HTTP error for %r: %s', title_original, e)
                return None
        return None

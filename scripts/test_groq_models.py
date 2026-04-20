"""Compare Groq models and prompts for movie title recognition."""

import asyncio
import json
import os
from typing import Any

import httpx

_GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

# Models that support json_object response_format
_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'meta-llama/llama-4-scout-17b-16e-instruct',
    'qwen/qwen3-32b',
    'groq/compound-mini',
]

_JSON_SCHEMA = """\
If the movie/series is found, return:
{
  "found": true,
  "movie": {
    "title_original": "original title (English or native language) or null",
    "title_ru": "official Russian title as listed on Кинопоиск",
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
"""

_RULES_BASE = """\
Rules:
- Always return valid JSON, nothing else
- Include up to 5 main actors, all directors, all main writers
- Include 3-7 genres
- description must be in Russian
- country fields must be in Russian (e.g. "США", "Великобритания", "Франция")
"""

_RULES_STRICT = _RULES_BASE + """\
- The provided title may be misspelled, approximate, or an unofficial translation. \
Identify the correct film and always return the official titles, not the user's input.
- To find the official Russian title, use your knowledge of Russian Wikipedia and Кинопоиск. \
Never copy the user's input into "title_ru" — it may be wrong.
"""

_RULES_IDENTIFY = _RULES_STRICT + """\
- First identify which film the user is referring to (e.g. "Невероятный мистер лис" → \
"Fantastic Mr. Fox" by Wes Anderson, 2009), then look up its official Russian release title \
on Кинопоиск or Russian Wikipedia (ru.wikipedia.org). \
Only after identifying the film, fill in "title_ru" with the correct official name.
"""

_PROMPTS: dict[str, str] = {
    'base': (
        'You are a movie database assistant. '
        'Given a movie title and type, return structured JSON data.\n\n'
        + _JSON_SCHEMA + _RULES_BASE
    ),
    'strict': (
        'You are a movie database assistant. '
        'Given a movie title and type, return structured JSON data.\n\n'
        + _JSON_SCHEMA + _RULES_STRICT
    ),
    'identify': (
        'You are a movie database assistant. '
        'Given a movie title and type, return structured JSON data.\n\n'
        + _JSON_SCHEMA + _RULES_IDENTIFY
    ),
}

_TITLE = 'Невероятный мистер лис'
_MEDIA_TYPE = 'film'
_EXPECTED_RU = 'Бесподобный мистер Фокс'
_EXPECTED_ORIGINAL = 'Fantastic Mr. Fox'


async def query(
    client: httpx.AsyncClient,
    model: str,
    prompt: str,
    api_key: str,
) -> dict[str, Any]:
    payload: dict[str, Any] = {
        'model': model,
        'messages': [
            {'role': 'system', 'content': prompt},
            {'role': 'user', 'content': f'Movie: "{_TITLE}" (type: {_MEDIA_TYPE})'},
        ],
        'response_format': {'type': 'json_object'},
        'temperature': 0.1,
    }
    response = await client.post(
        _GROQ_API_URL,
        headers={'Authorization': f'Bearer {api_key}'},
        json=payload,
        timeout=30.0,
    )
    response.raise_for_status()
    return json.loads(response.json()['choices'][0]['message']['content'])  # type: ignore[no-any-return]


def fmt(data: dict[str, Any]) -> tuple[str, str]:
    movie: dict[str, Any] = data.get('movie') or {}
    ru: str = movie.get('title_ru') or '—'
    orig: str = movie.get('title_original') or '—'
    return ru, orig


async def test_model(client: httpx.AsyncClient, model: str, api_key: str) -> None:
    print(f'\n{"─" * 55}\n{model}')
    for label, prompt in _PROMPTS.items():
        try:
            data = await query(client, model, prompt, api_key)
            ru, orig = fmt(data)
            ru_ok = '✓' if ru == _EXPECTED_RU else '✗'
            orig_ok = '✓' if orig == _EXPECTED_ORIGINAL else '✗'
            print(f'  [{label:8}]  title_ru: {ru!r:38} {ru_ok}  original: {orig!r} {orig_ok}')
        except httpx.HTTPStatusError as e:
            print(f'  [{label:8}]  HTTP {e.response.status_code}: {e.response.text[:80]}')
        except Exception as e:
            print(f'  [{label:8}]  ERROR: {e}')


async def main() -> None:
    api_key = os.environ.get('GROQ_API_KEY', '')
    if not api_key:
        print('GROQ_API_KEY not set')
        return

    print(f'Query:    "{_TITLE}" (film)')
    print(f'Expected  title_ru:       {_EXPECTED_RU}')
    print(f'Expected  title_original: {_EXPECTED_ORIGINAL}')

    async with httpx.AsyncClient() as client:
        # Run models sequentially to avoid rate limits
        for model in _MODELS:
            await test_model(client, model, api_key)


if __name__ == '__main__':
    asyncio.run(main())

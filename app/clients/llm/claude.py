import logging
import time

import anthropic
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

_LOOKUP_TOOL: anthropic.types.ToolParam = {
    'name': 'return_movie_data',
    'description': 'Return structured movie data. Use found=false if not identified.',
    'input_schema': LookupResponse.model_json_schema(),  # type: ignore[typeddict-item]
}

_ENRICH_TOOL: anthropic.types.ToolParam = {
    'name': 'return_enrich_data',
    'description': 'Return supplementary film data. Use found=false if not confident.',
    'input_schema': EnrichResponse.model_json_schema(),  # type: ignore[typeddict-item]
}


class ClaudeLLMClient:
    def __init__(self, api_key: str, model: str) -> None:
        self._client = anthropic.AsyncAnthropic(api_key=api_key)
        self._model = model

    async def fetch_movie_data(
        self,
        *,
        title: str,
        media_type: MediaType,
        user_query: str | None,
        year: int | None = None,
    ) -> LLMMovieData | None:
        t0 = time.monotonic()
        user_message = build_lookup_message(title, media_type, year, user_query)
        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=2048,
                system=MOVIE_LOOKUP_TASK,
                messages=[{'role': 'user', 'content': user_message}],
                tools=[_LOOKUP_TOOL],
                tool_choice={'type': 'tool', 'name': 'return_movie_data'},
            )
        except anthropic.RateLimitError as e:
            raise LLMRateLimitError() from e
        except anthropic.APIError as e:
            logger.error('fetch_movie_data: API error for %r: %s', title, e)
            return None

        logger.info(
            'LLM movie_lookup (claude): %d input + %d output tokens, %.1fs',
            response.usage.input_tokens,
            response.usage.output_tokens,
            time.monotonic() - t0,
        )

        tool_input = next(
            (block.input for block in response.content if block.type == 'tool_use'), None
        )
        if tool_input is None:
            logger.error('fetch_movie_data: no tool_use block in response for %r', title)
            return None

        lf = get_langfuse()
        if lf:
            try:
                lf.start_observation(
                    name='claude_movie_lookup',
                    as_type='generation',
                    model=self._model,
                    input=[{'role': 'user', 'content': user_message}],
                    output=tool_input,
                    usage_details={
                        'input': response.usage.input_tokens,
                        'output': response.usage.output_tokens,
                    },
                    metadata={'title': title, 'media_type': media_type.value},
                ).end()
            except Exception:
                logger.warning('Langfuse tracking failed for %r', title, exc_info=True)

        try:
            data = LookupResponse.model_validate(tool_input)
            return data.movie if data.found else None
        except ValidationError as e:
            logger.error('fetch_movie_data: validation error for %r: %s', title, e)
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
        t0 = time.monotonic()
        user_message = build_enrich_message(title_original, title_ru, year, overview, media_type)
        try:
            response = await self._client.messages.create(
                model=self._model,
                max_tokens=2048,
                system=MOVIE_ENRICH_TASK,
                messages=[{'role': 'user', 'content': user_message}],
                tools=[_ENRICH_TOOL],
                tool_choice={'type': 'tool', 'name': 'return_enrich_data'},
            )
        except anthropic.RateLimitError as e:
            raise LLMRateLimitError() from e
        except anthropic.APIError as e:
            logger.error('fetch_movie_data_enriched: API error for %r: %s', title_original, e)
            return None

        logger.info(
            'LLM movie_enrich (claude): %d input + %d output tokens, %.1fs',
            response.usage.input_tokens,
            response.usage.output_tokens,
            time.monotonic() - t0,
        )

        tool_input = next(
            (block.input for block in response.content if block.type == 'tool_use'), None
        )
        if tool_input is None:
            logger.error('fetch_movie_data_enriched: no tool_use block for %r', title_original)
            return None

        lf = get_langfuse()
        if lf:
            try:
                lf.start_observation(
                    name='claude_movie_enrich',
                    as_type='generation',
                    model=self._model,
                    input=[{'role': 'user', 'content': user_message}],
                    output=tool_input,
                    usage_details={
                        'input': response.usage.input_tokens,
                        'output': response.usage.output_tokens,
                    },
                    metadata={'title': title_original, 'media_type': media_type.value},
                ).end()
            except Exception:
                logger.warning('Langfuse tracking failed for %r', title_original, exc_info=True)

        try:
            data = EnrichResponse.model_validate(tool_input)
            return data.to_llm_movie_data(
                title_original=title_original,
                title_ru=title_ru,
                overview=overview,
                year=year,
                media_type=media_type,
            )
        except ValidationError as e:
            logger.error(
                'fetch_movie_data_enriched: validation error for %r: %s', title_original, e
            )
            return None

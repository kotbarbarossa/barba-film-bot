from pydantic import BaseModel

from app.clients.llm.schemas import CategoryData, LLMMovieData, PersonData
from app.movie.models import MediaType

MOVIE_LOOKUP_TASK = """\
You are a movie database assistant.
Given a movie title and media type, identify the film and return its data.

Rules:
- description must be in Russian (2-3 sentences)
- country fields must be in Russian (e.g. "США", "Великобритания", "Франция")
- Include up to 5 main actors, all directors, all main writers
- Include 3-7 genres
- If not found or not confident: return not found
"""

MOVIE_ENRICH_TASK = """\
You are a movie database assistant. A film has been identified — provide supplementary data.

Rules:
- country fields must be in Russian (e.g. "США", "Великобритания", "Франция")
- Include up to 5 main actors, all directors, all main writers
- Include 3-7 genres
- If not confident about this film: return not found
"""


def build_lookup_message(
    title: str,
    media_type: MediaType,
    year: int | None,
    user_query: str | None,
) -> str:
    msg = f'Movie: "{title}" (type: {media_type.value})'
    if year:
        msg += f', year: {year}'
    if user_query:
        msg += f'\nAdditional context: {user_query}'
    return msg


def build_enrich_message(
    title_original: str,
    title_ru: str | None,
    year: int | None,
    overview: str | None,
    media_type: MediaType,
) -> str:
    lines = [f'Movie: "{title_original}" ({media_type.value}']
    if year:
        lines[0] += f', {year}'
    lines[0] += ')'
    if title_ru:
        lines.append(f'Russian title: "{title_ru}"')
    if overview:
        lines.append(f'Overview: "{overview}"')
    return '\n'.join(lines)


class LookupResponse(BaseModel):
    found: bool
    movie: LLMMovieData | None = None


class _EnrichMovieData(BaseModel):
    duration_minutes: int | None = None
    age_rating: str | None = None
    description_original: str | None = None
    imdb_rating: float | None = None
    kinopoisk_rating: float | None = None
    country: str | None = None
    categories: list[CategoryData]
    persons: list[PersonData]


class EnrichResponse(BaseModel):
    found: bool
    movie: _EnrichMovieData | None = None

    def to_llm_movie_data(
        self,
        *,
        title_original: str,
        title_ru: str | None,
        overview: str | None,
        year: int | None,
        media_type: MediaType,
    ) -> LLMMovieData | None:
        if not self.found or self.movie is None:
            return None
        e = self.movie
        return LLMMovieData(
            title_original=title_original,
            title_ru=title_ru,
            description=overview,
            description_original=e.description_original,
            year=year,
            duration_minutes=e.duration_minutes,
            age_rating=e.age_rating,
            imdb_rating=e.imdb_rating,
            kinopoisk_rating=e.kinopoisk_rating,
            country=e.country,
            media_type=media_type,
            categories=e.categories,
            persons=e.persons,
        )

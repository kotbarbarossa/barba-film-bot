"""Test _fetch_movie_data with both TMDB-found and TMDB-not-found scenarios."""

import asyncio
import logging
import types

from app.clients.groq import MovieData
from app.movie.models import MediaType, ProcessingStatus
from app.movie.processing_use_case import ProcessMovieUseCase

logging.basicConfig(level=logging.INFO, format='%(levelname)s %(name)s: %(message)s')


def make_movie(
    id_: int, title_ru: str | None, title_original: str | None
) -> types.SimpleNamespace:
    m = types.SimpleNamespace()
    m.id = id_
    m.title_ru = title_ru
    m.title_original = title_original
    m.media_type = MediaType.FILM
    m.user_query = None
    m.processing_status = ProcessingStatus.PENDING
    return m


def print_result(label: str, data: MovieData | None) -> None:
    print(f'\n{"─" * 55}')
    print(f'Scenario: {label}')
    if data is None:
        print('  result: None (UNRECOGNIZED)')
        return
    print(f'  title_ru:       {data.title_ru}')
    print(f'  title_original: {data.title_original}')
    print(f'  year:           {data.year}')
    print(f'  description:    {(data.description or "")[:70]}')
    print(f'  imdb_rating:    {data.imdb_rating}')
    print(f'  tmdb_rating:    {data.tmdb_rating}')
    print(f'  country:        {data.country}')
    print(f'  poster_url:     {"✓" if data.poster_url else "✗"} {data.poster_url or ""}')
    print(f'  tmdb_id:        {data.tmdb_id}')
    print(f'  categories:     {[c.name for c in data.categories]}')
    print(f'  persons:        {[(p.name, p.role.value) for p in data.persons[:3]]}')


async def main() -> None:
    uc = ProcessMovieUseCase(session=None)  # type: ignore[arg-type]

    # Scenario 1: TMDB found (exact Russian title)
    movie1 = make_movie(1, title_ru='Бесподобный мистер Фокс', title_original=None)
    data1 = await uc._fetch_movie_data(movie1)  # type: ignore[arg-type]
    print_result('TMDB found (точное RU название)', data1)

    # Scenario 2: TMDB not found → Groq full flow
    movie2 = make_movie(2, title_ru='Невероятный мистер лис', title_original=None)
    data2 = await uc._fetch_movie_data(movie2)  # type: ignore[arg-type]
    print_result('TMDB not found → Groq full flow (приблизительное название)', data2)

    # Scenario 3: English title
    movie3 = make_movie(3, title_ru=None, title_original='The Dark Knight')
    data3 = await uc._fetch_movie_data(movie3)  # type: ignore[arg-type]
    print_result('TMDB found (English title)', data3)


if __name__ == '__main__':
    asyncio.run(main())

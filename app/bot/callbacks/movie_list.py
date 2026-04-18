from enum import StrEnum

from aiogram.filters.callback_data import CallbackData


class CategoryCallback(CallbackData, prefix='cat'):
    id: int


class PeriodCallback(CallbackData, prefix='per'):
    year_from: int
    year_to: int
    label: str


class MovieCardSource(StrEnum):
    random = 'r'
    genre = 'g'
    period = 'p'
    recent = 'w'


class MovieCardCallback(CallbackData, prefix='mc'):
    movie_id: int
    source: MovieCardSource


class WatchedCallback(CallbackData, prefix='mw'):
    movie_id: int


class BackFromCardCallback(CallbackData, prefix='bfc'):
    source: MovieCardSource

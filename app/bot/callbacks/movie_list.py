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
    added = 'a'
    all = 'l'


class MovieCardCallback(CallbackData, prefix='mc'):
    movie_id: int
    source: MovieCardSource


class WatchedCallback(CallbackData, prefix='mw'):
    movie_id: int
    source: MovieCardSource


class RatingCallback(CallbackData, prefix='mr'):
    movie_id: int
    rating: int
    source: MovieCardSource


class BackFromCardCallback(CallbackData, prefix='bfc'):
    source: MovieCardSource


class ShareCallback(CallbackData, prefix='ms'):
    movie_id: int
    source: MovieCardSource


class AddToListCallback(CallbackData, prefix='mal'):
    movie_id: int

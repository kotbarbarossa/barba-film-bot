from aiogram.filters.callback_data import CallbackData

from app.movie.models import MediaType


class MediaTypeCallback(CallbackData, prefix='movie_mt'):
    value: MediaType


class SkipDetailsCallback(CallbackData, prefix='movie_skip'):
    pass

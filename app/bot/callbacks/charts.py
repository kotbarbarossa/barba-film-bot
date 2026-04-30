from aiogram.filters.callback_data import CallbackData


class TrendingMovieCallback(CallbackData, prefix='tmc'):
    movie_id: int

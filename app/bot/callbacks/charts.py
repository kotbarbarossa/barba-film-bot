from aiogram.filters.callback_data import CallbackData

from app.bot.callbacks.navigation import NavAction


class ChartMovieCallback(CallbackData, prefix='cmc'):
    movie_id: int
    chart: NavAction

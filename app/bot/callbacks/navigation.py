from enum import StrEnum

from aiogram.filters.callback_data import CallbackData


class NavAction(StrEnum):
    main_menu = 'main_menu'
    movie_list = 'movie_list'
    movie_add = 'movie_add'
    movie_random = 'movie_random'
    movie_by_genre = 'movie_by_genre'
    movie_by_year = 'movie_by_year'
    movie_recent = 'movie_recent'
    movie_all = 'movie_all'


class NavigationCallback(CallbackData, prefix='nav'):
    action: NavAction

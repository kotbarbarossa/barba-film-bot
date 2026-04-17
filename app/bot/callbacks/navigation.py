from enum import StrEnum

from aiogram.filters.callback_data import CallbackData


class NavAction(StrEnum):
    main_menu = 'main_menu'
    movie_list = 'movie_list'
    movie_add = 'movie_add'


class NavigationCallback(CallbackData, prefix='nav'):
    action: NavAction

from enum import StrEnum

from aiogram.filters.callback_data import CallbackData


class NavAction(StrEnum):
    main_menu = 'main_menu'
    movie_list = 'movie_list'
    movie_add = 'movie_add'
    movie_random = 'movie_random'
    movie_by_genre = 'movie_by_genre'
    movie_by_year = 'movie_by_year'
    movie_recent_added = 'movie_recent_added'
    movie_recent = 'movie_recent'
    movie_all = 'movie_all'
    charts = 'charts'
    charts_global_trending = 'charts_global_trending'
    charts_top_rated = 'charts_top_rated'
    charts_top_want = 'charts_top_want'
    charts_top_watched = 'charts_top_watched'
    charts_top_controversial = 'charts_top_controversial'
    charts_top_quick = 'charts_top_quick'
    charts_top_postponed = 'charts_top_postponed'


class NavigationCallback(CallbackData, prefix='nav'):
    action: NavAction

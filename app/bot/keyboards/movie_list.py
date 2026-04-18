from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.movie_list import (
    BackFromCardCallback,
    CategoryCallback,
    MovieCardCallback,
    MovieCardSource,
    PeriodCallback,
    WatchedCallback,
)
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import (
    BTN_BACK,
    BTN_MOVIE_ALL,
    BTN_MOVIE_BY_GENRE,
    BTN_MOVIE_BY_YEAR,
    BTN_MOVIE_RANDOM,
    BTN_MOVIE_RECENT,
    BTN_WATCHED,
)
from app.movie.models import UserMovie


def movie_list_menu_keyboard() -> InlineKeyboardMarkup:
    def nav(action: NavAction) -> str:
        return NavigationCallback(action=action).pack()

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text=BTN_MOVIE_RANDOM, callback_data=nav(NavAction.movie_random))],
            [InlineKeyboardButton(text=BTN_MOVIE_BY_GENRE, callback_data=nav(NavAction.movie_by_genre))],
            [InlineKeyboardButton(text=BTN_MOVIE_BY_YEAR, callback_data=nav(NavAction.movie_by_year))],
            [InlineKeyboardButton(text=BTN_MOVIE_RECENT, callback_data=nav(NavAction.movie_recent))],
            [InlineKeyboardButton(text=BTN_MOVIE_ALL, callback_data=nav(NavAction.movie_all))],
            [InlineKeyboardButton(text=BTN_BACK, callback_data=nav(NavAction.main_menu))],
        ]
    )


def genre_list_keyboard(categories: list) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(
            text=cat.name,
            callback_data=CategoryCallback(slug=cat.slug).pack(),
        )]
        for cat in categories
    ]
    rows.append([InlineKeyboardButton(
        text=BTN_BACK,
        callback_data=NavigationCallback(action=NavAction.movie_list).pack(),
    )])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def period_list_keyboard(decades: list[int]) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(
            text=f'{decade}е',
            callback_data=PeriodCallback(
                year_from=decade,
                year_to=decade + 9,
                label=f'{decade}е',
            ).pack(),
        )]
        for decade in decades
    ]
    rows.append([InlineKeyboardButton(
        text=BTN_BACK,
        callback_data=NavigationCallback(action=NavAction.movie_list).pack(),
    )])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def movie_buttons_keyboard(
    user_movies: list[UserMovie],
    source: MovieCardSource,
    back_callback: str,
) -> InlineKeyboardMarkup:
    rows = [
        [InlineKeyboardButton(
            text=um.movie.title_ru or um.movie.title_original or '—',
            callback_data=MovieCardCallback(movie_id=um.movie_id, source=source).pack(),
        )]
        for um in user_movies
    ]
    rows.append([InlineKeyboardButton(text=BTN_BACK, callback_data=back_callback)])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def movie_card_keyboard(movie_id: int, source: MovieCardSource, show_watched: bool = True) -> InlineKeyboardMarkup:
    rows = []
    if show_watched:
        rows.append([InlineKeyboardButton(
            text=BTN_WATCHED,
            callback_data=WatchedCallback(movie_id=movie_id).pack(),
        )])
    rows.append([InlineKeyboardButton(
        text=BTN_BACK,
        callback_data=BackFromCardCallback(source=source).pack(),
    )])
    return InlineKeyboardMarkup(inline_keyboard=rows)

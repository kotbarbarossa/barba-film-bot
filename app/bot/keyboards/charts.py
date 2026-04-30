from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.charts import ChartMovieCallback
from app.bot.callbacks.movie_list import AddToListCallback, MovieCardSource
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import (
    BTN_ADD_TO_LIST,
    BTN_BACK,
    BTN_CHARTS_GLOBAL_TRENDING,
    BTN_CHARTS_TOP_CONTROVERSIAL,
    BTN_CHARTS_TOP_POSTPONED,
    BTN_CHARTS_TOP_QUICK,
    BTN_CHARTS_TOP_RATED,
    BTN_CHARTS_TOP_WANT,
    BTN_CHARTS_TOP_WATCHED,
)
from app.discovery.schemas import ChartEntry


def charts_menu_keyboard() -> InlineKeyboardMarkup:
    chart_buttons = [
        (BTN_CHARTS_GLOBAL_TRENDING, NavAction.charts_global_trending),
        (BTN_CHARTS_TOP_RATED, NavAction.charts_top_rated),
        (BTN_CHARTS_TOP_WANT, NavAction.charts_top_want),
        (BTN_CHARTS_TOP_WATCHED, NavAction.charts_top_watched),
        (BTN_CHARTS_TOP_CONTROVERSIAL, NavAction.charts_top_controversial),
        (BTN_CHARTS_TOP_QUICK, NavAction.charts_top_quick),
        (BTN_CHARTS_TOP_POSTPONED, NavAction.charts_top_postponed),
    ]
    rows = [
        [InlineKeyboardButton(text=text, callback_data=NavigationCallback(action=action).pack())]
        for text, action in chart_buttons
    ]
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=NavigationCallback(action=NavAction.main_menu).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def charts_back_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=NavigationCallback(action=NavAction.charts).pack(),
                )
            ],
        ]
    )


def chart_movies_keyboard(entries: list[ChartEntry], chart: NavAction) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                text=f'#{i} {e.title_ru or e.title_original or "—"}',
                callback_data=ChartMovieCallback(movie_id=e.movie_id, chart=chart).pack(),
            )
        ]
        for i, e in enumerate(entries, start=1)
    ]
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=NavigationCallback(action=NavAction.charts).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def chart_movie_card_keyboard(
    movie_id: int, chart: NavAction, in_list: bool
) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    if not in_list:
        rows.append(
            [
                InlineKeyboardButton(
                    text=BTN_ADD_TO_LIST,
                    callback_data=AddToListCallback(
                        movie_id=movie_id, source=MovieCardSource.chart
                    ).pack(),
                )
            ]
        )
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=NavigationCallback(action=chart).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)

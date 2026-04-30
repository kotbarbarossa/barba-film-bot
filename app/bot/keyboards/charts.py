from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.charts import TrendingMovieCallback
from app.bot.callbacks.movie_list import AddToListCallback, MovieCardSource
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import BTN_ADD_TO_LIST, BTN_BACK, BTN_CHARTS_GLOBAL_TRENDING
from app.discovery.schemas import ChartEntry


def charts_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_CHARTS_GLOBAL_TRENDING,
                    callback_data=NavigationCallback(
                        action=NavAction.charts_global_trending
                    ).pack(),
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=NavigationCallback(action=NavAction.main_menu).pack(),
                )
            ],
        ]
    )


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


def trending_movies_keyboard(entries: list[ChartEntry]) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                text=f'#{i} {e.title_ru or e.title_original or "—"}',
                callback_data=TrendingMovieCallback(movie_id=e.movie_id).pack(),
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


def trending_movie_card_keyboard(movie_id: int, in_list: bool) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    if not in_list:
        rows.append(
            [
                InlineKeyboardButton(
                    text=BTN_ADD_TO_LIST,
                    callback_data=AddToListCallback(
                        movie_id=movie_id, source=MovieCardSource.trending
                    ).pack(),
                )
            ]
        )
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=NavigationCallback(action=NavAction.charts_global_trending).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)

from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.movie_list import (
    AddToListCallback,
    BackFromCardCallback,
    CategoryCallback,
    ConfirmDeleteCallback,
    DeleteFromListCallback,
    MovieCardCallback,
    MovieCardSource,
    PeriodCallback,
    RatingCallback,
    ShareCallback,
    ShowRatingCallback,
    WatchedCallback,
)
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import (
    BTN_ADD_TO_LIST,
    BTN_BACK,
    BTN_DELETE_CONFIRM,
    BTN_DELETE_FROM_LIST,
    BTN_MAIN_MENU,
    BTN_MOVIE_ALL,
    BTN_MOVIE_BY_GENRE,
    BTN_MOVIE_BY_YEAR,
    BTN_MOVIE_RANDOM,
    BTN_MOVIE_RECENT,
    BTN_MOVIE_RECENT_ADDED,
    BTN_RATE,
    BTN_SHARE,
    BTN_WATCHED,
)
from app.movie.models import Category, UserMovie


def movie_list_menu_keyboard() -> InlineKeyboardMarkup:
    def nav(action: NavAction) -> str:
        return NavigationCallback(action=action).pack()

    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_MOVIE_RANDOM, callback_data=nav(NavAction.movie_random)
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_MOVIE_BY_GENRE, callback_data=nav(NavAction.movie_by_genre)
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_MOVIE_BY_YEAR, callback_data=nav(NavAction.movie_by_year)
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_MOVIE_RECENT_ADDED,
                    callback_data=nav(NavAction.movie_recent_added),
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_MOVIE_RECENT, callback_data=nav(NavAction.movie_recent)
                )
            ],
            [InlineKeyboardButton(text=BTN_MOVIE_ALL, callback_data=nav(NavAction.movie_all))],
            [InlineKeyboardButton(text=BTN_BACK, callback_data=nav(NavAction.main_menu))],
        ]
    )


def genre_list_keyboard(categories: list[Category]) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                text=cat.name,
                callback_data=CategoryCallback(id=cat.id).pack(),
            )
        ]
        for cat in categories
    ]
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=NavigationCallback(action=NavAction.movie_list).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def period_list_keyboard(decades: list[int]) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                text=f'{decade}е',
                callback_data=PeriodCallback(
                    year_from=decade,
                    year_to=decade + 9,
                    label=f'{decade}е',
                ).pack(),
            )
        ]
        for decade in decades
    ]
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=NavigationCallback(action=NavAction.movie_list).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def movie_buttons_keyboard(
    user_movies: list[UserMovie],
    source: MovieCardSource,
    back_callback: str,
) -> InlineKeyboardMarkup:
    rows = [
        [
            InlineKeyboardButton(
                text=um.movie.title_ru or um.movie.title_original or '—',
                callback_data=MovieCardCallback(movie_id=um.movie_id, source=source).pack(),
            )
        ]
        for um in user_movies
    ]
    rows.append([InlineKeyboardButton(text=BTN_BACK, callback_data=back_callback)])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def rating_keyboard(movie_id: int, source: MovieCardSource) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=str(r),
                    callback_data=RatingCallback(
                        movie_id=movie_id, rating=r, source=source
                    ).pack(),
                )
                for r in range(10, 5, -1)
            ],
            [
                InlineKeyboardButton(
                    text=str(r),
                    callback_data=RatingCallback(
                        movie_id=movie_id, rating=r, source=source
                    ).pack(),
                )
                for r in range(5, 0, -1)
            ],
        ]
    )


def movie_card_keyboard(
    movie_id: int,
    source: MovieCardSource,
    show_watched: bool = True,
    show_rate: bool = False,
) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []
    if show_watched:
        rows.append(
            [
                InlineKeyboardButton(
                    text=BTN_WATCHED,
                    callback_data=WatchedCallback(movie_id=movie_id, source=source).pack(),
                )
            ]
        )
    elif show_rate:
        rows.append(
            [
                InlineKeyboardButton(
                    text=BTN_RATE,
                    callback_data=ShowRatingCallback(movie_id=movie_id, source=source).pack(),
                )
            ]
        )
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_SHARE,
                callback_data=ShareCallback(movie_id=movie_id, source=source).pack(),
            )
        ]
    )
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_DELETE_FROM_LIST,
                callback_data=DeleteFromListCallback(movie_id=movie_id, source=source).pack(),
            )
        ]
    )
    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=BackFromCardCallback(source=source).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def delete_confirm_keyboard(movie_id: int, source: MovieCardSource) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_DELETE_CONFIRM,
                    callback_data=ConfirmDeleteCallback(movie_id=movie_id, source=source).pack(),
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=MovieCardCallback(movie_id=movie_id, source=source).pack(),
                )
            ],
        ]
    )


def back_from_source_keyboard(source: MovieCardSource) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=BackFromCardCallback(source=source).pack(),
                )
            ]
        ]
    )


def share_message_keyboard(movie_id: int, source: MovieCardSource) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=MovieCardCallback(movie_id=movie_id, source=source).pack(),
                )
            ]
        ]
    )


def to_main_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_MAIN_MENU,
                    callback_data=NavigationCallback(action=NavAction.main_menu).pack(),
                )
            ]
        ]
    )


def add_to_list_keyboard(movie_id: int) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_ADD_TO_LIST,
                    callback_data=AddToListCallback(movie_id=movie_id).pack(),
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_MAIN_MENU,
                    callback_data=NavigationCallback(action=NavAction.main_menu).pack(),
                )
            ],
        ]
    )

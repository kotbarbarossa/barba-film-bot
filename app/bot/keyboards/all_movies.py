from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.all_movies import (
    AllMoviesCancelInput,
    AllMoviesFieldClear,
    AllMoviesFieldInput,
    AllMoviesFilterClose,
    AllMoviesFilterOpen,
    AllMoviesNoop,
    AllMoviesPageCallback,
    AllMoviesToggleCategory,
    AllMoviesToggleMediaType,
    AllMoviesToggleSort,
    AllMoviesToggleStatus,
)
from app.bot.callbacks.movie_list import MovieCardCallback, MovieCardSource
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import BTN_BACK
from app.movie.models import Category, MediaType, UserMovie, WatchStatus

_PAGE_SIZE = 10

_SORT_LABELS: dict[str, str] = {
    'imdb_rating': 'IMDB ↓',
    'year': 'Год ↓',
    'user_rating': 'Мой рейт. ↓',
    'added_at': 'Добавлен ↓',
    'watched_at': 'Просмотрен ↓',
}

_MEDIA_LABELS: dict[str, str] = {
    MediaType.FILM: 'Фильм',
    MediaType.SERIES: 'Сериал',
}

_STATUS_LABELS: dict[str, str] = {
    WatchStatus.WANT: 'Хочу',
    WatchStatus.WATCHED: 'Просмотрено',
}


def _check(active: bool) -> str:
    return '✓ ' if active else ''


def all_movies_list_keyboard(
    user_movies: list[UserMovie],
    page: int,
    total: int,
) -> InlineKeyboardMarkup:
    total_pages = max(1, (total + _PAGE_SIZE - 1) // _PAGE_SIZE)
    rows: list[list[InlineKeyboardButton]] = []

    rows.append(
        [InlineKeyboardButton(text='Фильтры ▼', callback_data=AllMoviesFilterOpen().pack())]
    )

    for um in user_movies:
        rows.append(
            [
                InlineKeyboardButton(
                    text=um.movie.title_ru or um.movie.title_original or '—',
                    callback_data=MovieCardCallback(
                        movie_id=um.movie_id, source=MovieCardSource.all
                    ).pack(),
                )
            ]
        )

    nav_row: list[InlineKeyboardButton] = []
    if page > 0:
        nav_row.append(
            InlineKeyboardButton(
                text='←', callback_data=AllMoviesPageCallback(page=page - 1).pack()
            )
        )
    if total_pages > 1:
        nav_row.append(
            InlineKeyboardButton(
                text=f'{page + 1} / {total_pages}',
                callback_data=AllMoviesNoop().pack(),
            )
        )
    if page < total_pages - 1:
        nav_row.append(
            InlineKeyboardButton(
                text='→', callback_data=AllMoviesPageCallback(page=page + 1).pack()
            )
        )
    if nav_row:
        rows.append(nav_row)

    rows.append(
        [
            InlineKeyboardButton(
                text=BTN_BACK,
                callback_data=NavigationCallback(action=NavAction.movie_list).pack(),
            )
        ]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def _range_btn(label: str, value: int | float | None, field: str) -> InlineKeyboardButton:
    display = str(value) if value is not None else '—'
    return InlineKeyboardButton(
        text=f'{label}: {display}',
        callback_data=AllMoviesFieldInput(field=field).pack(),
    )


def _range_clear_btn(label: str, value: int | float | None, field: str) -> InlineKeyboardButton:
    if value is not None:
        return InlineKeyboardButton(
            text=f'{label}: {value} ✕',
            callback_data=AllMoviesFieldClear(field=field).pack(),
        )
    return InlineKeyboardButton(
        text=f'{label}: —',
        callback_data=AllMoviesFieldInput(field=field).pack(),
    )


def all_movies_filter_keyboard(
    data: dict,
    categories: list[Category],
) -> InlineKeyboardMarkup:
    rows: list[list[InlineKeyboardButton]] = []

    # --- Диапазоны ---
    rows.append(
        [
            _range_clear_btn('Год от', data.get('year_from'), 'year_from'),
            _range_clear_btn('Год до', data.get('year_to'), 'year_to'),
        ]
    )
    rows.append(
        [
            _range_clear_btn('IMDB от', data.get('imdb_from'), 'imdb_from'),
            _range_clear_btn('IMDB до', data.get('imdb_to'), 'imdb_to'),
        ]
    )
    rows.append(
        [
            _range_clear_btn('Рейт. от', data.get('rating_from'), 'rating_from'),
            _range_clear_btn('Рейт. до', data.get('rating_to'), 'rating_to'),
        ]
    )

    # --- Тип медиа ---
    active_media: list[str] = data.get('media_types', [])
    rows.append(
        [
            InlineKeyboardButton(
                text=f'{_check(mt in active_media)}{label}',
                callback_data=AllMoviesToggleMediaType(value=mt).pack(),
            )
            for mt, label in _MEDIA_LABELS.items()
        ]
    )

    # --- Категории (по 2 в ряд) ---
    active_cats: list[int] = data.get('category_ids', [])
    cat_buttons = [
        InlineKeyboardButton(
            text=f'{_check(cat.id in active_cats)}{cat.name}',
            callback_data=AllMoviesToggleCategory(id=cat.id).pack(),
        )
        for cat in categories
    ]
    for i in range(0, len(cat_buttons), 2):
        rows.append(cat_buttons[i : i + 2])

    # --- Статус ---
    active_statuses: list[str] = data.get('statuses', [])
    rows.append(
        [
            InlineKeyboardButton(
                text=f'{_check(status in active_statuses)}{label}',
                callback_data=AllMoviesToggleStatus(value=status).pack(),
            )
            for status, label in _STATUS_LABELS.items()
        ]
    )

    # --- Сортировка (заголовок + кнопки) ---
    rows.append(
        [InlineKeyboardButton(text='— Сортировка —', callback_data=AllMoviesNoop().pack())]
    )
    active_sort: str = data.get('sort_by', 'imdb_rating')
    sort_buttons = [
        InlineKeyboardButton(
            text=f'{_check(key == active_sort)}{label}',
            callback_data=AllMoviesToggleSort(value=key).pack(),
        )
        for key, label in _SORT_LABELS.items()
    ]
    for i in range(0, len(sort_buttons), 3):
        rows.append(sort_buttons[i : i + 3])

    # --- Закрыть ---
    rows.append(
        [InlineKeyboardButton(text='← Список', callback_data=AllMoviesFilterClose().pack())]
    )
    return InlineKeyboardMarkup(inline_keyboard=rows)


def all_movies_input_keyboard(field: str) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text='Сбросить',
                    callback_data=AllMoviesFieldClear(field=field).pack(),
                ),
                InlineKeyboardButton(
                    text='Отмена',
                    callback_data=AllMoviesCancelInput().pack(),
                ),
            ]
        ]
    )

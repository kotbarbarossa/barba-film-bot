from collections.abc import Callable

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

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
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.all_movies import (
    PAGE_SIZE,
    FilterData,
    all_movies_filter_keyboard,
    all_movies_input_keyboard,
    all_movies_list_keyboard,
)
from app.bot.states.all_movies import AllMoviesStates
from app.bot.texts import (
    ALL_MOVIES_EMPTY,
    ALL_MOVIES_FILTER_TITLE,
    ALL_MOVIES_INPUT_IMDB_FROM,
    ALL_MOVIES_INPUT_IMDB_TO,
    ALL_MOVIES_INPUT_RATING_FROM,
    ALL_MOVIES_INPUT_RATING_TO,
    ALL_MOVIES_INPUT_YEAR_FROM,
    ALL_MOVIES_INPUT_YEAR_TO,
    ALL_MOVIES_LIST_TITLE,
)
from app.bot.utils import safe_edit, safe_to_text
from app.movie.models import MediaType, ProcessingStatus, WatchStatus
from app.movie.repository import CategoryRepository, UserMovieFilter, UserMovieRepository
from app.user.models import User

router = Router(name='all_movies')

_DEFAULT_FILTER: FilterData = {
    'page': 0,
    'year_from': None,
    'year_to': None,
    'imdb_from': None,
    'imdb_to': None,
    'rating_from': None,
    'rating_to': None,
    'media_types': [],
    'category_ids': [],
    'statuses': [],
    'sort_by': 'imdb_rating',
    'filter_msg_id': None,
}

_FIELD_PROMPTS: dict[str, str] = {
    'year_from': ALL_MOVIES_INPUT_YEAR_FROM,
    'year_to': ALL_MOVIES_INPUT_YEAR_TO,
    'imdb_from': ALL_MOVIES_INPUT_IMDB_FROM,
    'imdb_to': ALL_MOVIES_INPUT_IMDB_TO,
    'rating_from': ALL_MOVIES_INPUT_RATING_FROM,
    'rating_to': ALL_MOVIES_INPUT_RATING_TO,
}

_FIELD_STATES: dict[str, State] = {
    'year_from': AllMoviesStates.entering_year_from,
    'year_to': AllMoviesStates.entering_year_to,
    'imdb_from': AllMoviesStates.entering_imdb_from,
    'imdb_to': AllMoviesStates.entering_imdb_to,
    'rating_from': AllMoviesStates.entering_rating_from,
    'rating_to': AllMoviesStates.entering_rating_to,
}


def _build_um_filter(user_id: int, data: FilterData) -> UserMovieFilter:
    statuses = data.get('statuses', [])
    media_types_raw = data.get('media_types', [])
    return UserMovieFilter(
        user_id=user_id,
        statuses=[WatchStatus(s) for s in statuses] if statuses else None,
        processing_status=ProcessingStatus.PROCESSED,
        year_from=data.get('year_from'),
        year_to=data.get('year_to'),
        imdb_from=data.get('imdb_from'),
        imdb_to=data.get('imdb_to'),
        user_rating_from=data.get('rating_from'),
        user_rating_to=data.get('rating_to'),
        category_ids=data.get('category_ids') or None,
        media_types=[MediaType(m) for m in media_types_raw] if media_types_raw else None,
        sort_by=data.get('sort_by', 'imdb_rating'),
    )


def _build_active_filters_text(data: FilterData) -> str:
    parts: list[str] = []
    if data.get('year_from') or data.get('year_to'):
        parts.append(f'📅 {data.get("year_from", "—")}–{data.get("year_to", "—")}')
    if data.get('imdb_from') or data.get('imdb_to'):
        parts.append(f'⭐ IMDB {data.get("imdb_from", "—")}–{data.get("imdb_to", "—")}')
    if data.get('rating_from') or data.get('rating_to'):
        parts.append(f'🌟 Рейт. {data.get("rating_from", "—")}–{data.get("rating_to", "—")}')
    if data.get('media_types'):
        labels = {'film': 'Фильм', 'series': 'Сериал'}
        parts.append(' / '.join(labels.get(m, m) for m in data.get('media_types', [])))
    if data.get('statuses'):
        labels = {'want': 'Хочу', 'watched': 'Просмотрено'}
        parts.append(' / '.join(labels.get(s, s) for s in data.get('statuses', [])))
    return '\n'.join(parts)


async def _show_list(
    message: Message, session: AsyncSession, db_user: User, data: FilterData
) -> None:
    um_filter = _build_um_filter(db_user.id, data)
    all_movies = await UserMovieRepository(session).get_filtered(um_filter)
    page = data.get('page', 0)
    total = len(all_movies)
    page_movies = all_movies[page * PAGE_SIZE : (page + 1) * PAGE_SIZE]

    filters_text = _build_active_filters_text(data)
    title = ALL_MOVIES_LIST_TITLE
    if filters_text:
        title = f'{title}\n{filters_text}'
    if total:
        total_pages = max(1, (total + PAGE_SIZE - 1) // PAGE_SIZE)
        title = f'{title}\nСтр. {page + 1} / {total_pages} · {total} фильмов'

    if not page_movies:
        await safe_to_text(
            message, ALL_MOVIES_EMPTY, reply_markup=all_movies_list_keyboard([], 0, 0)
        )
        return

    await safe_to_text(
        message,
        title,
        reply_markup=all_movies_list_keyboard(page_movies, page, total),
    )


async def _show_filter(
    message: Message, session: AsyncSession, db_user: User, data: FilterData
) -> None:
    categories = await CategoryRepository(session).get_by_user_processed(db_user.id)
    await safe_edit(
        message,
        ALL_MOVIES_FILTER_TITLE,
        reply_markup=all_movies_filter_keyboard(data, categories),
    )


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_all))
async def nav_movie_all(
    callback: CallbackQuery, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.set_state(AllMoviesStates.browsing)
    await state.set_data({**_DEFAULT_FILTER})
    await _show_list(callback.message, session, db_user, _DEFAULT_FILTER)


# ---------------------------------------------------------------------------
# Pagination
# ---------------------------------------------------------------------------


@router.callback_query(AllMoviesPageCallback.filter(), AllMoviesStates.browsing)
async def all_movies_page(
    callback: CallbackQuery,
    callback_data: AllMoviesPageCallback,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.update_data(page=callback_data.page)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_list(callback.message, session, db_user, data)


# ---------------------------------------------------------------------------
# Filter open / close
# ---------------------------------------------------------------------------


@router.callback_query(AllMoviesFilterOpen.filter(), AllMoviesStates.browsing)
async def all_movies_open_filter(
    callback: CallbackQuery, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.set_state(AllMoviesStates.filter_menu)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_filter(callback.message, session, db_user, data)


@router.callback_query(AllMoviesFilterClose.filter(), AllMoviesStates.filter_menu)
async def all_movies_close_filter(
    callback: CallbackQuery, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.update_data(page=0, filter_msg_id=None)
    await state.set_state(AllMoviesStates.browsing)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_list(callback.message, session, db_user, data)


# ---------------------------------------------------------------------------
# Toggle handlers (filter_menu state)
# ---------------------------------------------------------------------------


@router.callback_query(AllMoviesToggleStatus.filter(), AllMoviesStates.filter_menu)
async def toggle_status(
    callback: CallbackQuery,
    callback_data: AllMoviesToggleStatus,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    statuses: list[str] = list(data.get('statuses', []))
    value = callback_data.value
    if value in statuses:
        statuses.remove(value)
    else:
        statuses.append(value)
    await state.update_data(statuses=statuses)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_filter(callback.message, session, db_user, data)


@router.callback_query(AllMoviesToggleMediaType.filter(), AllMoviesStates.filter_menu)
async def toggle_media_type(
    callback: CallbackQuery,
    callback_data: AllMoviesToggleMediaType,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    media_types: list[str] = list(data.get('media_types', []))
    value = callback_data.value
    if value in media_types:
        media_types.remove(value)
    else:
        media_types.append(value)
    await state.update_data(media_types=media_types)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_filter(callback.message, session, db_user, data)


@router.callback_query(AllMoviesToggleCategory.filter(), AllMoviesStates.filter_menu)
async def toggle_category(
    callback: CallbackQuery,
    callback_data: AllMoviesToggleCategory,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    category_ids: list[int] = list(data.get('category_ids', []))
    cat_id = callback_data.id
    if cat_id in category_ids:
        category_ids.remove(cat_id)
    else:
        category_ids.append(cat_id)
    await state.update_data(category_ids=category_ids)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_filter(callback.message, session, db_user, data)


@router.callback_query(AllMoviesToggleSort.filter(), AllMoviesStates.filter_menu)
async def toggle_sort(
    callback: CallbackQuery,
    callback_data: AllMoviesToggleSort,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.update_data(sort_by=callback_data.value)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_filter(callback.message, session, db_user, data)


# ---------------------------------------------------------------------------
# Range field input
# ---------------------------------------------------------------------------


@router.callback_query(AllMoviesFieldInput.filter(), AllMoviesStates.filter_menu)
async def field_input_trigger(
    callback: CallbackQuery,
    callback_data: AllMoviesFieldInput,
    state: FSMContext,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    field = callback_data.field
    target_state = _FIELD_STATES.get(field)
    if target_state is None:
        return
    prompt = _FIELD_PROMPTS.get(field, 'Введи значение:')
    await state.update_data(filter_msg_id=callback.message.message_id)
    await state.set_state(target_state)
    await callback.message.edit_text(prompt, reply_markup=all_movies_input_keyboard(field))


@router.callback_query(AllMoviesFieldClear.filter())
async def field_clear(
    callback: CallbackQuery,
    callback_data: AllMoviesFieldClear,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.update_data(**{callback_data.field: None})
    await state.set_state(AllMoviesStates.filter_menu)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_filter(callback.message, session, db_user, data)


@router.callback_query(AllMoviesCancelInput.filter())
async def cancel_input(
    callback: CallbackQuery,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.set_state(AllMoviesStates.filter_menu)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_filter(callback.message, session, db_user, data)


# ---------------------------------------------------------------------------
# Text input handlers (one per entering_* state)
# ---------------------------------------------------------------------------


def _parse_int(text: str) -> int | None:
    try:
        v = int(text.strip())
        return v if v > 0 else None
    except ValueError:
        return None


def _parse_float(text: str) -> float | None:
    try:
        v = float(text.strip().replace(',', '.'))
        return v if v > 0 else None
    except ValueError:
        return None


async def _handle_range_input(
    message: Message,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
    field: str,
    raw: str,
    parser: Callable[[str], int | float | None],
) -> None:
    value = parser(raw)
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    filter_msg_id = data.get('filter_msg_id')

    await state.update_data(**{field: value, 'filter_msg_id': None})  # type: ignore[arg-type]
    await state.set_state(AllMoviesStates.filter_menu)
    data = await state.get_data()  # type: ignore[assignment]

    if filter_msg_id is not None:
        try:
            await message.bot.delete_message(message.chat.id, filter_msg_id)  # type: ignore[union-attr]
        except Exception:
            pass

    categories = await CategoryRepository(session).get_by_user_processed(db_user.id)
    await message.answer(
        ALL_MOVIES_FILTER_TITLE,
        reply_markup=all_movies_filter_keyboard(data, categories),
    )


@router.message(AllMoviesStates.entering_year_from)
async def input_year_from(
    message: Message, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    if not message.text:
        return
    await _handle_range_input(
        message, session, state, db_user, 'year_from', message.text, _parse_int
    )


@router.message(AllMoviesStates.entering_year_to)
async def input_year_to(
    message: Message, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    if not message.text:
        return
    await _handle_range_input(
        message, session, state, db_user, 'year_to', message.text, _parse_int
    )


@router.message(AllMoviesStates.entering_imdb_from)
async def input_imdb_from(
    message: Message, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    if not message.text:
        return
    await _handle_range_input(
        message, session, state, db_user, 'imdb_from', message.text, _parse_float
    )


@router.message(AllMoviesStates.entering_imdb_to)
async def input_imdb_to(
    message: Message, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    if not message.text:
        return
    await _handle_range_input(
        message, session, state, db_user, 'imdb_to', message.text, _parse_float
    )


@router.message(AllMoviesStates.entering_rating_from)
async def input_rating_from(
    message: Message, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    if not message.text:
        return
    await _handle_range_input(
        message, session, state, db_user, 'rating_from', message.text, _parse_int
    )


@router.message(AllMoviesStates.entering_rating_to)
async def input_rating_to(
    message: Message, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    if not message.text:
        return
    await _handle_range_input(
        message, session, state, db_user, 'rating_to', message.text, _parse_int
    )


# ---------------------------------------------------------------------------
# Noop (labels as buttons)
# ---------------------------------------------------------------------------


@router.callback_query(AllMoviesNoop.filter())
async def noop(callback: CallbackQuery) -> None:
    await callback.answer()


# ---------------------------------------------------------------------------
# Back from card — exposed for list.py
# ---------------------------------------------------------------------------


async def back_to_all_movies(
    message: Message, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    data: FilterData = await state.get_data()  # type: ignore[assignment]
    await _show_list(message, session, db_user, data)

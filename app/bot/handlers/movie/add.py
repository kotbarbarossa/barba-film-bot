from aiogram import F, Router
from aiogram.filters import StateFilter
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.movie import MediaTypeCallback, SkipDetailsCallback, SkipYearCallback
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.details import details_keyboard
from app.bot.keyboards.main_menu import main_menu_keyboard
from app.bot.keyboards.media_type import media_type_keyboard
from app.bot.keyboards.year import year_keyboard
from app.bot.states.movie import AddMovieStates
from app.bot.texts import (
    BTN_FILM,
    BTN_SERIES,
    MOVIE_ADD_DETAILS_PROMPT,
    MOVIE_ADD_FOUND,
    MOVIE_ADD_MEDIA_TYPE_PROMPT,
    MOVIE_ADD_QUEUED,
    MOVIE_ADD_TITLE_EMPTY,
    MOVIE_ADD_TITLE_PROMPT,
    MOVIE_ADD_YEAR_INVALID,
    MOVIE_ADD_YEAR_PROMPT,
)
from app.bot.utils import safe_edit
from app.movie.models import MediaType
from app.movie.use_cases import AddMovieToUserUseCase
from app.user.models import User

router = Router(name='movie_add')

_MEDIA_TYPE_LABELS = {
    MediaType.FILM: BTN_FILM,
    MediaType.SERIES: BTN_SERIES,
}

_MIN_YEAR = 1888
_MAX_YEAR = 2035


# --- Step 1: entry point → ask for title ---


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_add))
async def nav_movie_add(callback: CallbackQuery, state: FSMContext) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.set_state(AddMovieStates.waiting_for_title)
    await safe_edit(callback.message, MOVIE_ADD_TITLE_PROMPT)


# --- Step 2: title received → ask for media type ---


@router.message(AddMovieStates.waiting_for_title, F.text)
async def movie_title_received(message: Message, state: FSMContext) -> None:
    title = (message.text or '').strip()
    if not title:
        await message.answer(MOVIE_ADD_TITLE_EMPTY)
        return

    await state.update_data(title=title)
    await state.set_state(AddMovieStates.waiting_for_media_type)
    await message.answer(
        MOVIE_ADD_MEDIA_TYPE_PROMPT.format(title=title),
        reply_markup=media_type_keyboard(),
    )


# --- Step 3: media type selected → ask year (films only) or details (series) ---


@router.callback_query(
    MediaTypeCallback.filter(), StateFilter(AddMovieStates.waiting_for_media_type)
)
async def movie_media_type_selected(
    callback: CallbackQuery,
    callback_data: MediaTypeCallback,
    state: FSMContext,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    data = await state.get_data()
    title = data.get('title', '')
    media_type = callback_data.value
    media_label = _MEDIA_TYPE_LABELS[media_type]

    await state.update_data(media_type=media_type)

    if media_type == MediaType.FILM:
        await state.set_state(AddMovieStates.waiting_for_year)
        await safe_edit(
            callback.message,
            MOVIE_ADD_YEAR_PROMPT.format(title=title, media_type=media_label),
            reply_markup=year_keyboard(),
        )
    else:
        await state.update_data(year=None)
        await _ask_details(callback.message, state, edit=True)


# --- Step 4a: year text received → ask for details ---


@router.message(AddMovieStates.waiting_for_year, F.text)
async def movie_year_received(message: Message, state: FSMContext) -> None:
    raw = (message.text or '').strip()
    try:
        year = int(raw)
        if not (_MIN_YEAR <= year <= _MAX_YEAR):
            raise ValueError
    except ValueError:
        await message.answer(MOVIE_ADD_YEAR_INVALID, reply_markup=year_keyboard())
        return

    await state.update_data(year=year)
    await _ask_details(message, state)


# --- Step 4b: year skipped → ask for details ---


@router.callback_query(SkipYearCallback.filter(), StateFilter(AddMovieStates.waiting_for_year))
async def movie_year_skipped(
    callback: CallbackQuery,
    state: FSMContext,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    await state.update_data(year=None)
    await _ask_details(callback.message, state, edit=True)


async def _ask_details(message: Message, state: FSMContext, edit: bool = False) -> None:
    data = await state.get_data()
    title: str = data['title']
    media_type: MediaType = data['media_type']
    media_label = _MEDIA_TYPE_LABELS[media_type]

    await state.set_state(AddMovieStates.waiting_for_details)
    text = MOVIE_ADD_DETAILS_PROMPT.format(title=title, media_type=media_label)

    if edit:
        await safe_edit(message, text, reply_markup=details_keyboard())
    else:
        await message.answer(text, reply_markup=details_keyboard())


# --- Step 5a: details text entered → finish ---


@router.message(AddMovieStates.waiting_for_details, F.text)
async def movie_details_received(
    message: Message,
    state: FSMContext,
    session: AsyncSession,
    db_user: User,
) -> None:
    data = await state.get_data()
    title: str = data['title']
    media_type: MediaType = data['media_type']
    year: int | None = data.get('year')
    user_query = (message.text or '').strip() or None

    await state.clear()
    await _finish(message, session, db_user.id, title, media_type, year, user_query)


# --- Step 5b: details skipped → finish ---


@router.callback_query(
    SkipDetailsCallback.filter(), StateFilter(AddMovieStates.waiting_for_details)
)
async def movie_details_skipped(
    callback: CallbackQuery,
    state: FSMContext,
    session: AsyncSession,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    data = await state.get_data()
    title: str = data['title']
    media_type: MediaType = data['media_type']
    year: int | None = data.get('year')

    await state.clear()
    await _finish(
        callback.message, session, db_user.id, title, media_type, year, user_query=None, edit=True
    )


# --- Shared finish logic ---


async def _finish(
    message: Message,
    session: AsyncSession,
    user_id: int,
    title: str,
    media_type: MediaType,
    year: int | None,
    user_query: str | None,
    edit: bool = False,
) -> None:
    movie, found_existing = await AddMovieToUserUseCase(session).execute(
        user_id=user_id,
        title=title,
        media_type=media_type,
        year=year,
        user_query=user_query,
    )
    display_title = movie.title_ru or movie.title_original or title
    if found_existing:
        text = MOVIE_ADD_FOUND.format(title=display_title)
    else:
        text = MOVIE_ADD_QUEUED.format(title=display_title)

    if edit:
        await safe_edit(message, text, reply_markup=main_menu_keyboard())
    else:
        await message.answer(text, reply_markup=main_menu_keyboard())

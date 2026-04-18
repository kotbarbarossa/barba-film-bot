import re

from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.movie import MediaTypeCallback, SkipDetailsCallback
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.details import details_keyboard
from app.bot.keyboards.main_menu import main_menu_keyboard
from app.bot.keyboards.media_type import media_type_keyboard
from app.bot.states.movie import AddMovieStates
from app.bot.texts import (
    MOVIE_ADD_DETAILS_PROMPT,
    MOVIE_ADD_FOUND,
    MOVIE_ADD_MEDIA_TYPE_PROMPT,
    MOVIE_ADD_QUEUED,
    MOVIE_ADD_TITLE_EMPTY,
    MOVIE_ADD_TITLE_PROMPT,
)
from app.bot.utils import safe_edit
from app.movie.models import MediaType
from app.movie.use_cases import AddMovieToUserUseCase
from app.user.models import User

router = Router(name='movie_add')

_MEDIA_TYPE_LABELS = {
    MediaType.FILM: '🎬 Фильм',
    MediaType.SERIES: '📺 Сериал',
}


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


# --- Step 3: media type selected → ask for details ---

@router.callback_query(MediaTypeCallback.filter())
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

    await state.update_data(media_type=media_type)
    await state.set_state(AddMovieStates.waiting_for_details)

    media_label = _MEDIA_TYPE_LABELS[media_type]
    await safe_edit(
        callback.message,
        MOVIE_ADD_DETAILS_PROMPT.format(title=title, media_type=media_label),
        reply_markup=details_keyboard(),
    )


# --- Step 4a: details text entered → finish ---

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
    user_query = (message.text or '').strip() or None

    await state.clear()
    await _finish(message, session, db_user.id, title, media_type, user_query)


# --- Step 4b: details skipped → finish ---

@router.callback_query(SkipDetailsCallback.filter())
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

    await state.clear()
    await _finish(callback.message, session, db_user.id, title, media_type, user_query=None)


# --- Shared finish logic ---

async def _finish(
    message: Message,
    session: AsyncSession,
    user_id: int,
    title: str,
    media_type: MediaType,
    user_query: str | None,
) -> None:
    movie, found_existing = await AddMovieToUserUseCase(session).execute(
        user_id=user_id,
        title=title,
        media_type=media_type,
        user_query=user_query,
    )
    display_title = movie.title_ru or movie.title_original or title
    if found_existing:
        text = MOVIE_ADD_FOUND.format(title=display_title)
    else:
        text = MOVIE_ADD_QUEUED.format(title=display_title)

    await message.answer(text, reply_markup=main_menu_keyboard())

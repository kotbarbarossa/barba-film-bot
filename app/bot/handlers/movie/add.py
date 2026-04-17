from aiogram import F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.back import back_keyboard
from app.bot.keyboards.main_menu import main_menu_keyboard
from app.bot.states.movie import AddMovieStates
from app.bot.texts import MOVIE_ADD_EMPTY, MOVIE_ADD_PROMPT, MOVIE_ADD_QUEUED
from app.bot.utils import safe_edit
from app.movie.use_cases import AddMovieToUserUseCase
from app.user.models import User

router = Router(name='movie_add')


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_add))
async def nav_movie_add(callback: CallbackQuery, state: FSMContext) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.set_state(AddMovieStates.waiting_for_title)
    await safe_edit(callback.message, MOVIE_ADD_PROMPT, reply_markup=back_keyboard())


@router.message(AddMovieStates.waiting_for_title, F.text)
async def movie_title_received(
    message: Message, state: FSMContext, session: AsyncSession, db_user: User
) -> None:
    title = (message.text or '').strip()

    if not title:
        await message.answer(MOVIE_ADD_EMPTY, reply_markup=back_keyboard())
        return

    await AddMovieToUserUseCase(session).execute(user_id=db_user.id, user_query=title)

    await state.clear()
    await message.answer(
        MOVIE_ADD_QUEUED.format(title=title),
        reply_markup=main_menu_keyboard(),
    )

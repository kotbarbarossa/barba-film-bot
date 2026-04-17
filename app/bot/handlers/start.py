from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.main_menu import main_menu_keyboard
from app.user.models import AuthProvider
from app.user.repository import UserRepository

router = Router(name='start')

MAIN_MENU_TEXT = 'Выбери действие:'


@router.message(CommandStart())
async def start_handler(message: Message, session: AsyncSession) -> None:
    tg_user = message.from_user
    if tg_user is None:
        return

    repo = UserRepository(session)
    db_user = await repo.get_by_provider(
        provider=AuthProvider.TELEGRAM,
        provider_user_id=str(tg_user.id),
    )

    if db_user is None:
        await repo.create(
            provider=AuthProvider.TELEGRAM,
            provider_user_id=str(tg_user.id),
            username=tg_user.username,
            first_name=tg_user.first_name,
            last_name=tg_user.last_name,
        )

    name = tg_user.first_name or tg_user.username or '<username>'
    await message.answer(f'Привет, {name}! Выбери действие:', reply_markup=main_menu_keyboard())


@router.callback_query(NavigationCallback.filter(F.action == NavAction.main_menu))
async def nav_main_menu(callback: CallbackQuery) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await callback.message.edit_text(MAIN_MENU_TEXT, reply_markup=main_menu_keyboard())


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_list))
async def nav_movie_list(callback: CallbackQuery) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await callback.message.edit_text('Мои фильмы — скоро здесь', reply_markup=main_menu_keyboard())


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_add))
async def nav_movie_add(callback: CallbackQuery) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await callback.message.edit_text(
        'Добавить фильм — скоро здесь', reply_markup=main_menu_keyboard()
    )

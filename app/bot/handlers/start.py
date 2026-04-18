from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.types import CallbackQuery, Message

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.main_menu import main_menu_keyboard
from app.bot.texts import MAIN_MENU, WELCOME
from app.bot.utils import safe_edit
from app.user.models import User

router = Router(name='start')


@router.message(CommandStart())
async def start_handler(message: Message, db_user: User) -> None:
    name = db_user.first_name or db_user.username or '<username>'
    await message.answer(WELCOME.format(name=name), reply_markup=main_menu_keyboard())


@router.callback_query(NavigationCallback.filter(F.action == NavAction.main_menu))
async def nav_main_menu(callback: CallbackQuery) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await safe_edit(callback.message, MAIN_MENU, reply_markup=main_menu_keyboard())

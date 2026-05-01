from datetime import UTC, datetime

from aiogram import F, Router
from aiogram.filters import Command
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.back import back_keyboard
from app.bot.keyboards.main_menu import main_menu_keyboard
from app.bot.keyboards.movie_list import to_main_keyboard
from app.bot.states.feedback import FeedbackStates
from app.bot.texts import (
    FEEDBACK_EMPTY,
    FEEDBACK_LIMIT,
    FEEDBACK_PROMPT,
    FEEDBACK_SENT,
    MAIN_MENU,
)
from app.bot.utils import safe_edit
from app.core.config import settings
from app.infrastructure import arq_pool
from app.user.models import User

router = Router(name='feedback')

_RATE_LIMIT = 5
_RATE_WINDOW = 3600


@router.message(Command('feedback'))
async def feedback_start(message: Message, state: FSMContext, db_user: User) -> None:
    await state.set_state(FeedbackStates.waiting_for_text)
    await message.answer(FEEDBACK_PROMPT, reply_markup=back_keyboard(NavAction.main_menu))


@router.message(FeedbackStates.waiting_for_text)
async def feedback_receive(message: Message, state: FSMContext, db_user: User) -> None:
    text = (message.text or '').strip()
    if not text:
        await message.answer(FEEDBACK_EMPTY, reply_markup=back_keyboard(NavAction.main_menu))
        return

    redis = arq_pool.get()
    rate_key = f'feedback_limit:{db_user.id}'
    count = await redis.incr(rate_key)
    if count == 1:
        await redis.expire(rate_key, _RATE_WINDOW)
    if count > _RATE_LIMIT:
        await message.answer(FEEDBACK_LIMIT, reply_markup=back_keyboard(NavAction.main_menu))
        return

    await state.clear()

    if not settings.admin_chat_id:
        await message.answer(FEEDBACK_SENT, reply_markup=to_main_keyboard())
        return

    name = db_user.first_name or ''
    username = f'@{db_user.username}' if db_user.username else 'без username'
    now = datetime.now(UTC).strftime('%d.%m.%Y %H:%M UTC')

    admin_text = (
        f'📬 <b>Обратная связь</b>\n\n'
        f'От: {name} ({username})\n'
        f'User ID (БД): {db_user.id}\n'
        f'Дата: {now}\n\n'
        f'{text}'
    )
    bot = message.bot
    if bot is not None:
        await bot.send_message(settings.admin_chat_id, admin_text)

    await message.answer(FEEDBACK_SENT, reply_markup=to_main_keyboard())


@router.callback_query(NavigationCallback.filter(F.action == NavAction.main_menu))
async def feedback_cancel(callback: CallbackQuery, state: FSMContext) -> None:
    current = await state.get_state()
    if current != FeedbackStates.waiting_for_text:
        return
    await callback.answer()
    await state.clear()
    if isinstance(callback.message, Message):
        await safe_edit(callback.message, MAIN_MENU, reply_markup=main_menu_keyboard())

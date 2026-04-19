from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.movie import SkipDetailsCallback
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import BTN_BACK, BTN_SKIP


def details_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_SKIP,
                    callback_data=SkipDetailsCallback().pack(),
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

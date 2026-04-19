from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import BTN_BACK


def back_keyboard(action: NavAction = NavAction.main_menu) -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=NavigationCallback(action=action).pack(),
                )
            ]
        ]
    )

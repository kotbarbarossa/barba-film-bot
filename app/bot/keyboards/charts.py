from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import BTN_BACK, BTN_CHARTS_GLOBAL_TRENDING


def charts_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_CHARTS_GLOBAL_TRENDING,
                    callback_data=NavigationCallback(
                        action=NavAction.charts_global_trending
                    ).pack(),
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


def charts_back_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=NavigationCallback(action=NavAction.charts).pack(),
                )
            ],
        ]
    )

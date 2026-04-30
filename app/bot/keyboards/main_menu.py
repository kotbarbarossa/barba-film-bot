from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import BTN_CHARTS, BTN_MOVIE_ADD, BTN_MOVIE_LIST


def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_MOVIE_LIST,
                    callback_data=NavigationCallback(action=NavAction.movie_list).pack(),
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_CHARTS,
                    callback_data=NavigationCallback(action=NavAction.charts).pack(),
                )
            ],
            [
                InlineKeyboardButton(
                    text=BTN_MOVIE_ADD,
                    callback_data=NavigationCallback(action=NavAction.movie_add).pack(),
                )
            ],
        ]
    )

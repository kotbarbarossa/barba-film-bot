from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.navigation import NavAction, NavigationCallback


def main_menu_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text='Мои фильмы',
                    callback_data=NavigationCallback(action=NavAction.movie_list).pack(),
                )
            ],
            [
                InlineKeyboardButton(
                    text='Добавить фильм',
                    callback_data=NavigationCallback(action=NavAction.movie_add).pack(),
                )
            ],
        ]
    )

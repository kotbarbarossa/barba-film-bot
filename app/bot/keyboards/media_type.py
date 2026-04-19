from aiogram.types import InlineKeyboardButton, InlineKeyboardMarkup

from app.bot.callbacks.movie import MediaTypeCallback
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.texts import BTN_BACK, BTN_FILM, BTN_SERIES
from app.movie.models import MediaType


def media_type_keyboard() -> InlineKeyboardMarkup:
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=BTN_FILM,
                    callback_data=MediaTypeCallback(value=MediaType.FILM).pack(),
                ),
                InlineKeyboardButton(
                    text=BTN_SERIES,
                    callback_data=MediaTypeCallback(value=MediaType.SERIES).pack(),
                ),
            ],
            [
                InlineKeyboardButton(
                    text=BTN_BACK,
                    callback_data=NavigationCallback(action=NavAction.main_menu).pack(),
                )
            ],
        ]
    )

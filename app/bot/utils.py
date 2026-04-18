from aiogram.exceptions import TelegramBadRequest
from aiogram.types import InlineKeyboardMarkup, Message

_CAPTION_LIMIT = 1024


async def safe_edit(message: Message, text: str, reply_markup: InlineKeyboardMarkup | None = None) -> None:
    try:
        await message.edit_text(text, reply_markup=reply_markup)
    except TelegramBadRequest as e:
        if 'message is not modified' not in str(e):
            raise


async def show_card(
    message: Message,
    text: str,
    reply_markup: InlineKeyboardMarkup | None = None,
    poster_url: str | None = None,
) -> None:
    """Show movie card. Uses photo+caption if poster_url provided, plain text otherwise."""
    if poster_url:
        caption = text if len(text) <= _CAPTION_LIMIT else text[:_CAPTION_LIMIT - 3] + '...'
        try:
            await message.delete()
        except TelegramBadRequest:
            pass
        await message.answer_photo(photo=poster_url, caption=caption, reply_markup=reply_markup)
    else:
        await safe_edit(message, text, reply_markup=reply_markup)


async def safe_to_text(
    message: Message, text: str, reply_markup: InlineKeyboardMarkup | None = None
) -> None:
    """Transition from any message type (photo or text) to a text message."""
    if message.photo:
        try:
            await message.delete()
        except TelegramBadRequest:
            pass
        await message.answer(text, reply_markup=reply_markup)
    else:
        await safe_edit(message, text, reply_markup=reply_markup)

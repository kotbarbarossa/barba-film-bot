from aiogram.exceptions import TelegramBadRequest
from aiogram.types import InlineKeyboardMarkup, Message

from app.movie.models import Movie, RoleType, UserMovie, WatchStatus

_CAPTION_LIMIT = 1024


_WATCH_STATUS_LABELS = {
    WatchStatus.WANT: 'Хочу посмотреть',
    WatchStatus.WATCHING: 'Смотрю',
    WatchStatus.WATCHED: 'Просмотрено',
    WatchStatus.DROPPED: 'Исключён',
}


def format_movie_card(movie: Movie, user_movie: UserMovie | None = None) -> str:
    title = movie.title_ru or movie.title_original or '—'
    lines: list[str] = [f'<b>{title}</b>']

    if movie.title_original and movie.title_ru:
        lines.append(f'<i>{movie.title_original}</i>')

    meta: list[str] = []
    if movie.year:
        meta.append(str(movie.year))
    if movie.country:
        meta.append(movie.country)
    if movie.media_type:
        meta.append('Сериал' if movie.media_type.value == 'series' else 'Фильм')
    if meta:
        lines.append(' · '.join(meta))

    if movie.duration_minutes:
        lines.append(f'⏱ {movie.duration_minutes} мин')
    if movie.age_rating:
        lines.append(f'🔞 {movie.age_rating}')

    ratings: list[str] = []
    if movie.imdb_rating:
        ratings.append(f'IMDb {movie.imdb_rating}')
    if movie.kinopoisk_rating:
        ratings.append(f'КП {movie.kinopoisk_rating}')
    if ratings:
        lines.append('⭐ ' + ' · '.join(ratings))

    if hasattr(movie, 'categories') and movie.categories:
        cats = ', '.join(c.name for c in movie.categories)
        lines.append(f'🎭 {cats}')

    if movie.description:
        lines.append(f'\n{movie.description}')

    if hasattr(movie, 'persons') and movie.persons:
        lines.append('')
        directors = [mp.person.name for mp in movie.persons if mp.role_type == RoleType.DIRECTOR]
        if directors:
            lines.append(f'🎬 Режиссёр: {", ".join(directors)}')
        actors = [mp.person.name for mp in movie.persons if mp.role_type == RoleType.ACTOR]
        if actors:
            lines.append(f'👥 В ролях: {", ".join(actors[:3])}')

    if user_movie is not None:
        lines.append('')
        status_line = _WATCH_STATUS_LABELS[user_movie.status]
        if user_movie.status == WatchStatus.WATCHED and user_movie.watched_at is not None:
            status_line += f' · {user_movie.watched_at.strftime("%d.%m.%Y")}'
        lines.append(f'📌 {status_line}')
        if user_movie.rating is not None:
            lines.append(f'🌟 Моя оценка: {user_movie.rating}/10')

    return '\n'.join(lines)


async def safe_edit(
    message: Message, text: str, reply_markup: InlineKeyboardMarkup | None = None
) -> None:
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
        caption = text if len(text) <= _CAPTION_LIMIT else text[: _CAPTION_LIMIT - 3] + '...'
        try:
            await message.delete()
        except TelegramBadRequest:
            pass
        try:
            await message.answer_photo(
                photo=poster_url, caption=caption, reply_markup=reply_markup
            )
            return
        except TelegramBadRequest:
            await message.answer(text, reply_markup=reply_markup)
            return
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

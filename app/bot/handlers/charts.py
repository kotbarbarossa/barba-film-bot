from aiogram import F, Router
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.charts import TrendingMovieCallback
from app.bot.callbacks.movie_list import MovieCardSource
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.charts import (
    charts_back_keyboard,
    charts_menu_keyboard,
    trending_movie_card_keyboard,
    trending_movies_keyboard,
)
from app.bot.keyboards.movie_list import movie_card_keyboard
from app.bot.texts import (
    CHARTS_EMPTY,
    CHARTS_GLOBAL_TRENDING_ALLTIME,
    CHARTS_GLOBAL_TRENDING_TITLE,
    CHARTS_MENU,
)
from app.bot.utils import format_movie_card, safe_edit, safe_to_text, show_card
from app.discovery.service import get_global_trending
from app.movie.models import WatchStatus
from app.movie.repository import MovieRepository, UserMovieRepository
from app.user.models import User

router = Router(name='charts')


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts))
async def nav_charts_menu(callback: CallbackQuery) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await safe_edit(callback.message, CHARTS_MENU, reply_markup=charts_menu_keyboard())


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts_global_trending))
async def show_global_trending(
    callback: CallbackQuery,
    session: AsyncSession,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    data = await get_global_trending(session)

    if not data.entries:
        await safe_edit(callback.message, CHARTS_EMPTY, reply_markup=charts_back_keyboard())
        return

    title = CHARTS_GLOBAL_TRENDING_TITLE if data.is_trending else CHARTS_GLOBAL_TRENDING_ALLTIME
    await safe_to_text(
        callback.message,
        f'<b>{title}</b>',
        reply_markup=trending_movies_keyboard(data.entries),
    )


@router.callback_query(TrendingMovieCallback.filter())
async def show_trending_movie(
    callback: CallbackQuery,
    callback_data: TrendingMovieCallback,
    session: AsyncSession,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    movie = await MovieRepository(session).get_detail(callback_data.movie_id)
    if movie is None:
        await safe_to_text(callback.message, CHARTS_EMPTY, reply_markup=charts_back_keyboard())
        return

    um = await UserMovieRepository(session).get_by_user_and_movie(
        db_user.id, callback_data.movie_id
    )
    text = format_movie_card(movie, um)

    if um is not None:
        is_watched = um.status == WatchStatus.WATCHED
        keyboard = movie_card_keyboard(
            callback_data.movie_id,
            MovieCardSource.trending,
            show_watched=not is_watched,
            show_rate=is_watched and um.rating is None,
        )
    else:
        keyboard = trending_movie_card_keyboard(callback_data.movie_id, in_list=False)

    await show_card(
        callback.message,
        text,
        reply_markup=keyboard,
        poster_url=movie.poster_url,
    )

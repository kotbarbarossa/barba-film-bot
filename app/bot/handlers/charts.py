from collections.abc import Awaitable, Callable

from aiogram import F, Router
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.charts import ChartMovieCallback
from app.bot.callbacks.movie_list import MovieCardSource
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.charts import (
    chart_movie_card_keyboard,
    chart_movies_keyboard,
    charts_back_keyboard,
    charts_menu_keyboard,
)
from app.bot.keyboards.movie_list import movie_card_keyboard
from app.bot.texts import (
    CHARTS_EMPTY,
    CHARTS_GLOBAL_TRENDING_ALLTIME,
    CHARTS_GLOBAL_TRENDING_DESC,
    CHARTS_GLOBAL_TRENDING_TITLE,
    CHARTS_MENU,
    CHARTS_TOP_CONTROVERSIAL_DESC,
    CHARTS_TOP_CONTROVERSIAL_TITLE,
    CHARTS_TOP_POSTPONED_DESC,
    CHARTS_TOP_POSTPONED_TITLE,
    CHARTS_TOP_QUICK_DESC,
    CHARTS_TOP_QUICK_TITLE,
    CHARTS_TOP_RATED_ALLTIME,
    CHARTS_TOP_RATED_DESC,
    CHARTS_TOP_RATED_TITLE,
    CHARTS_TOP_WANT_DESC,
    CHARTS_TOP_WANT_TITLE,
    CHARTS_TOP_WATCHED_DESC,
    CHARTS_TOP_WATCHED_TITLE,
)
from app.bot.utils import format_movie_card, safe_edit, safe_to_text, show_card
from app.discovery.schemas import ChartResponse
from app.discovery.service import (
    get_global_trending,
    get_top_controversial,
    get_top_postponed,
    get_top_quick,
    get_top_rated,
    get_top_want,
    get_top_watched,
)
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
async def show_global_trending(callback: CallbackQuery, session: AsyncSession) -> None:
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
        f'<b>{title}</b>\n\n{CHARTS_GLOBAL_TRENDING_DESC}',
        reply_markup=chart_movies_keyboard(data.entries, NavAction.charts_global_trending),
    )


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts_top_rated))
async def show_top_rated(callback: CallbackQuery, session: AsyncSession) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    data = await get_top_rated(session)
    if not data.entries:
        await safe_edit(callback.message, CHARTS_EMPTY, reply_markup=charts_back_keyboard())
        return

    title = CHARTS_TOP_RATED_TITLE if len(data.entries) == 10 else CHARTS_TOP_RATED_ALLTIME
    await safe_to_text(
        callback.message,
        f'<b>{title}</b>\n\n{CHARTS_TOP_RATED_DESC}',
        reply_markup=chart_movies_keyboard(data.entries, NavAction.charts_top_rated),
    )


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts_top_want))
async def show_top_want(callback: CallbackQuery, session: AsyncSession) -> None:
    await _show_simple_chart(
        callback, session,
        getter=get_top_want,
        title=CHARTS_TOP_WANT_TITLE,
        desc=CHARTS_TOP_WANT_DESC,
        nav_action=NavAction.charts_top_want,
    )


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts_top_watched))
async def show_top_watched(callback: CallbackQuery, session: AsyncSession) -> None:
    await _show_simple_chart(
        callback, session,
        getter=get_top_watched,
        title=CHARTS_TOP_WATCHED_TITLE,
        desc=CHARTS_TOP_WATCHED_DESC,
        nav_action=NavAction.charts_top_watched,
    )


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts_top_controversial))
async def show_top_controversial(callback: CallbackQuery, session: AsyncSession) -> None:
    await _show_simple_chart(
        callback, session,
        getter=get_top_controversial,
        title=CHARTS_TOP_CONTROVERSIAL_TITLE,
        desc=CHARTS_TOP_CONTROVERSIAL_DESC,
        nav_action=NavAction.charts_top_controversial,
    )


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts_top_quick))
async def show_top_quick(callback: CallbackQuery, session: AsyncSession) -> None:
    await _show_simple_chart(
        callback, session,
        getter=get_top_quick,
        title=CHARTS_TOP_QUICK_TITLE,
        desc=CHARTS_TOP_QUICK_DESC,
        nav_action=NavAction.charts_top_quick,
    )


@router.callback_query(NavigationCallback.filter(F.action == NavAction.charts_top_postponed))
async def show_top_postponed(callback: CallbackQuery, session: AsyncSession) -> None:
    await _show_simple_chart(
        callback, session,
        getter=get_top_postponed,
        title=CHARTS_TOP_POSTPONED_TITLE,
        desc=CHARTS_TOP_POSTPONED_DESC,
        nav_action=NavAction.charts_top_postponed,
    )


@router.callback_query(ChartMovieCallback.filter())
async def show_chart_movie(
    callback: CallbackQuery,
    callback_data: ChartMovieCallback,
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
            MovieCardSource.chart,
            show_watched=not is_watched,
            show_rate=is_watched and um.rating is None,
        )
    else:
        keyboard = chart_movie_card_keyboard(
            callback_data.movie_id, callback_data.chart, in_list=False
        )

    await show_card(callback.message, text, reply_markup=keyboard, poster_url=movie.poster_url)


async def _show_simple_chart(
    callback: CallbackQuery,
    session: AsyncSession,
    *,
    getter: Callable[[AsyncSession], Awaitable[ChartResponse]],
    title: str,
    desc: str,
    nav_action: NavAction,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    data: ChartResponse = await getter(session)
    if not data.entries:
        await safe_edit(callback.message, CHARTS_EMPTY, reply_markup=charts_back_keyboard())
        return

    await safe_to_text(
        callback.message,
        f'<b>{title}</b>\n\n{desc}',
        reply_markup=chart_movies_keyboard(data.entries, nav_action),
    )

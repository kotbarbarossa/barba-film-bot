from aiogram import F, Router
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.charts import charts_back_keyboard, charts_menu_keyboard
from app.bot.texts import (
    CHARTS_EMPTY,
    CHARTS_GLOBAL_TRENDING_ALLTIME,
    CHARTS_GLOBAL_TRENDING_TITLE,
    CHARTS_MENU,
)
from app.bot.utils import safe_edit
from app.discovery.schemas import ChartEntry, GlobalTrendingResponse
from app.discovery.service import get_global_trending

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

    data: GlobalTrendingResponse = await get_global_trending(session)

    if not data.entries:
        await safe_edit(callback.message, CHARTS_EMPTY, reply_markup=charts_back_keyboard())
        return

    title = CHARTS_GLOBAL_TRENDING_TITLE if data.is_trending else CHARTS_GLOBAL_TRENDING_ALLTIME
    text = f'<b>{title}</b>\n\n' + _format_entries(data.entries)

    await safe_edit(callback.message, text, reply_markup=charts_back_keyboard())


def _format_entries(entries: list[ChartEntry]) -> str:
    lines: list[str] = []
    for i, entry in enumerate(entries, start=1):
        title = entry.title_ru or entry.title_original or '—'
        year = f' ({entry.year})' if entry.year else ''
        lines.append(
            f'{i}. <b>{title}</b>{year} · ⭐ {entry.score} · 👥 {entry.watch_count}'
        )
    return '\n'.join(lines)

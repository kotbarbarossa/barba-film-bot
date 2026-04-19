import asyncio
import logging
from collections.abc import Awaitable, Callable
from typing import Any

from aiogram import BaseMiddleware
from aiogram.types import TelegramObject, User

from app.infrastructure.database.session_manager import session_manager
from app.user.models import AuthProvider
from app.user.repository import UserRepository

logger = logging.getLogger(__name__)

_HANDLER_TIMEOUT = 30.0


class DatabaseMiddleware(BaseMiddleware):
    async def __call__(
        self,
        handler: Callable[[TelegramObject, dict[str, Any]], Awaitable[Any]],
        event: TelegramObject,
        data: dict[str, Any],
    ) -> Any:
        async with session_manager.get_session() as session:
            async with session.begin():
                data['session'] = session

                tg_user: User | None = data.get('event_from_user')
                if tg_user is not None:
                    repo = UserRepository(session)
                    db_user = await repo.get_by_provider(
                        provider=AuthProvider.TELEGRAM,
                        provider_user_id=str(tg_user.id),
                    )
                    if db_user is None:
                        db_user = await repo.create(
                            provider=AuthProvider.TELEGRAM,
                            provider_user_id=str(tg_user.id),
                            username=tg_user.username,
                            first_name=tg_user.first_name,
                            last_name=tg_user.last_name,
                        )
                    data['db_user'] = db_user

                try:
                    return await asyncio.wait_for(handler(event, data), timeout=_HANDLER_TIMEOUT)
                except asyncio.TimeoutError:
                    logger.error('Handler timed out after %.0fs', _HANDLER_TIMEOUT)
                    raise

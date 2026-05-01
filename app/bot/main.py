import asyncio
import logging

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.fsm.storage.redis import RedisStorage

from app.bot.error_handler import router as error_router
from app.bot.handlers.charts import router as charts_router
from app.bot.handlers.feedback import router as feedback_router
from app.bot.handlers.movie import add_router as movie_add_router
from app.bot.handlers.movie import all_movies_router
from app.bot.handlers.movie import list_router as movie_list_router
from app.bot.handlers.start import router as start_router
from app.bot.middlewares.database import DatabaseMiddleware
from app.core.config import settings
from app.core.sentry import init_sentry
from app.infrastructure import arq_pool
from app.infrastructure.database.engine import create_engine
from app.infrastructure.database.session_manager import session_manager


async def main() -> None:
    logging.basicConfig(level=logging.INFO)
    init_sentry('bot')

    engine = create_engine()
    session_manager.init(engine)
    await arq_pool.init(settings.redis_url)

    storage = RedisStorage.from_url(settings.redis_url)
    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher(storage=storage)

    dp.update.outer_middleware(DatabaseMiddleware())
    dp.include_router(error_router)
    dp.include_router(start_router)
    dp.include_router(feedback_router)
    dp.include_router(charts_router)
    dp.include_router(all_movies_router)
    dp.include_router(movie_list_router)
    dp.include_router(movie_add_router)

    try:
        await dp.start_polling(bot)  # type: ignore
    finally:
        await session_manager.close()
        await arq_pool.close()
        await storage.close()
        await bot.session.close()


if __name__ == '__main__':
    asyncio.run(main())

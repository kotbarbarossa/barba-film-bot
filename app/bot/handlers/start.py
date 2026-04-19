from aiogram import F, Router
from aiogram.filters import CommandObject, CommandStart
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.movie_list import AddToListCallback
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.keyboards.main_menu import main_menu_keyboard
from app.bot.keyboards.movie_list import add_to_list_keyboard, to_main_keyboard
from app.bot.texts import MAIN_MENU, MOVIE_ADD_TO_LIST_SUCCESS, MOVIE_ALREADY_IN_LIST, WELCOME
from app.bot.utils import format_movie_card, safe_to_text, show_card
from app.movie.repository import MovieRepository, UserMovieRepository
from app.user.models import User

router = Router(name='start')


@router.message(CommandStart())
async def start_handler(
    message: Message,
    command: CommandObject,
    db_user: User,
    session: AsyncSession,
) -> None:
    if command.args and command.args.startswith('movie_'):
        try:
            movie_id = int(command.args[6:])
        except ValueError:
            movie_id = None

        if movie_id is not None:
            movie = await MovieRepository(session).get_detail(movie_id)
            if movie is not None:
                already_added = await UserMovieRepository(session).get_by_user_and_movie(
                    db_user.id, movie_id
                )
                keyboard = to_main_keyboard() if already_added else add_to_list_keyboard(movie_id)
                text = format_movie_card(movie)
                await show_card(message, text, reply_markup=keyboard, poster_url=movie.poster_url)
                return

    name = db_user.first_name or db_user.username or '<username>'
    await message.answer(WELCOME.format(name=name), reply_markup=main_menu_keyboard())


@router.callback_query(AddToListCallback.filter())
async def add_to_list_handler(
    callback: CallbackQuery,
    callback_data: AddToListCallback,
    session: AsyncSession,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    repo = UserMovieRepository(session)
    existing = await repo.get_by_user_and_movie(db_user.id, callback_data.movie_id)
    if existing is not None:
        await safe_to_text(
            callback.message,
            MOVIE_ALREADY_IN_LIST,
            reply_markup=main_menu_keyboard(),
        )
        return

    await repo.create(user_id=db_user.id, movie_id=callback_data.movie_id)
    await safe_to_text(
        callback.message,
        MOVIE_ADD_TO_LIST_SUCCESS,
        reply_markup=main_menu_keyboard(),
    )


@router.callback_query(NavigationCallback.filter(F.action == NavAction.main_menu))
async def nav_main_menu(callback: CallbackQuery) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await safe_to_text(callback.message, MAIN_MENU, reply_markup=main_menu_keyboard())

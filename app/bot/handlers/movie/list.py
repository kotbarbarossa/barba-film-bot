from aiogram import Bot, F, Router
from aiogram.fsm.context import FSMContext
from aiogram.types import CallbackQuery, Message
from sqlalchemy.ext.asyncio import AsyncSession

from app.bot.callbacks.movie_list import (
    BackFromCardCallback,
    CategoryCallback,
    ConfirmDeleteCallback,
    DeleteFromListCallback,
    MovieCardCallback,
    MovieCardSource,
    PeriodCallback,
    RatingCallback,
    ShareCallback,
    WatchedCallback,
)
from app.bot.callbacks.navigation import NavAction, NavigationCallback
from app.bot.handlers.movie.all_movies import back_to_all_movies
from app.bot.keyboards.movie_list import (
    back_from_source_keyboard,
    delete_confirm_keyboard,
    genre_list_keyboard,
    movie_buttons_keyboard,
    movie_card_keyboard,
    movie_list_menu_keyboard,
    period_list_keyboard,
    rating_keyboard,
    share_message_keyboard,
)
from app.bot.states.browse import BrowseStates
from app.bot.texts import (
    MOVIE_DELETE_CONFIRM,
    MOVIE_DELETE_SUCCESS,
    MOVIE_LIST_GENRE_MOVIES,
    MOVIE_LIST_GENRES,
    MOVIE_LIST_MENU,
    MOVIE_LIST_NO_MOVIES,
    MOVIE_LIST_PERIOD_MOVIES,
    MOVIE_LIST_PERIODS,
    MOVIE_LIST_RECENT,
    MOVIE_LIST_RECENT_ADDED,
    MOVIE_LIST_RECENT_ADDED_EMPTY,
    MOVIE_LIST_RECENT_EMPTY,
    MOVIE_RANDOM_EMPTY,
    MOVIE_RATING_SAVED,
    MOVIE_SHARE_TEXT,
    MOVIE_WATCHED_SUCCESS,
)
from app.bot.utils import format_movie_card, safe_edit, safe_to_text, show_card
from app.movie.models import ProcessingStatus, WatchStatus
from app.movie.repository import (
    CategoryRepository,
    UserMovieFilter,
    UserMovieRepository,
)
from app.user.models import User

router = Router(name='movie_list')

_ACTIVE_STATUSES = [WatchStatus.WANT, WatchStatus.WATCHING]


# --- Movie list menu ---


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_list))
async def nav_movie_list(callback: CallbackQuery, state: FSMContext) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return
    await state.clear()
    await safe_to_text(callback.message, MOVIE_LIST_MENU, reply_markup=movie_list_menu_keyboard())


# --- Random ---


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_random))
async def nav_movie_random(callback: CallbackQuery, session: AsyncSession, db_user: User) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    um = await UserMovieRepository(session).get_random_active_processed(db_user.id)
    if um is None:
        await safe_to_text(
            callback.message, MOVIE_RANDOM_EMPTY, reply_markup=movie_list_menu_keyboard()
        )
        return

    text = format_movie_card(um.movie, um)
    await show_card(
        callback.message,
        text,
        reply_markup=movie_card_keyboard(
            um.movie_id,
            MovieCardSource.random,
            show_watched=um.status != WatchStatus.WATCHED,
        ),
        poster_url=um.movie.poster_url,
    )


# --- By genre ---


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_by_genre))
async def nav_movie_by_genre(
    callback: CallbackQuery, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    categories = await CategoryRepository(session).get_by_user_active(db_user.id)

    if not categories:
        await safe_to_text(
            callback.message, MOVIE_LIST_NO_MOVIES, reply_markup=movie_list_menu_keyboard()
        )
        return

    await state.clear()
    await safe_to_text(
        callback.message, MOVIE_LIST_GENRES, reply_markup=genre_list_keyboard(categories)
    )


@router.callback_query(CategoryCallback.filter())
async def genre_selected(
    callback: CallbackQuery,
    callback_data: CategoryCallback,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    category = await CategoryRepository(session).get(callback_data.id)
    if category is None:
        await safe_to_text(
            callback.message, MOVIE_LIST_NO_MOVIES, reply_markup=movie_list_menu_keyboard()
        )
        return

    user_movies = await UserMovieRepository(session).get_filtered(
        UserMovieFilter(
            user_id=db_user.id,
            statuses=_ACTIVE_STATUSES,
            processing_status=ProcessingStatus.PROCESSED,
            category_id=category.id,
        )
    )

    await state.set_state(BrowseStates.genre_movies)
    await state.update_data(category_id=category.id, name=category.name)

    if not user_movies:
        await safe_to_text(
            callback.message, MOVIE_LIST_NO_MOVIES, reply_markup=movie_list_menu_keyboard()
        )
        return

    back_cb = NavigationCallback(action=NavAction.movie_by_genre).pack()
    await safe_to_text(
        callback.message,
        MOVIE_LIST_GENRE_MOVIES.format(name=category.name),
        reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.genre, back_cb),
    )


# --- By year ---


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_by_year))
async def nav_movie_by_year(
    callback: CallbackQuery, session: AsyncSession, state: FSMContext, db_user: User
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    decades = await UserMovieRepository(session).get_active_decades(db_user.id)

    if not decades:
        await safe_to_text(
            callback.message, MOVIE_LIST_NO_MOVIES, reply_markup=movie_list_menu_keyboard()
        )
        return

    await state.clear()
    await safe_to_text(
        callback.message, MOVIE_LIST_PERIODS, reply_markup=period_list_keyboard(decades)
    )


@router.callback_query(PeriodCallback.filter())
async def period_selected(
    callback: CallbackQuery,
    callback_data: PeriodCallback,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    user_movies = await UserMovieRepository(session).get_filtered(
        UserMovieFilter(
            user_id=db_user.id,
            statuses=_ACTIVE_STATUSES,
            processing_status=ProcessingStatus.PROCESSED,
            year_from=callback_data.year_from,
            year_to=callback_data.year_to,
        )
    )

    await state.set_state(BrowseStates.period_movies)
    await state.update_data(
        year_from=callback_data.year_from,
        year_to=callback_data.year_to,
        label=callback_data.label,
    )

    if not user_movies:
        await safe_to_text(
            callback.message, MOVIE_LIST_NO_MOVIES, reply_markup=movie_list_menu_keyboard()
        )
        return

    back_cb = NavigationCallback(action=NavAction.movie_by_year).pack()
    await safe_to_text(
        callback.message,
        MOVIE_LIST_PERIOD_MOVIES.format(label=callback_data.label),
        reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.period, back_cb),
    )


# --- Recently added ---


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_recent_added))
async def nav_movie_recent_added(
    callback: CallbackQuery, session: AsyncSession, db_user: User
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    user_movies = await UserMovieRepository(session).get_recently_added(db_user.id)

    if not user_movies:
        await safe_to_text(
            callback.message,
            MOVIE_LIST_RECENT_ADDED_EMPTY,
            reply_markup=movie_list_menu_keyboard(),
        )
        return

    back_cb = NavigationCallback(action=NavAction.movie_list).pack()
    await safe_to_text(
        callback.message,
        MOVIE_LIST_RECENT_ADDED,
        reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.added, back_cb),
    )


# --- Recent watched ---


@router.callback_query(NavigationCallback.filter(F.action == NavAction.movie_recent))
async def nav_movie_recent(callback: CallbackQuery, session: AsyncSession, db_user: User) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    user_movies = await UserMovieRepository(session).get_recently_watched(db_user.id)

    if not user_movies:
        await safe_to_text(
            callback.message, MOVIE_LIST_RECENT_EMPTY, reply_markup=movie_list_menu_keyboard()
        )
        return

    back_cb = NavigationCallback(action=NavAction.movie_list).pack()
    await safe_to_text(
        callback.message,
        MOVIE_LIST_RECENT,
        reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.recent, back_cb),
    )


# --- Movie card ---


@router.callback_query(MovieCardCallback.filter())
async def show_movie_card(
    callback: CallbackQuery,
    callback_data: MovieCardCallback,
    session: AsyncSession,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    um = await UserMovieRepository(session).get_detail(db_user.id, callback_data.movie_id)
    if um is None:
        await safe_to_text(
            callback.message, MOVIE_LIST_NO_MOVIES, reply_markup=movie_list_menu_keyboard()
        )
        return

    source = callback_data.source
    show_watched = source != MovieCardSource.recent and um.status != WatchStatus.WATCHED
    text = format_movie_card(um.movie, um)
    await show_card(
        callback.message,
        text,
        reply_markup=movie_card_keyboard(um.movie_id, source, show_watched=show_watched),
        poster_url=um.movie.poster_url,
    )


# --- Back from card ---


@router.callback_query(BackFromCardCallback.filter())
async def back_from_card(
    callback: CallbackQuery,
    callback_data: BackFromCardCallback,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    source = callback_data.source

    if source == MovieCardSource.random:
        await safe_to_text(
            callback.message, MOVIE_LIST_MENU, reply_markup=movie_list_menu_keyboard()
        )

    elif source == MovieCardSource.genre:
        data = await state.get_data()
        category_id = data.get('category_id')
        name = data.get('name', '')
        if category_id is None:
            await safe_to_text(
                callback.message, MOVIE_LIST_MENU, reply_markup=movie_list_menu_keyboard()
            )
            return
        user_movies = await UserMovieRepository(session).get_filtered(
            UserMovieFilter(
                user_id=db_user.id,
                statuses=_ACTIVE_STATUSES,
                processing_status=ProcessingStatus.PROCESSED,
                category_id=category_id,
            )
        )
        back_cb = NavigationCallback(action=NavAction.movie_by_genre).pack()
        await safe_to_text(
            callback.message,
            MOVIE_LIST_GENRE_MOVIES.format(name=name),
            reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.genre, back_cb),
        )

    elif source == MovieCardSource.period:
        data = await state.get_data()
        year_from = data.get('year_from')
        year_to = data.get('year_to')
        label = data.get('label', '')
        if year_from is None or year_to is None:
            await safe_to_text(
                callback.message, MOVIE_LIST_MENU, reply_markup=movie_list_menu_keyboard()
            )
            return
        user_movies = await UserMovieRepository(session).get_filtered(
            UserMovieFilter(
                user_id=db_user.id,
                statuses=_ACTIVE_STATUSES,
                processing_status=ProcessingStatus.PROCESSED,
                year_from=year_from,
                year_to=year_to,
            )
        )
        back_cb = NavigationCallback(action=NavAction.movie_by_year).pack()
        await safe_to_text(
            callback.message,
            MOVIE_LIST_PERIOD_MOVIES.format(label=label),
            reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.period, back_cb),
        )

    elif source == MovieCardSource.recent:
        user_movies = await UserMovieRepository(session).get_recently_watched(db_user.id)
        back_cb = NavigationCallback(action=NavAction.movie_list).pack()
        if not user_movies:
            await safe_to_text(
                callback.message, MOVIE_LIST_RECENT_EMPTY, reply_markup=movie_list_menu_keyboard()
            )
            return
        await safe_to_text(
            callback.message,
            MOVIE_LIST_RECENT,
            reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.recent, back_cb),
        )

    elif source == MovieCardSource.added:
        user_movies = await UserMovieRepository(session).get_recently_added(db_user.id)
        back_cb = NavigationCallback(action=NavAction.movie_list).pack()
        if not user_movies:
            await safe_to_text(
                callback.message,
                MOVIE_LIST_RECENT_ADDED_EMPTY,
                reply_markup=movie_list_menu_keyboard(),
            )
            return
        await safe_to_text(
            callback.message,
            MOVIE_LIST_RECENT_ADDED,
            reply_markup=movie_buttons_keyboard(user_movies, MovieCardSource.added, back_cb),
        )

    elif source == MovieCardSource.all:
        await back_to_all_movies(callback.message, session, state, db_user)


# --- Watched ---


@router.callback_query(WatchedCallback.filter())
async def watched_handler(
    callback: CallbackQuery,
    callback_data: WatchedCallback,
    session: AsyncSession,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    await UserMovieRepository(session).mark_watched(db_user.id, callback_data.movie_id)
    await safe_to_text(
        callback.message,
        MOVIE_WATCHED_SUCCESS,
        reply_markup=rating_keyboard(callback_data.movie_id, callback_data.source),
    )


@router.callback_query(RatingCallback.filter())
async def rating_received(
    callback: CallbackQuery,
    callback_data: RatingCallback,
    session: AsyncSession,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    um = await UserMovieRepository(session).get_by_user_and_movie(
        db_user.id, callback_data.movie_id
    )
    if um is not None:
        await UserMovieRepository(session).update(um, {'rating': callback_data.rating})

    await safe_edit(
        callback.message,
        MOVIE_RATING_SAVED,
        reply_markup=share_message_keyboard(callback_data.movie_id, callback_data.source),
    )


# --- Delete from list ---


@router.callback_query(DeleteFromListCallback.filter())
async def delete_from_list_handler(
    callback: CallbackQuery,
    callback_data: DeleteFromListCallback,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    await safe_to_text(
        callback.message,
        MOVIE_DELETE_CONFIRM,
        reply_markup=delete_confirm_keyboard(callback_data.movie_id, callback_data.source),
    )


@router.callback_query(ConfirmDeleteCallback.filter())
async def confirm_delete_handler(
    callback: CallbackQuery,
    callback_data: ConfirmDeleteCallback,
    session: AsyncSession,
    state: FSMContext,
    db_user: User,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    um = await UserMovieRepository(session).get_by_user_and_movie(
        db_user.id, callback_data.movie_id
    )
    if um is not None:
        await UserMovieRepository(session).delete(um)

    await safe_to_text(
        callback.message,
        MOVIE_DELETE_SUCCESS,
        reply_markup=back_from_source_keyboard(callback_data.source),
    )


# --- Share ---


@router.callback_query(ShareCallback.filter())
async def share_handler(
    callback: CallbackQuery,
    callback_data: ShareCallback,
    bot: Bot,
) -> None:
    await callback.answer()
    if not isinstance(callback.message, Message):
        return

    me = await bot.get_me()
    link = f'https://t.me/{me.username}?start=movie_{callback_data.movie_id}'
    await safe_to_text(
        callback.message,
        MOVIE_SHARE_TEXT.format(link=link),
        reply_markup=share_message_keyboard(callback_data.movie_id, callback_data.source),
    )

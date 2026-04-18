from aiogram.fsm.state import State, StatesGroup


class BrowseStates(StatesGroup):
    genre_movies = State()
    period_movies = State()

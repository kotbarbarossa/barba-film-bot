from aiogram.fsm.state import State, StatesGroup


class AllMoviesStates(StatesGroup):
    browsing = State()
    filter_menu = State()
    entering_year_from = State()
    entering_year_to = State()
    entering_imdb_from = State()
    entering_imdb_to = State()
    entering_rating_from = State()
    entering_rating_to = State()

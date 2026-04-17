from aiogram.fsm.state import State, StatesGroup


class AddMovieStates(StatesGroup):
    waiting_for_title = State()

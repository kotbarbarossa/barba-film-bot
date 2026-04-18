from aiogram.fsm.state import State, StatesGroup


class AddMovieStates(StatesGroup):
    waiting_for_title = State()
    waiting_for_media_type = State()
    waiting_for_details = State()

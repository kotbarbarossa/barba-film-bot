from aiogram.filters.callback_data import CallbackData


class AllMoviesPageCallback(CallbackData, prefix='amp'):
    page: int


class AllMoviesFilterOpen(CallbackData, prefix='amfo'):
    pass


class AllMoviesFilterClose(CallbackData, prefix='amfc'):
    pass


class AllMoviesToggleStatus(CallbackData, prefix='amts'):
    value: str  # WatchStatus.value


class AllMoviesToggleMediaType(CallbackData, prefix='amtm'):
    value: str  # MediaType.value


class AllMoviesToggleCategory(CallbackData, prefix='amtc'):
    id: int


class AllMoviesToggleSort(CallbackData, prefix='amso'):
    value: str  # sort key


class AllMoviesFieldInput(CallbackData, prefix='amfi'):
    field: str  # 'year_from' | 'year_to' | 'imdb_from' | 'imdb_to' | 'rating_from' | 'rating_to'


class AllMoviesFieldClear(CallbackData, prefix='amfcl'):
    field: str


class AllMoviesCancelInput(CallbackData, prefix='amci'):
    pass


class AllMoviesNoop(CallbackData, prefix='amno'):
    pass

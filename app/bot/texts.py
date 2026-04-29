from app.core.version import VERSION

# --- Start ---

WELCOME = (
    'Привет, {name}!\n\n'
    'КиноКопилка — личный список фильмов и сериалов.\n'
    'Добавляй что хочешь посмотреть, отмечай просмотренное и делись с друзьями.\n'
    f'<i>Версия: {VERSION}</i>\n\n'
    'Выбери действие:'
)
MAIN_MENU = 'КиноКопилка — личный список фильмов и сериалов.\n\nВыбери действие:'

# --- Movie add flow ---

MOVIE_ADD_TITLE_PROMPT = 'Введи точное название фильма или сериала:'
MOVIE_ADD_TITLE_EMPTY = 'Название не может быть пустым. Попробуй ещё раз:'
MOVIE_ADD_MEDIA_TYPE_PROMPT = '<b>{title}</b>\n\nВыбери тип:'
MOVIE_ADD_YEAR_PROMPT = (
    '<b>{title}</b> · {media_type}\n\n'
    'Знаешь год выхода? Пришли его для точного поиска.\n'
    '<i>Например: 2008</i>'
)
MOVIE_ADD_YEAR_INVALID = 'Некорректный год. Введи 4-значный год (например 2008) или пропусти:'
MOVIE_ADD_DETAILS_PROMPT = (
    '<b>{title}</b> · {media_type}\n\n'
    'Если нужно уточнение — добавь детали.\n'
    '<i>Например: фильм с Томом Холтоном из 2000х</i>'
)
MOVIE_ADD_QUEUED = (
    '✅ <b>{title}</b> добавлен в обработку.\n\n'
    'Как только фильм будет найден — он появится в твоём списке.'
)
MOVIE_ADD_FOUND = '✅ <b>{title}</b> найден и добавлен в твой список.'

MOVIE_LIST_MENU = 'Мои фильмы. Выбери способ:'
MOVIE_LIST_GENRES = 'Выбери жанр:'
MOVIE_LIST_PERIODS = 'Выбери период:'
MOVIE_LIST_GENRE_MOVIES = 'Жанр: <b>{name}</b>'
MOVIE_LIST_PERIOD_MOVIES = 'Период: <b>{label}</b>'
MOVIE_LIST_NO_MOVIES = 'Нет фильмов в этой категории.'
MOVIE_LIST_RECENT_ADDED = 'Недавно добавленные фильмы:'
MOVIE_LIST_RECENT_ADDED_EMPTY = 'Ты ещё не добавил ни одного фильма.'
MOVIE_LIST_RECENT = 'Последние просмотренные фильмы:'
MOVIE_LIST_RECENT_EMPTY = 'Ты ещё не отметил ни одного фильма как просмотренный.'
MOVIE_RANDOM_EMPTY = 'У тебя нет обработанных фильмов для просмотра.'
MOVIE_WATCHED_SUCCESS = '✅ Отмечено как просмотренное!\n\nКак тебе фильм?'
MOVIE_RATING_SAVED = 'Оценка сохранена!'
MOVIE_SHARE_TEXT = (
    'Отправь эту ссылку тому, с кем хочешь поделиться фильмом — '
    'он сразу попадёт на страницу с этим фильмом и сможет добавить его в свой список:\n\n'
    '{link}'
)
MOVIE_ADD_TO_LIST_SUCCESS = '✅ Фильм добавлен в твой список!'
MOVIE_ALREADY_IN_LIST = 'Этот фильм уже есть в твоём списке.'
MOVIE_DELETE_CONFIRM = (
    'Фильм будет удалён из вашего списка фильмов, а также будут удалены ваш статус просмотра, '
    'рейтинг и прочие данные, связанные с этим фильмом.\n\nУдалить?'
)
MOVIE_DELETE_SUCCESS = '🗑 Фильм удалён из вашего списка.'

# --- All movies ---

ALL_MOVIES_LIST_TITLE = 'Все мои фильмы'
ALL_MOVIES_EMPTY = 'Нет фильмов по выбранным фильтрам.'
ALL_MOVIES_FILTER_TITLE = 'Фильтры'
ALL_MOVIES_INPUT_YEAR_FROM = 'Введи год от (например 1990):'
ALL_MOVIES_INPUT_YEAR_TO = 'Введи год до (например 2024):'
ALL_MOVIES_INPUT_IMDB_FROM = 'Введи минимальный IMDB рейтинг (например 7.5):'
ALL_MOVIES_INPUT_IMDB_TO = 'Введи максимальный IMDB рейтинг (например 10):'
ALL_MOVIES_INPUT_RATING_FROM = 'Введи минимальную мою оценку (1–10):'
ALL_MOVIES_INPUT_RATING_TO = 'Введи максимальную мою оценку (1–10):'

# --- Buttons ---

BTN_MOVIE_LIST = 'Мои фильмы'
BTN_MOVIE_ADD = 'Добавить фильм'
BTN_FILM = '🎬 Фильм'
BTN_SERIES = '📺 Сериал'
BTN_SKIP_YEAR = 'Не знаю → продолжить'
BTN_SKIP = 'Пропустить →'
BTN_BACK = '← Назад'
BTN_MOVIE_RANDOM = '🎲 Наугад'
BTN_MOVIE_BY_GENRE = '🎭 По жанру'
BTN_MOVIE_BY_YEAR = '📅 По годам'
BTN_MOVIE_RECENT_ADDED = '🆕 Недавно добавленные'
BTN_MOVIE_RECENT = '✅ Недавно просмотренные'
BTN_MOVIE_ALL = '📋 Все мои фильмы'
BTN_WATCHED = '🍿 Посмотрел'
BTN_SHARE = '🔗 Поделиться'
BTN_DELETE_FROM_LIST = '🗑 Удалить из списка'
BTN_DELETE_CONFIRM = '🗑 Удалить'
BTN_ADD_TO_LIST = '➕ Добавить в список просмотра'
BTN_MAIN_MENU = '🏠 На главную'

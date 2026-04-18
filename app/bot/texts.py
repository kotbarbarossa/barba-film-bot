# --- Start ---

WELCOME = 'Привет, {name}! Выбери действие:'
MAIN_MENU = 'Выбери действие:'

# --- Movie add flow ---

MOVIE_ADD_TITLE_PROMPT = 'Введи точное название фильма или сериала:'
MOVIE_ADD_TITLE_EMPTY = 'Название не может быть пустым. Попробуй ещё раз:'
MOVIE_ADD_MEDIA_TYPE_PROMPT = '<b>{title}</b>\n\nВыбери тип:'
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
MOVIE_LIST_RECENT = 'Последние просмотренные фильмы:'
MOVIE_LIST_RECENT_EMPTY = 'Ты ещё не отметил ни одного фильма как просмотренный.'
MOVIE_LIST_ALL_STUB = 'Все мои фильмы — скоро здесь'
MOVIE_RANDOM_EMPTY = 'У тебя нет обработанных фильмов для просмотра.'
MOVIE_WATCHED_STUB = '✅ Функция в разработке.'

# --- Buttons ---

BTN_MOVIE_LIST = 'Мои фильмы'
BTN_MOVIE_ADD = 'Добавить фильм'
BTN_FILM = '🎬 Фильм'
BTN_SERIES = '📺 Сериал'
BTN_SKIP = 'Пропустить →'
BTN_BACK = '← Назад'
BTN_MOVIE_RANDOM = '🎲 Наугад'
BTN_MOVIE_BY_GENRE = '🎭 По жанру'
BTN_MOVIE_BY_YEAR = '📅 По годам'
BTN_MOVIE_RECENT = '✅ Недавно просмотренные'
BTN_MOVIE_ALL = '📋 Все мои фильмы'
BTN_WATCHED = '✅ Посмотрел'

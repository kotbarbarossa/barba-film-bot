import type { Translations } from './ru';

const en: Translations = {
  tabs: {
    home: 'Home',
    movies: 'Movies',
    charts: 'Charts',
    profile: 'Profile',
  },

  home: {
    title: 'Flickbook',
    empty_title: 'Collection empty',
    empty_body: 'Add your first movie — your shelves, stats, and Random button will appear here',
    add_movie: '+ Add movie',
    see_charts: '🔥 See charts',
    random: '🎲 Random',
    random_sub: 'one of {{count}} movies in your list',
    all_mine: 'All mine',
    charts: 'Charts',
    seven_collections: '7 lists',
    movies_count_sub: '{{count}} movies',
    recently_added: 'Recently added',
    recently_watched: 'Recently watched',
  },

  poster: {
    placeholder: 'POSTER',
    pending_compact: 'PROC.',
    pending_full: 'processing',
    missing: 'not found',
  },

  movies: {
    title: 'My movies',
    in_collection: '{{count}} in collection',
    tab_all: 'All · {{count}}',
    tab_want: 'Want · {{count}}',
    tab_watched: 'Watched · {{count}}',
    type_film: 'FILM',
    type_series: 'SERIES',
    processing: '⌛ processing…',
    not_found_label: '⚠ not found',
    search_placeholder: 'Search by title...',
    nothing_found: 'Nothing found',
    reset_filters: 'reset filters',
    empty_collection: 'Collection empty — add your first movie',
  },

  add: {
    back: '← back',
    header_action: 'add',
    title: 'New movie',
    subtitle: 'just the title — the rest is optional',
    name_label: 'TITLE *',
    name_placeholder: 'Movie or series title',
    type_label: 'TYPE',
    film: '🎬 Film',
    series: '📺 Series',
    year_label: 'YEAR',
    optional: 'optional',
    hint_label: 'HINT',
    hint_placeholder: '«Soviet cartoon», «with De Niro»…',
    toast_found_title: '✓ Movie found and added',
    toast_pending_title: '✓ Added for processing',
    toast_found_sub: 'Movie added to your collection',
    toast_pending_sub: 'Movie details will appear in your list soon',
    searching: 'Searching…',
    submit: 'Find and add',
    alert_title: 'Enter title',
    alert_body: 'Enter a movie or series title',
    error: 'Error',
    error_body: "Couldn't find the movie. Try a more specific title.",
  },

  auth: {
    tagline: 'What shall we watch?',
    subtitle: 'sign in to start your collection',
    google: 'G  Sign in with Google',
    loading: 'Loading…',
    error: 'Error',
    google_error: "Couldn't sign in with Google. Try again.",
    apple_error: "Couldn't sign in with Apple. Try again.",
    terms: 'By signing in, you accept the terms of use',
    telegram_app_name: 'Flickbook',
    telegram_subtitle: 'sign in via Telegram',
    phone_label: 'PHONE NUMBER',
    phone_hint: "You'll receive a Telegram message with a confirmation code.",
    get_code: 'Get code',
    code_label: 'CODE FROM TELEGRAM',
    change_phone: '← change number',
    resend: 'resend (0:42)',
    sign_in: 'Sign in',
  },

  movie: {
    my_rating: 'MY RATING',
    edit: 'edit',
    description: 'DESCRIPTION',
    cast: 'cast: ',
    director: 'director: ',
    rewatch: 'Rewatched',
    watched: '✓ Watched',
    delete_title: 'Remove from list?',
    delete_body: '«{{title}}» will be removed from your list.',
    cancel: 'Cancel',
    delete: 'Remove',
    error: 'Error',
    delete_error: "Couldn't remove the movie",
    update_error: "Couldn't update status",
    min: 'MIN',
    pending_you_added: 'you added',
    pending_searching: 'searching for info…',
    pending_body: 'pulling poster, year, genres and description from open databases. usually takes under 10 seconds.',
    pending_close: "you can close this screen —\nit'll appear in your list once ready",
    missing_you_searched: 'you searched for',
    missing_title: 'nothing found',
    missing_body: "no matches in any database.\nlikely a typo or the movie is very rare.",
    missing_hint: "check the title — you might want to\ndelete and add again",
    delete_action: '🗑 delete',
    back: '← back',
  },

  filters: {
    title: 'Filters',
    reset: 'reset',
    status: 'Status',
    all: 'All',
    want: 'Want',
    watched: 'Watched',
    type: 'Type',
    films: 'Films',
    series: 'Series',
    genre: 'Genre',
    any: 'Any',
    year: 'Year',
    before_1990: 'before 1990',
    nineties: '90s',
    noughties: '00s',
    tens: '10s',
    rating_section: 'Rating',
    only_rated: 'Only rated',
    sort: 'Sort',
    year_desc: 'Year ⬇️',
    rating_desc: 'My rating ⬇️',
    added_desc: 'Added ⬇️',
    watched_first: 'Watched ⬇️',
    apply: 'Apply',
  },

  charts: {
    title: '🔥 Charts',
    subtitle: 'community charts — same for everyone',
    back: '← charts',
    updated_today: 'updated today',
    ratings_count_short: '{{count}} rat.',
    score_users: '{{count}} users',
    score_views: '{{count}} views',
    score_viewers_short: '{{count}} viewers',
    score_days: '{{count}}d',
    score_less_1_day: '< 1 day',
    score_stddev: '±{{value}} spread',
    empty_title: 'Chart is empty',
    empty_body: 'More user data is needed. Check back in a few days — the chart updates automatically.',
    back_to_charts: '← To charts',
    in_chart: 'IN CHART',
    our_rating: 'OUR RATING',
    global_trending_title: 'Hot ten',
    global_trending_sub: 'recent watches affect the score',
    top_rated_title: 'Top10 rated',
    top_rated_sub: 'highest average user ratings',
    top_want_title: 'Top10 most wanted',
    top_want_sub: 'most often added to watchlist recently',
    top_watched_title: 'Top10 watched',
    top_watched_sub: 'most watched and rewatched',
    top_controversial_title: 'Top10 controversial',
    top_controversial_sub: 'highest spread of ratings',
    top_quick_title: 'Top10 instant watches',
    top_quick_sub: 'added and watched without delay',
    top_postponed_title: 'Movie graveyard',
    top_postponed_sub: 'in many wishlists, but nobody watches',
  },

  profile: {
    title: 'Profile',
    edit: 'edit',
    watched_label: 'watched',
    want_label: 'want',
    total_label: 'total',
    settings: 'SETTINGS',
    theme: 'Theme',
    theme_dark: 'dark',
    theme_light: 'light',
    language: 'Language',
    language_ru: 'Russian',
    language_en: 'English',
    notifications: 'Notifications',
    notif_on: 'on',
    notif_off: 'off',
    about: 'ABOUT',
    rate_app: 'Rate the app',
    policy: 'Privacy & Terms',
    policy_title: 'Privacy & Terms',
    policy_ok: 'Got it',
    policy_content: `FLICKBOOK — PRIVACY POLICY

Last updated: May 2025

─────────────────────────

1. WHAT WE COLLECT

The app collects only what is needed to operate:

• Account data — name and email provided when signing in via Google or Apple.
• Your collection — movies, watch statuses, personal ratings.
• App settings — chosen language and theme.

─────────────────────────

2. HOW WE USE YOUR DATA

Solely to operate the service: storing your collection, syncing across devices, and displaying your personalized interface. We do not analyse your data for marketing purposes.

─────────────────────────

3. SHARING WITH THIRD PARTIES

We do not sell, rent, or share your data with advertising networks, data brokers, or third parties.

Data may be shared with technical partners (hosting, infrastructure) solely to keep the service running, under strict confidentiality obligations.

─────────────────────────

4. SIGN IN WITH GOOGLE / APPLE

When signing in via Google or Apple we receive only the data you explicitly allow: your name and email address. Passwords are never shared with us.

─────────────────────────

5. NOTIFICATIONS

Push notifications are sent only with your explicit consent. Permission can be revoked at any time in device settings or from the Profile section.

─────────────────────────

6. DELETING YOUR DATA

You can delete your account and all associated data in Profile → "Delete account". Deleted data cannot be recovered.

─────────────────────────

7. CHILDREN

The app is not intended for children under 13. We do not knowingly collect data from children.

─────────────────────────

8. POLICY CHANGES

We will notify you of significant changes through the app. The current version is always available in Profile → Privacy & Terms.

─────────────────────────

CONTACT

Privacy questions: ultra.kot.dev@gmail.com`,
    sign_out: 'Sign out',
    delete_account: 'delete account',
    app_name: 'FLICKBOOK',
    app_version: 'v1.0.0',
    edit_title: 'Edit profile',
    first_name_label: 'FIRST NAME',
    first_name_placeholder: 'First name',
    last_name_label: 'LAST NAME',
    last_name_placeholder: 'Last name',
    username_label: 'USERNAME',
    saving: 'Saving…',
    save: 'Save',
    cancel: 'Cancel',
    logout_title: 'Sign out?',
    logout_body: "Your collection stays in the cloud —\nsign back in and it'll be there.",
    movies_count: '{{count}} movies',
    logout_confirm: 'Yes, sign out',
    user_default: 'User',
    since: 'Since {{date}}',
  },

  status: {
    want: 'Want',
    watching: 'Watching',
    watched: 'Watched',
    dropped: 'Dropped',
  },

  rating: {
    question: 'How was the movie?',
    no_rating: 'no rating',
    save: '✓ Save',
    skip_hint: "you can skip the rating — we'll save the fact you watched it",
    masterpiece: 'masterpiece',
    excellent: 'excellent',
    great: 'great',
    fine: 'fine',
    meh: 'meh',
    bad: 'bad',
    error: 'Error',
    save_error: "Couldn't save the rating",
  },

  chart_movie: {
    back_to_chart: '← to chart',
    min: 'MIN',
    description: 'DESCRIPTION',
    director: 'director: ',
    cast: 'cast: ',
    in_list: '✓ In list — open my card',
    add_to_watchlist: '+ Add to watchlist',
    adding: 'Adding…',
    error: 'Error',
    error_body: "Couldn't add the movie",
  },

  share: {
    title: 'Share movie',
    hint: 'recipient opens the movie in the app or downloads it',
    button: 'Share',
    sharing: '…',
    branding: '🎬 Flickbook',
    my_rating: 'my rating',
  },

  empty: {
    movies_title: 'Nothing here yet',
    movies_body: 'add your first movie — all your watchlist picks will appear here',
    add_movie: '+ Add movie',
    see_charts: '🔥 See charts',
    can_add: 'you can add:',
    can_add_methods: '• by title  • by Kinopoisk/IMDb link',
    filter_title: 'Nothing found',
    filter_body: 'No movies in your collection match the current filters. Try loosening the conditions or resetting.',
    reset_filters: 'Reset filters',
    change_filters: '↩  Change',
  },
};

export default en;

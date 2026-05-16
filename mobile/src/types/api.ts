// Mirrors backend Pydantic schemas exactly

export type MediaType = 'film' | 'series';
export type WatchStatus = 'want' | 'watching' | 'watched' | 'dropped';
export type ProcessingStatus = 'pending' | 'processed' | 'unrecognized';
export type RoleType = 'actor' | 'director' | 'writer';

export type ChartSlug =
  | 'global-trending'
  | 'top-rated'
  | 'top-want'
  | 'top-watched'
  | 'top-controversial'
  | 'top-quick'
  | 'top-postponed';

// --- Auth ---

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  user_id: number;
}

// --- Categories ---

export interface CategoryResponse {
  id: number;
  name: string;
  name_original: string | null;
}

// --- Persons ---

export interface PersonResponse {
  id: number;
  name: string;
  original_name: string | null;
  photo_url: string | null;
  birth_date: string | null;
  country: string | null;
}

export interface PersonInMovieResponse {
  role_type: RoleType;
  character_name: string | null;
  person: PersonResponse;
}

// --- Movies ---

export interface MovieListResponse {
  id: number;
  user_query: string | null;
  processing_status: ProcessingStatus;
  title_original: string | null;
  title_ru: string | null;
  year: number | null;
  media_type: MediaType | null;
  duration_minutes: number | null;
  age_rating: string | null;
  country: string | null;
  poster_url: string | null;
  poster_url_original: string | null;
  imdb_id: string | null;
  imdb_rating: number | null;
  kp_id: string | null;
  kinopoisk_rating: number | null;
  tmdb_id: string | null;
  tmdb_rating: number | null;
  description: string | null;
  description_original: string | null;
}

export interface MovieDetailResponse extends MovieListResponse {
  trailer_url: string | null;
  categories: CategoryResponse[];
  persons: PersonInMovieResponse[];
}

// --- User Movies ---

export interface UserMovieAddByTitle {
  title: string;
  media_type: MediaType;
  user_query?: string;
  year?: number;
}

export interface UserMovieUpdate {
  status?: WatchStatus;
  rating?: number | null;
  note?: string | null;
  is_favorite?: boolean;
  rewatch_count?: number;
  watched_at?: string | null;
}

export interface UserMovieBase {
  id: number;
  status: WatchStatus;
  rating: number | null;
  is_favorite: boolean;
  added_at: string;
}

export interface UserMovieListResponse extends UserMovieBase {
  movie: MovieListResponse;
}

export interface UserMovieDetailResponse extends UserMovieBase {
  note: string | null;
  rewatch_count: number;
  watched_at: string | null;
  updated_at: string;
  movie: MovieDetailResponse;
}

export interface UserMovieFilters {
  status?: WatchStatus;
  is_favorite?: boolean;
  search?: string;
  year_from?: number;
  year_to?: number;
  category_id?: number;
}

// --- User profile ---

export type AuthProvider = 'telegram' | 'google' | 'apple';

export interface UserAuthProviderResponse {
  provider: AuthProvider;
  created_at: string;
}

export interface UserDetailResponse {
  id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  auth_providers: UserAuthProviderResponse[];
}

// --- Discovery ---

export interface ChartEntry {
  movie_id: number;
  title_ru: string | null;
  title_original: string | null;
  poster_url: string | null;
  poster_url_original: string | null;
  year: number | null;
  media_type: MediaType | null;
  watch_count: number;
  score: number;
  imdb_rating: number | null;
  avg_rating: number | null;
}

export interface ChartResponse {
  entries: ChartEntry[];
}

export interface GlobalTrendingResponse {
  entries: ChartEntry[];
  is_trending: boolean;
  min_count_used: number;
}

export interface MovieChartPosition {
  chart_slug: ChartSlug;
  rank: number;
}

export interface MovieChartsResponse {
  positions: MovieChartPosition[];
}


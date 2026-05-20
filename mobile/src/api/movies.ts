import { apiClient } from './client';
import type {
  CategoryResponse,
  MovieDetailResponse,
  UserMovieAddByTitle,
  UserMovieDetailResponse,
  UserMovieFilters,
  UserMovieListResponse,
  UserMovieUpdate,
} from '@/types/api';

export async function getMyMovies(
  userId: number,
  filters: UserMovieFilters = {},
): Promise<UserMovieListResponse[]> {
  const { data } = await apiClient.get<UserMovieListResponse[]>(`/users/${userId}/movies`, {
    params: {
      status: filters.status,
      is_favorite: filters.is_favorite,
      search: filters.search,
      year_from: filters.year_from,
      year_to: filters.year_to,
      category_id: filters.category_id,
      sort_by: filters.sort_by,
      limit: filters.limit,
      offset: filters.offset,
    },
  });
  return data;
}

export async function getMovie(movieId: number): Promise<MovieDetailResponse> {
  const { data } = await apiClient.get<MovieDetailResponse>(`/movies/${movieId}`);
  return data;
}

export async function getMyMovie(
  userId: number,
  movieId: number,
): Promise<UserMovieDetailResponse> {
  const { data } = await apiClient.get<UserMovieDetailResponse>(
    `/users/${userId}/movies/${movieId}`,
  );
  return data;
}

export async function addMovie(
  userId: number,
  payload: UserMovieAddByTitle,
): Promise<UserMovieDetailResponse> {
  const { data } = await apiClient.post<UserMovieDetailResponse>(
    `/users/${userId}/movies`,
    payload,
  );
  return data;
}

export async function updateMovie(
  userId: number,
  movieId: number,
  payload: UserMovieUpdate,
): Promise<UserMovieDetailResponse> {
  const { data } = await apiClient.put<UserMovieDetailResponse>(
    `/users/${userId}/movies/${movieId}`,
    payload,
  );
  return data;
}

export async function markWatched(
  userId: number,
  movieId: number,
): Promise<UserMovieDetailResponse> {
  const { data } = await apiClient.post<UserMovieDetailResponse>(
    `/users/${userId}/movies/${movieId}/watched`,
  );
  return data;
}

export async function deleteMovie(userId: number, movieId: number): Promise<void> {
  await apiClient.delete(`/users/${userId}/movies/${movieId}`);
}

export async function getCategories(): Promise<CategoryResponse[]> {
  const { data } = await apiClient.get<CategoryResponse[]>('/categories');
  return data;
}

export async function getMyCategories(userId: number): Promise<CategoryResponse[]> {
  const { data } = await apiClient.get<CategoryResponse[]>(`/users/${userId}/movies/categories`);
  return data;
}

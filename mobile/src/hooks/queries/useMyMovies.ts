import { useQuery } from '@tanstack/react-query';

import { getMyMovies } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';
import type { UserMovieFilters, UserMovieListResponse } from '@/types/api';

export const myMoviesKeys = {
  all: (userId: number) => ['myMovies', userId] as const,
  filtered: (userId: number, filters: UserMovieFilters) =>
    ['myMovies', userId, filters] as const,
};

function hasPendingMovies(data: unknown): boolean {
  return (data as UserMovieListResponse[] | undefined)
    ?.some(m => m.movie.processing_status === 'pending') ?? false;
}

export function useMyMovies(filters: UserMovieFilters = {}) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: myMoviesKeys.filtered(userId!, filters),
    queryFn: () => getMyMovies(userId!, filters),
    enabled: userId != null,
    staleTime: (query) => hasPendingMovies(query.state.data) ? 0 : 1000 * 60,
    refetchInterval: (query) => hasPendingMovies(query.state.data) ? 8000 : false,
  });
}

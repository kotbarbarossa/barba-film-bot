import { useQuery } from '@tanstack/react-query';

import { getMyMovies } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';
import type { UserMovieFilters } from '@/types/api';

export const myMoviesKeys = {
  all: (userId: number) => ['myMovies', userId] as const,
  filtered: (userId: number, filters: UserMovieFilters) =>
    ['myMovies', userId, filters] as const,
};

export function useMyMovies(filters: UserMovieFilters = {}) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: myMoviesKeys.filtered(userId!, filters),
    queryFn: () => getMyMovies(userId!, filters),
    enabled: userId != null,
    staleTime: 1000 * 60,
  });
}

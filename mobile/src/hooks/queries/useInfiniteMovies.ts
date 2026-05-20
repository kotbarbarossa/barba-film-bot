import { useInfiniteQuery } from '@tanstack/react-query';

import { getMyMovies } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';
import type { UserMovieFilters, UserMovieListResponse } from '@/types/api';

export const PAGE_SIZE = 30;

export const infiniteMoviesKeys = {
  all: (userId: number) => ['infiniteMovies', userId] as const,
  filtered: (userId: number, filters: UserMovieFilters) =>
    ['infiniteMovies', userId, filters] as const,
};

function hasPendingMovies(pages: UserMovieListResponse[][]): boolean {
  return pages.flat().some(m => m.movie.processing_status === 'pending');
}

export function useInfiniteMovies(filters: UserMovieFilters = {}) {
  const userId = useAuthStore((s) => s.userId);

  return useInfiniteQuery({
    queryKey: infiniteMoviesKeys.filtered(userId!, filters),
    queryFn: ({ pageParam }) =>
      getMyMovies(userId!, { ...filters, limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length === PAGE_SIZE ? allPages.flat().length : undefined,
    enabled: userId != null,
    staleTime: (query) =>
      hasPendingMovies(query.state.data?.pages ?? []) ? 0 : 1000 * 60,
    refetchInterval: (query) =>
      hasPendingMovies(query.state.data?.pages ?? []) ? 8000 : false,
  });
}

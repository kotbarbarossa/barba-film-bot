import { useQuery } from '@tanstack/react-query';

import { getMovie, getMyMovie } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';

export const movieKeys = {
  detail: (userId: number, movieId: number) => ['movie', userId, movieId] as const,
  public: (movieId: number) => ['publicMovie', movieId] as const,
};

export function usePublicMovie(movieId: number) {
  return useQuery({
    queryKey: movieKeys.public(movieId),
    queryFn: () => getMovie(movieId),
    enabled: movieId > 0,
    staleTime: 1000 * 60 * 10,
  });
}

export function useMovie(movieId: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: movieKeys.detail(userId!, movieId),
    queryFn: () => getMyMovie(userId!, movieId),
    enabled: userId != null && movieId > 0,
    staleTime: (query) =>
      (query.state.data as { movie?: { processing_status?: string } } | undefined)
        ?.movie?.processing_status === 'pending'
        ? 0
        : 1000 * 60 * 5,
    refetchInterval: (query) =>
      (query.state.data as { movie?: { processing_status?: string } } | undefined)
        ?.movie?.processing_status === 'pending'
        ? 8000
        : false,
  });
}

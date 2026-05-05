import { useQuery } from '@tanstack/react-query';

import { getMyMovie } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';

export const movieKeys = {
  detail: (userId: number, movieId: number) => ['movie', userId, movieId] as const,
};

export function useMovie(movieId: number) {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: movieKeys.detail(userId!, movieId),
    queryFn: () => getMyMovie(userId!, movieId),
    enabled: userId != null && movieId > 0,
    staleTime: 1000 * 60 * 5,
  });
}

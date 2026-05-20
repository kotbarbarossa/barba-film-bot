import { useMutation, useQueryClient } from '@tanstack/react-query';

import { markWatched, updateMovie } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';
import type { UserMovieUpdate } from '@/types/api';

import { infiniteMoviesKeys } from '../queries/useInfiniteMovies';
import { myMoviesKeys } from '../queries/useMyMovies';
import { movieKeys } from '../queries/useMovie';

export function useUpdateMovie(movieId: number) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (payload: UserMovieUpdate) => updateMovie(userId!, movieId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movieKeys.detail(userId!, movieId) });
      queryClient.invalidateQueries({ queryKey: myMoviesKeys.all(userId!) });
      queryClient.invalidateQueries({ queryKey: infiniteMoviesKeys.all(userId!) });
    },
  });
}

export function useMarkWatched(movieId: number) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: () => markWatched(userId!, movieId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: movieKeys.detail(userId!, movieId) });
      queryClient.invalidateQueries({ queryKey: myMoviesKeys.all(userId!) });
      queryClient.invalidateQueries({ queryKey: infiniteMoviesKeys.all(userId!) });
    },
  });
}

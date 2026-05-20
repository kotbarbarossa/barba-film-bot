import { useMutation, useQueryClient } from '@tanstack/react-query';

import { addMovie } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';
import type { UserMovieAddByTitle } from '@/types/api';

import { infiniteMoviesKeys } from '../queries/useInfiniteMovies';
import { myMoviesKeys } from '../queries/useMyMovies';

export function useAddMovie() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (payload: UserMovieAddByTitle) => addMovie(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myMoviesKeys.all(userId!) });
      queryClient.invalidateQueries({ queryKey: infiniteMoviesKeys.all(userId!) });
    },
  });
}

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteMovie } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';

import { myMoviesKeys } from '../queries/useMyMovies';
import { movieKeys } from '../queries/useMovie';

export function useDeleteMovie() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (movieId: number) => deleteMovie(userId!, movieId),
    onSuccess: (_data, movieId) => {
      queryClient.invalidateQueries({ queryKey: myMoviesKeys.all(userId!) });
      queryClient.removeQueries({ queryKey: movieKeys.detail(userId!, movieId) });
    },
  });
}

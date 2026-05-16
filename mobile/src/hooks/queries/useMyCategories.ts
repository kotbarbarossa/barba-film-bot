import { useQuery } from '@tanstack/react-query';

import { getMyCategories } from '@/api/movies';
import { useAuthStore } from '@/store/auth.store';

export function useMyCategories() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ['myCategories', userId],
    queryFn: () => getMyCategories(userId!),
    enabled: userId != null,
    staleTime: 1000 * 60 * 5,
  });
}

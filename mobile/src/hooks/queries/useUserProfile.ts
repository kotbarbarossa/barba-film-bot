import { useQuery } from '@tanstack/react-query';

import { getUserProfile } from '@/api/user';
import { useAuthStore } from '@/store/auth.store';

export function useUserProfile() {
  const userId = useAuthStore((s) => s.userId);

  return useQuery({
    queryKey: ['userProfile', userId],
    queryFn: () => getUserProfile(userId!),
    enabled: userId != null,
    staleTime: 1000 * 60 * 5,
  });
}

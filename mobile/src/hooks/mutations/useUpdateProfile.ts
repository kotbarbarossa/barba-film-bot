import { useMutation, useQueryClient } from '@tanstack/react-query';

import { updateUserProfile } from '@/api/user';
import { useAuthStore } from '@/store/auth.store';
import type { UserProfileUpdate } from '@/api/user';

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.userId);

  return useMutation({
    mutationFn: (payload: UserProfileUpdate) => updateUserProfile(userId!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userProfile', userId] });
    },
  });
}

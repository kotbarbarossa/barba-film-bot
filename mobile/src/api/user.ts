import { apiClient } from './client';
import type { UserDetailResponse } from '@/types/api';

export async function getUserProfile(userId: number): Promise<UserDetailResponse> {
  const { data } = await apiClient.get<UserDetailResponse>(`/users/${userId}`);
  return data;
}

export interface UserProfileUpdate {
  username: string | null;
  first_name: string | null;
  last_name: string | null;
}

export async function updateUserProfile(userId: number, payload: UserProfileUpdate): Promise<UserDetailResponse> {
  const { data } = await apiClient.put<UserDetailResponse>(`/users/${userId}`, payload);
  return data;
}

import axios from 'axios';

import { API_URL } from '@/constants/env';
import type { TokenResponse } from '@/types/api';

const authClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export async function loginWithGoogle(idToken: string): Promise<TokenResponse> {
  const { data } = await authClient.post<TokenResponse>('/auth/google', { id_token: idToken });
  return data;
}

export async function loginWithApple(
  idToken: string,
  firstName?: string | null,
  lastName?: string | null,
): Promise<TokenResponse> {
  const { data } = await authClient.post<TokenResponse>('/auth/apple', {
    id_token: idToken,
    first_name: firstName,
    last_name: lastName,
  });
  return data;
}

export async function refreshTokens(refreshToken: string): Promise<TokenResponse> {
  const { data } = await authClient.post<TokenResponse>('/auth/refresh', {
    refresh_token: refreshToken,
  });
  return data;
}

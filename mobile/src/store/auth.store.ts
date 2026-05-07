import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const KEYS = {
  accessToken: 'access_token',
  refreshToken: 'refresh_token',
  userId: 'user_id',
} as const;

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  userId: number | null;
  isReady: boolean;
}

interface AuthActions {
  loadFromStorage: () => Promise<void>;
  signIn: (tokens: { accessToken: string; refreshToken: string; userId: number }) => Promise<void>;
  signOut: () => Promise<void>;
  setAccessToken: (token: string) => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  accessToken: null,
  refreshToken: null,
  userId: null,
  isReady: false,

  loadFromStorage: async () => {
    const [accessToken, refreshToken, userIdStr] = await Promise.all([
      SecureStore.getItemAsync(KEYS.accessToken),
      SecureStore.getItemAsync(KEYS.refreshToken),
      SecureStore.getItemAsync(KEYS.userId),
    ]);
    set({
      accessToken,
      refreshToken,
      userId: userIdStr ? parseInt(userIdStr, 10) : null,
      isReady: true,
    });
  },

  signIn: async ({ accessToken, refreshToken, userId }) => {
    await Promise.all([
      SecureStore.setItemAsync(KEYS.accessToken, accessToken),
      SecureStore.setItemAsync(KEYS.refreshToken, refreshToken),
      SecureStore.setItemAsync(KEYS.userId, String(userId)),
    ]);
    set({ accessToken, refreshToken, userId });
  },

  signOut: async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(KEYS.accessToken),
      SecureStore.deleteItemAsync(KEYS.refreshToken),
      SecureStore.deleteItemAsync(KEYS.userId),
    ]);
    set({ accessToken: null, refreshToken: null, userId: null });
  },

  setAccessToken: (token) => {
    SecureStore.setItemAsync(KEYS.accessToken, token);
    set({ accessToken: token });
  },
}));

import * as SecureStore from 'expo-secure-store';
import * as Localization from 'expo-localization';
import { create } from 'zustand';
import i18n from '@/i18n';

export type Language = 'ru' | 'en';

interface SettingsState {
  language: Language;
  isSettingsReady: boolean;
}

interface SettingsActions {
  loadSettings: () => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
}

function getDefaultLanguage(): Language {
  const tag = Localization.getLocales()[0]?.languageCode ?? 'en';
  return tag.startsWith('ru') ? 'ru' : 'en';
}

export const useSettingsStore = create<SettingsState & SettingsActions>((set) => ({
  language: 'ru',
  isSettingsReady: false,

  loadSettings: async () => {
    const stored = await SecureStore.getItemAsync('app_language');
    const language = (stored as Language | null) ?? getDefaultLanguage();
    await i18n.changeLanguage(language);
    set({ language, isSettingsReady: true });
  },

  setLanguage: async (language) => {
    await SecureStore.setItemAsync('app_language', language);
    await i18n.changeLanguage(language);
    set({ language });
  },
}));

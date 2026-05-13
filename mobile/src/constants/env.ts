import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function getApiUrl(): string {
  if (extra.apiUrl) return extra.apiUrl;
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:8000/api/v1`;
    }
  }
  return 'http://localhost:8000/api/v1';
}

export const API_URL = getApiUrl();

// Base server URL without /api/v1 — used for share deep-link pages
export const SHARE_BASE_URL = API_URL.replace(/\/api\/v1\/?$/, '');
export const GOOGLE_CLIENT_ID: string = extra.googleClientId ?? '';
export const GOOGLE_CLIENT_ID_WEB: string = extra.googleClientIdWeb ?? '';

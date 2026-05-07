import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

function getApiUrl(): string {
  if (__DEV__) {
    const hostUri = Constants.expoConfig?.hostUri;
    if (hostUri) {
      const host = hostUri.split(':')[0];
      return `http://${host}:8000/api/v1`;
    }
  }
  return extra.apiUrl ?? 'http://localhost:8000/api/v1';
}

export const API_URL = getApiUrl();
export const GOOGLE_CLIENT_ID: string = extra.googleClientId ?? '';
export const GOOGLE_CLIENT_ID_ANDROID: string = extra.googleClientIdAndroid ?? '';
export const GOOGLE_CLIENT_ID_WEB: string = extra.googleClientIdWeb ?? '';

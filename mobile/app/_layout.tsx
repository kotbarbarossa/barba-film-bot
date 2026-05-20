import '@/i18n';
import { Neucha_400Regular } from '@expo-google-fonts/neucha';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Nunito_400Regular, Nunito_700Bold, Nunito_400Regular_Italic } from '@expo-google-fonts/nunito';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '@/lib/queryClient';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { KeyboardProvider } from 'react-native-keyboard-controller';

import { ThemeProvider } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Neucha':         Neucha_400Regular,
    'Nunito':         Nunito_400Regular,
    'Nunito-Bold':    Nunito_700Bold,
    'Nunito-Italic':  Nunito_400Regular_Italic,
    'JetBrainsMono':  JetBrainsMono_400Regular,
  });

  const { loadFromStorage, isReady, accessToken } = useAuthStore();
  const { loadSettings, isSettingsReady } = useSettingsStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadFromStorage();
    loadSettings();
  }, []);

  useEffect(() => {
    if (!isReady || !isSettingsReady || !fontsLoaded) return;

    const inAuth = (segments[0] as string) === 'auth';
    if (!accessToken && !inAuth) {
      router.replace('/auth' as any);
    } else if (accessToken && inAuth) {
      router.replace('/');
    }
  }, [isReady, isSettingsReady, fontsLoaded, accessToken, segments]);

  const inAuth = (segments[0] as string) === 'auth';
  const needsRedirect =
    isReady && isSettingsReady && fontsLoaded && ((!accessToken && !inAuth) || (!!accessToken && inAuth));
  const canShow = isReady && isSettingsReady && fontsLoaded && !needsRedirect;

  useEffect(() => {
    if (canShow) SplashScreen.hideAsync();
  }, [canShow]);

  if (!canShow) return null;

  return (
    <ThemeProvider>
      <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
        <SafeAreaProvider>
          <KeyboardProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="auth" />
            <Stack.Screen name="add" />
            <Stack.Screen name="filters"          options={{ presentation: 'modal' }} />
            <Stack.Screen name="rate"             options={{ presentation: 'modal' }} />
            <Stack.Screen name="share"            options={{ presentation: 'modal' }} />
            <Stack.Screen name="charts/[id]" />
            <Stack.Screen name="movie/[id]" />
            <Stack.Screen name="share/movie/[id]" />
            <Stack.Screen name="movie-from-chart/[id]" />
            <Stack.Screen name="empty/movies" />
            <Stack.Screen name="empty/filter" />
          </Stack>
          </KeyboardProvider>
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

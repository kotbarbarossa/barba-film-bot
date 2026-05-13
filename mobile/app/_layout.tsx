import '@/i18n';
import { Caveat_400Regular, Caveat_700Bold } from '@expo-google-fonts/caveat';
import { JetBrainsMono_400Regular } from '@expo-google-fonts/jetbrains-mono';
import { Kalam_400Regular, Kalam_700Bold } from '@expo-google-fonts/kalam';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { queryClient, persister } from '@/lib/queryClient';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ThemeProvider } from '@/theme';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'Caveat':         Caveat_400Regular,
    'Caveat-Bold':    Caveat_700Bold,
    'Kalam':          Kalam_400Regular,
    'Kalam-Bold':     Kalam_700Bold,
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
        </SafeAreaProvider>
      </PersistQueryClientProvider>
    </ThemeProvider>
  );
}

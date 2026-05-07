import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useRef, useMemo, useState } from 'react';
import {
  View, ScrollView, StyleSheet, Pressable, Text, TextInput,
  Alert, Platform, StatusBar as RNStatusBar,
  Animated, Easing, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useTheme } from '@/theme';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { Poster } from '@/components/Poster';
import { loginWithApple, loginWithGoogle } from '@/api/auth';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_ANDROID, GOOGLE_CLIENT_ID_WEB, API_URL } from '@/constants/env';
import { useAuthStore } from '@/store/auth.store';
interface PublicPosterEntry {
  id: number;
  title_ru: string | null;
  title_original: string | null;
  year: number | null;
  poster_url: string;
}
interface PublicPostersResponse { entries: PublicPosterEntry[] }

WebBrowser.maybeCompleteAuthSession();

const SCREEN_WIDTH = Dimensions.get('window').width;
const COL_COUNT = 3;
const TILE_W = SCREEN_WIDTH / COL_COUNT;
const TILE_H = TILE_W * (3 / 2);
const TILE_ROW_H = TILE_H + 8;
const BASE_COUNT = 12;
const CYCLE_HEIGHT = Math.ceil(BASE_COUNT / COL_COUNT) * TILE_ROW_H;

const FALLBACK_COLORS = [
  '#c4a882', '#2c2924', '#c45a3a', '#6a9e72',
  '#3a6ea5', '#d4b84a', '#1a1814', '#b85235',
  '#7ab087', '#2a5580', '#c9b070', '#252219',
];

type Variant = 'ios' | 'android' | 'telegram';

export function AuthScreen({ variant }: { variant?: Variant }) {
  const flavor = variant ?? (Platform.OS === 'android' ? 'android' : 'ios');
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);

  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const scrollAnim = useRef(new Animated.Value(0)).current;

  const { data: postersData } = useQuery<PublicPostersResponse>({
    queryKey: ['auth-bg-posters'],
    queryFn: async () => {
      const { data } = await axios.get<PublicPostersResponse>(
        `${API_URL}/discovery/recent-posters`,
        { timeout: 4000 },
      );
      return data;
    },
    retry: 0,
    staleTime: 1000 * 60 * 10,
    gcTime: 1000 * 60 * 10,
  });

  const posterUrls = useMemo<(string | null)[]>(() => {
    const entries = postersData?.entries ?? [];
    const urls: (string | null)[] = entries.slice(0, BASE_COUNT).map((e) => e.poster_url);
    while (urls.length < BASE_COUNT) urls.push(null);
    return urls;
  }, [postersData]);

  const loopTiles = useMemo(() => [...posterUrls, ...posterUrls, ...posterUrls], [posterUrls]);

  useEffect(() => {
    scrollAnim.setValue(0);
    const anim = Animated.loop(
      Animated.timing(scrollAnim, {
        toValue: -CYCLE_HEIGHT,
        duration: CYCLE_HEIGHT * 55,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
    webClientId: GOOGLE_CLIENT_ID_WEB,
  });

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const idToken = googleResponse.authentication?.idToken;
      if (idToken) handleGoogleToken(idToken);
    }
  }, [googleResponse]);

  async function handleGoogleToken(idToken: string) {
    try {
      setLoadingGoogle(true);
      const tokens = await loginWithGoogle(idToken);
      await signIn({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token, userId: tokens.user_id });
      router.replace('/');
    } catch {
      Alert.alert('Ошибка', 'Не удалось войти через Google. Попробуй ещё раз.');
    } finally {
      setLoadingGoogle(false);
    }
  }

  async function handleApple() {
    try {
      setLoadingApple(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error('No identity token');
      const tokens = await loginWithApple(
        credential.identityToken,
        credential.fullName?.givenName ?? undefined,
        credential.fullName?.familyName ?? undefined,
      );
      await signIn({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token, userId: tokens.user_id });
      router.replace('/');
    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') {
        Alert.alert('Ошибка', 'Не удалось войти через Apple. Попробуй ещё раз.');
      }
    } finally {
      setLoadingApple(false);
    }
  }

  if (flavor === 'telegram') {
    return <TelegramAuth />;
  }

  const cardBottom = 280 + insets.bottom;

  return (
    <View style={{ flex: 1, backgroundColor: '#1a1814' }}>
      <RNStatusBar barStyle="light-content" />

      {/* ── Animated poster grid ── */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        bottom: cardBottom - 40,
        overflow: 'hidden',
      }}>
        <Animated.View style={{
          flexDirection: 'row', flexWrap: 'wrap',
          padding: 4,
          transform: [{ translateY: scrollAnim }],
        }}>
          {loopTiles.map((posterUrl, i) => (
            <View key={i} style={{ width: `${100 / COL_COUNT}%`, padding: 4 }}>
              {posterUrl ? (
                <Poster
                  aspectRatio={2 / 3}
                  posterUrl={posterUrl}
                  style={{ borderRadius: 10, borderColor: 'rgba(255,255,255,0.12)' }}
                />
              ) : (
                <View style={[styles.tile, { backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }]} />
              )}
            </View>
          ))}
        </Animated.View>
      </View>

      {/* ── Auth card ── */}
      <View style={[
        styles.card,
        {
          backgroundColor: theme.paper,
          paddingBottom: insets.bottom + 16,
          minHeight: cardBottom,
        },
      ]}>
        {/* Handle */}
        <View style={[styles.handle, { backgroundColor: theme.shade2 }]} />

        <H size="xl" style={{ textAlign: 'center', marginBottom: 4 }}>Что посмотрим?</H>
        <ArtNote style={{ textAlign: 'center', marginBottom: 24 }}>
          войди, чтобы начать копилку
        </ArtNote>

        <View style={{ gap: 10 }}>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={{ width: '100%', height: 50 }}
              onPress={handleApple}
            />
          )}
          <Button
            title={loadingGoogle ? 'Загрузка…' : 'G  Войти через Google'}
            full
            variant={Platform.OS === 'ios' ? undefined : 'primary'}
            onPress={() => promptGoogleAsync()}
            disabled={loadingGoogle}
          />
        </View>

        <Body color={theme.inkFaint} size={11} style={{ marginTop: 20, textAlign: 'center' }}>
          Нажимая «войти», ты принимаешь условия использования
        </Body>
      </View>
    </View>
  );
}

function TelegramAuth() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('+7 ');
  const [code, setCode] = useState('');

  return (
    <View style={{ flex: 1, backgroundColor: theme.paper }}>
      <RNStatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: insets.top + 24 }}>
        <View style={{ alignItems: 'center' }}>
          <View style={[styles.logo, { borderColor: theme.line, backgroundColor: theme.accentBlue }]}>
            <Text style={{ fontSize: 36 }}>✈</Text>
          </View>
          <H size="xl" style={{ marginTop: 18 }}>Кинокопилка</H>
          <ArtNote style={{ marginTop: 4 }}>вход через Telegram</ArtNote>
        </View>

        {step === 'phone' ? (
          <View style={{ marginTop: 36 }}>
            <Mono>НОМЕР ТЕЛЕФОНА</Mono>
            <View style={[styles.field, { borderColor: theme.line }]}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{ fontFamily: 'Kalam', fontSize: 18, color: theme.ink }}
              />
            </View>
            <Body color={theme.inkSoft} size={12} style={{ marginTop: 8 }}>
              Тебе придёт сообщение в Telegram с кодом подтверждения.
            </Body>
            <View style={{ marginTop: 22 }}>
              <Button title="Получить код" variant="primary" full onPress={() => setStep('code')} />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 36 }}>
            <Mono>КОД ИЗ TELEGRAM</Mono>
            <View style={[styles.field, { borderColor: theme.line }]}>
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={5}
                placeholder="• • • • •"
                placeholderTextColor={theme.inkFaint}
                style={{ fontFamily: 'Kalam-Bold', fontSize: 28, color: theme.ink, letterSpacing: 8, textAlign: 'center' }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Pressable onPress={() => setStep('phone')}>
                <Text style={{ fontFamily: 'Caveat-Bold', color: theme.accentOrange }}>← изменить номер</Text>
              </Pressable>
              <Text style={{ fontFamily: 'Caveat-Bold', color: theme.inkFaint }}>отправить ещё раз (0:42)</Text>
            </View>
            <View style={{ marginTop: 22 }}>
              <Button title="Войти" variant="primary" full />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  card: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 88, height: 88, borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  field: {
    paddingHorizontal: 14, paddingVertical: 12,
    borderWidth: 1.5, borderRadius: 14,
    marginTop: 6,
  },
});

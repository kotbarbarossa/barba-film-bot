import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { Poster } from '@/components/Poster';
import { loginWithApple, loginWithGoogle } from '@/api/auth';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_WEB, API_URL } from '@/constants/env';
import { useAuthStore } from '@/store/auth.store';
import { useSettingsStore } from '@/store/settings.store';
interface PublicPosterEntry {
  id: number;
  title_ru: string | null;
  title_original: string | null;
  year: number | null;
  poster_url: string;
  poster_url_original: string | null;
}
interface PublicPostersResponse { entries: PublicPosterEntry[] }

GoogleSignin.configure({
  webClientId: GOOGLE_CLIENT_ID_WEB,
  iosClientId: GOOGLE_CLIENT_ID,
});

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
  const { t } = useTranslation();
  const signIn = useAuthStore((s) => s.signIn);
  const language = useSettingsStore((s) => s.language);

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
    const urls: (string | null)[] = entries.slice(0, BASE_COUNT).map((e) =>
      (language === 'en' ? e.poster_url_original : null) ?? e.poster_url,
    );
    while (urls.length < BASE_COUNT) urls.push(null);
    return urls;
  }, [postersData, language]);

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

  async function handleGoogle() {
    try {
      setLoadingGoogle(true);
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();
      const idToken = userInfo.data?.idToken;
      if (!idToken) throw new Error('No idToken');
      const tokens = await loginWithGoogle(idToken);
      await signIn({ accessToken: tokens.access_token, refreshToken: tokens.refresh_token, userId: tokens.user_id });
      router.replace('/');
    } catch (e: any) {
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert(t('auth.error'), t('auth.google_error'));
      }
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
        Alert.alert(t('auth.error'), t('auth.apple_error'));
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

        <H size="xl" adjustsFontSizeToFit numberOfLines={1} style={{ textAlign: 'center', marginBottom: 4, alignSelf: 'stretch' }}>{t('auth.tagline')}</H>
        <ArtNote style={{ textAlign: 'center', marginBottom: 24 }}>
          {t('auth.subtitle')}
        </ArtNote>

        <View style={{ gap: 10 }}>
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={loadingApple
                ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE
                : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={12}
              style={{ width: '100%', height: 50 }}
              onPress={handleApple}
            />
          )}
          <Button
            title={loadingGoogle ? t('auth.loading') : t('auth.google')}
            full
            variant={Platform.OS === 'ios' ? undefined : 'primary'}
            onPress={handleGoogle}
            disabled={loadingGoogle}
          />
        </View>

        <Body color={theme.inkFaint} size={11} style={{ marginTop: 20, textAlign: 'center' }}>
          {t('auth.terms')}
        </Body>
      </View>
    </View>
  );
}

function TelegramAuth() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
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
          <H size="xl" style={{ marginTop: 18 }}>{t('auth.telegram_app_name')}</H>
          <ArtNote style={{ marginTop: 4 }}>{t('auth.telegram_subtitle')}</ArtNote>
        </View>

        {step === 'phone' ? (
          <View style={{ marginTop: 36 }}>
            <Mono>{t('auth.phone_label')}</Mono>
            <View style={[styles.field, { borderColor: theme.line }]}>
              <TextInput
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                style={{ fontFamily: 'Nunito', fontSize: 18, color: theme.ink }}
              />
            </View>
            <Body color={theme.inkSoft} size={12} style={{ marginTop: 8 }}>
              {t('auth.phone_hint')}
            </Body>
            <View style={{ marginTop: 22 }}>
              <Button title={t('auth.get_code')} variant="primary" full onPress={() => setStep('code')} />
            </View>
          </View>
        ) : (
          <View style={{ marginTop: 36 }}>
            <Mono>{t('auth.code_label')}</Mono>
            <View style={[styles.field, { borderColor: theme.line }]}>
              <TextInput
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={5}
                placeholder="• • • • •"
                placeholderTextColor={theme.inkFaint}
                style={{ fontFamily: 'Nunito-Bold', fontSize: 28, color: theme.ink, letterSpacing: 8, textAlign: 'center' }}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
              <Pressable onPress={() => setStep('phone')}>
                <Text style={{ fontFamily: 'Neucha', fontSize: 16, lineHeight: 19, paddingVertical: 4, color: theme.accentOrange }}>{t('auth.change_phone') + ' '}</Text>
              </Pressable>
              <Text style={{ fontFamily: 'Neucha', fontSize: 16, lineHeight: 19, paddingVertical: 4, color: theme.inkFaint }}>{t('auth.resend') + ' '}</Text>
            </View>
            <View style={{ marginTop: 22 }}>
              <Button title={t('auth.sign_in')} variant="primary" full />
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

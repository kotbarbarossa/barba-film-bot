import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { Alert, Platform, View } from 'react-native';

import { loginWithApple, loginWithGoogle } from '@/api/auth';
import { Button } from '@/components/ui/Button';
import { Body, HeadingLg } from '@/components/ui/Typography';
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_ID_ANDROID } from '@/constants/env';
import { colors, spacing } from '@/constants/theme';
import { useAuthStore } from '@/store/auth.store';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingApple, setLoadingApple] = useState(false);

  const [, googleResponse, promptGoogleAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID,
    androidClientId: GOOGLE_CLIENT_ID_ANDROID,
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
      await signIn({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        userId: tokens.user_id,
      });
      router.replace('/(app)');
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
        credential.fullName?.givenName,
        credential.fullName?.familyName,
      );
      await signIn({
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        userId: tokens.user_id,
      });
      router.replace('/(app)');
    } catch (e: any) {
      if (e.code !== 'ERR_CANCELED') {
        Alert.alert('Ошибка', 'Не удалось войти через Apple. Попробуй ещё раз.');
      }
    } finally {
      setLoadingApple(false);
    }
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.paper,
        padding: spacing.lg,
        justifyContent: 'center',
      }}
    >
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.sm }}>
        <HeadingLg style={{ fontSize: 56, lineHeight: 56 }}>Кино-{'\n'}копилка</HeadingLg>
        <Body style={{ color: colors.inkFaint }}>твой личный список фильмов и сериалов</Body>
      </View>

      <View style={{ gap: spacing.sm, paddingBottom: spacing.xl }}>
        <Body style={{ color: colors.inkSoft, marginBottom: 4 }}>войти через</Body>

        <Button
          title="Google"
          variant="secondary"
          loading={loadingGoogle}
          fullWidth
          onPress={() => promptGoogleAsync()}
        />

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={12}
            style={{ width: '100%', height: 48 }}
            onPress={handleApple}
          />
        )}

        {Platform.OS === 'android' && (
          <Button
            title="Apple (не доступно на Android)"
            variant="secondary"
            disabled
            fullWidth
          />
        )}

        <Button
          title="Telegram (скоро)"
          variant="ghost"
          disabled
          fullWidth
        />

        <Body
          style={{
            textAlign: 'center',
            color: colors.inkFaint,
            fontSize: 11,
            marginTop: spacing.sm,
          }}
        >
          продолжая, ты соглашаешься с условиями использования
        </Body>
      </View>
    </View>
  );
}

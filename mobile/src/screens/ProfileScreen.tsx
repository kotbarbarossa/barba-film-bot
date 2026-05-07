import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, ArtNote, Body } from '@/components/Text';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/auth.store';

export function ProfileScreen() {
  const { theme } = useTheme();
  const { userId, signOut } = useAuthStore();

  const handleSignOut = () => {
    Alert.alert('Выйти из аккаунта?', '', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: signOut },
    ]);
  };

  return (
    <Phone>
      <View style={{ flex: 1, padding: 22, justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <View style={[styles.avatar, { borderColor: theme.line, backgroundColor: theme.accentYellow }]}>
          <H size="xl">К</H>
        </View>
        <H size="lg">Профиль</H>
        {userId ? <ArtNote>ID: {userId}</ArtNote> : null}
        <Body color={theme.inkSoft} style={{ textAlign: 'center', marginTop: 12 }}>
          Здесь будут: настройки, тема, язык, синхронизация, статистика просмотров.
        </Body>
      </View>

      <View style={{ padding: 18 }}>
        <Button title="Выйти из аккаунта" variant="ghost" full onPress={handleSignOut} />
      </View>
    </Phone>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
});

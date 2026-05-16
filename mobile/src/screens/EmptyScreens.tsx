import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, Body, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { TabBar } from '@/components/TabBar';

export function EmptyMoviesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Phone>
      <View style={styles.center}>
        <View style={[styles.illu, { borderColor: theme.line, backgroundColor: theme.accentYellow }]}>
          <Text style={{ fontSize: 48 }}>🎬</Text>
        </View>
        <H size="xl" style={{ textAlign: 'center', marginTop: 18 }}>{t('empty.movies_title')}</H>
        <ArtNote style={{ textAlign: 'center', marginTop: 4 }}>
          {t('empty.movies_body')}
        </ArtNote>

        <View style={{ marginTop: 28, gap: 8, width: '100%', alignItems: 'center' }}>
          <Button title={t('empty.add_movie')} variant="accent" onPress={() => router.push('/add' as any)} />
          <Button title={t('empty.see_charts')} variant="ghost" onPress={() => router.push('/charts' as any)} />
        </View>

        <View style={{ marginTop: 36, alignItems: 'center', gap: 4 }}>
          <Body color={theme.inkSoft}>{t('empty.can_add')}</Body>
          <Body>{t('empty.can_add_methods')}</Body>
        </View>
      </View>
      <TabBar />
    </Phone>
  );
}

export function EmptyFilterScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  return (
    <Phone>
      <View style={styles.center}>
        <View style={[styles.illu, { borderColor: theme.line, backgroundColor: theme.shade, borderStyle: 'dashed' }]}>
          <Text style={{ fontSize: 44 }}>🔍</Text>
        </View>
        <H size="lg" style={{ textAlign: 'center', marginTop: 18 }}>{t('empty.filter_title')}</H>
        <Body color={theme.inkSoft} style={{ textAlign: 'center', marginTop: 6, maxWidth: 260 }}>
          {t('empty.filter_body')}
        </Body>

        <View style={{ marginTop: 24, gap: 8 }}>
          <Button title={t('empty.reset_filters')} variant="primary" onPress={() => router.back()} />
          <Button title={t('empty.change_filters')} variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
      <TabBar />
    </Phone>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1, padding: 24,
    alignItems: 'center', justifyContent: 'center',
  },
  illu: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
});

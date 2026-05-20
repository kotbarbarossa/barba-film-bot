import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, Body, ArtNote } from '@/components/Text';

const CHART_IDS = [
  { id: 'global-trending', icon: '🔥' },
  { id: 'top-rated',       icon: '⭐' },
  { id: 'top-want',        icon: '🎯' },
  { id: 'top-watched',     icon: '🍿' },
  { id: 'top-controversial', icon: '🎭' },
  { id: 'top-quick',       icon: '⚡' },
  { id: 'top-postponed',   icon: '📦' },
] as const;

type ChartId = typeof CHART_IDS[number]['id'];

function chartTitleKey(id: ChartId): string {
  return `charts.${id.replace(/-/g, '_')}_title`;
}
function chartSubKey(id: ChartId): string {
  return `charts.${id.replace(/-/g, '_')}_sub`;
}

export function ChartsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <Phone>
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <H size="xl">{t('charts.title')}</H>
        <ArtNote>{t('charts.subtitle')}</ArtNote>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {CHART_IDS.map((c, i) => (
          <Pressable
            key={c.id}
            onPress={() => router.push({ pathname: '/charts/[id]', params: { id: c.id } } as any)}
            style={[
              styles.row,
              {
                backgroundColor: i === 0 ? theme.accentYellow : 'transparent',
                borderColor: theme.line,
                borderWidth: i === 0 ? 2 : 1.5,
              },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: i === 0 ? theme.paper : theme.shade, borderColor: theme.line }]}>
              <Text style={{ fontSize: 18 }}>{c.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Body weight="bold" size={14} color={i === 0 ? theme.onYellow : theme.ink}>{t(chartTitleKey(c.id))}</Body>
              <Body size={11} color={i === 0 ? theme.onYellow : theme.inkSoft} style={{ marginTop: 2, opacity: i === 0 ? 0.65 : 1 }}>{t(chartSubKey(c.id))}</Body>
            </View>
            <Text style={{ fontFamily: 'Neucha', fontSize: 22, lineHeight: 26, paddingVertical: 4, color: i === 0 ? theme.onYellow : theme.inkFaint, opacity: i === 0 ? 0.4 : 1 }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </Phone>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
  },
  iconBox: {
    width: 36, height: 36,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
});

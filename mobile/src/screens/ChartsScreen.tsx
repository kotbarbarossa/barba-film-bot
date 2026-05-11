import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, Body, ArtNote } from '@/components/Text';

const CHARTS = [
  { id: 'global-trending', icon: '🔥', title: 'Горячая десятка',    sub: 'активно смотрят и высоко оценивают прямо сейчас' },
  { id: 'top-rated',       icon: '⭐', title: 'Топ10 рейтинг',       sub: 'наивысшие средние оценки пользователей' },
  { id: 'top-want',        icon: '🎯', title: 'Топ10 в хочу',        sub: 'чаще всего добавляли в список недавно' },
  { id: 'top-watched',     icon: '🍿', title: 'Топ10 просмотрено',   sub: 'больше всего смотрели и пересматривали' },
  { id: 'top-controversial', icon: '🎭', title: 'Топ10 спорных',    sub: 'максимальный разброс оценок' },
  { id: 'top-quick',       icon: '⚡', title: 'Топ10 смотрят сразу', sub: 'добавляют и смотрят без откладывания' },
  { id: 'top-postponed',   icon: '📦', title: 'Кладбище фильмов',    sub: 'лежат в хотелках у многих, никто не смотрит' },
] as const;

export function ChartsScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <Phone>
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <H size="xl">🔥 Чарты</H>
        <ArtNote>общие подборки — одинаковы для всех</ArtNote>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
        {CHARTS.map((c, i) => (
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
              <Body weight="bold" size={14} color={i === 0 ? theme.onYellow : theme.ink}>{c.title}</Body>
              <Body size={11} color={i === 0 ? theme.onYellow : theme.inkSoft} style={{ marginTop: 2, opacity: i === 0 ? 0.65 : 1 }}>{c.sub}</Body>
            </View>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: i === 0 ? theme.onYellow : theme.inkFaint, opacity: i === 0 ? 0.4 : 1 }}>›</Text>
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

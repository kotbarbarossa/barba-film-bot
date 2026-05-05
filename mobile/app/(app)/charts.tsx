import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Body, Heading } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';
import type { ChartSlug } from '@/types/api';

const CHARTS: { slug: ChartSlug; icon: string; title: string; description: string }[] = [
  {
    slug: 'global-trending',
    icon: '🔥',
    title: 'Горячая десятка',
    description: 'Активно смотрят и высоко оценивают прямо сейчас',
  },
  {
    slug: 'top-rated',
    icon: '⭐',
    title: 'Топ10 рейтинг',
    description: 'Наивысшие средние оценки пользователей',
  },
  {
    slug: 'top-want',
    icon: '🎯',
    title: 'Топ10 хотят посмотреть',
    description: 'Чаще всего добавляли в список недавно',
  },
  {
    slug: 'top-watched',
    icon: '🍿',
    title: 'Топ10 просмотренных',
    description: 'Больше всего смотрели и пересматривали',
  },
  {
    slug: 'top-controversial',
    icon: '🎭',
    title: 'Топ10 спорных',
    description: 'Максимальный разброс оценок',
  },
  {
    slug: 'top-quick',
    icon: '⚡',
    title: 'Топ10 смотрят сразу',
    description: 'Добавляют и смотрят без откладывания',
  },
  {
    slug: 'top-postponed',
    icon: '📦',
    title: 'Кладбище фильмов',
    description: 'Давно лежат в хотелках и не смотрятся',
  },
];

export default function ChartsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.sm }}>
        <Heading style={{ marginBottom: spacing.sm }}>Чарты</Heading>

        {CHARTS.map((chart) => (
          <Pressable
            key={chart.slug}
            onPress={() => router.push(`/chart/${chart.slug}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              padding: spacing.md,
              backgroundColor: pressed ? colors.shade : colors.paper2,
              borderRadius: radius.md,
              borderWidth: 1.5,
              borderColor: colors.ink,
            })}
          >
            <Body style={{ fontSize: 24 }}>{chart.icon}</Body>
            <View style={{ flex: 1 }}>
              <Body style={{ fontSize: 15 }}>{chart.title}</Body>
              <Body style={{ color: colors.inkFaint, fontSize: 12, lineHeight: 16 }}>
                {chart.description}
              </Body>
            </View>
            <Body style={{ color: colors.inkFaint, fontSize: 20 }}>›</Body>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

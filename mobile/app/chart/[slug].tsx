import { router, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoviePoster } from '@/components/movie/MoviePoster';
import { Body, BodyBold, Caption, Heading } from '@/components/ui/Typography';
import { colors, fonts, spacing } from '@/constants/theme';
import { useChart, useGlobalTrending } from '@/hooks/queries/useCharts';
import type { ChartEntry, ChartSlug } from '@/types/api';

const CHART_META: Record<ChartSlug, { icon: string; title: string; description: string }> = {
  'global-trending': {
    icon: '🔥',
    title: 'Горячая десятка',
    description: 'Активно смотрят и высоко оценивают прямо сейчас',
  },
  'top-rated': { icon: '⭐', title: 'Топ10 рейтинг', description: 'Наивысшие средние оценки пользователей' },
  'top-want': { icon: '🎯', title: 'Топ10 хотят посмотреть', description: 'Чаще всего добавляли в список недавно' },
  'top-watched': { icon: '🍿', title: 'Топ10 просмотренных', description: 'Больше всего смотрели и пересматривали' },
  'top-controversial': { icon: '🎭', title: 'Топ10 спорных', description: 'Максимальный разброс оценок' },
  'top-quick': { icon: '⚡', title: 'Топ10 смотрят сразу', description: 'Добавляют и смотрят без откладывания' },
  'top-postponed': { icon: '📦', title: 'Кладбище фильмов', description: 'Давно лежат в хотелках и не смотрятся' },
};

export default function ChartScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const chartSlug = slug as ChartSlug;
  const meta = CHART_META[chartSlug];

  const trendingQuery = useGlobalTrending();
  const chartQuery = useChart(chartSlug as Exclude<ChartSlug, 'global-trending'>);

  const query = chartSlug === 'global-trending' ? trendingQuery : chartQuery;
  const entries: ChartEntry[] =
    chartSlug === 'global-trending'
      ? (trendingQuery.data?.entries ?? [])
      : (chartQuery.data?.entries ?? []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Back */}
      <Pressable onPress={() => router.back()} style={{ padding: spacing.md }}>
        <Body style={{ fontFamily: fonts.caveat, fontSize: 22 }}>← назад</Body>
      </Pressable>

      {/* Header */}
      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.md, gap: 4 }}>
        <Heading>
          {meta?.icon} {meta?.title}
        </Heading>
        <Caption style={{ textTransform: 'none' }}>{meta?.description}</Caption>
      </View>

      {/* List */}
      <FlatList
        data={entries}
        keyExtractor={(item) => String(item.movie_id)}
        ListEmptyComponent={
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <Body style={{ color: colors.inkFaint }}>
              {query.isLoading ? 'Загрузка...' : 'Пока нет данных'}
            </Body>
          </View>
        }
        renderItem={({ item, index }) => (
          <Pressable
            onPress={() => router.push(`/movie/${item.movie_id}`)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.md,
              padding: spacing.md,
              backgroundColor: pressed ? colors.shade : 'transparent',
              borderBottomWidth: 1,
              borderBottomColor: colors.shade2,
            })}
          >
            <Body
              style={{
                fontFamily: fonts.caveat,
                fontSize: 28,
                color: index < 3 ? colors.orange : colors.inkFaint,
                width: 32,
                textAlign: 'center',
              }}
            >
              {index + 1}
            </Body>

            <MoviePoster posterUrl={item.poster_url} width={50} height={75} />

            <View style={{ flex: 1, gap: 4 }}>
              <BodyBold numberOfLines={2}>
                {item.title_ru ?? item.title_original ?? '—'}
              </BodyBold>
              {item.title_original && item.title_ru && (
                <Body style={{ fontSize: 11, color: colors.inkFaint }} numberOfLines={1}>
                  {item.title_original}
                </Body>
              )}
              <Caption>
                {[item.year, item.media_type === 'series' ? 'Сериал' : 'Фильм']
                  .filter(Boolean)
                  .join(' · ')}
              </Caption>
            </View>

            <Body style={{ color: colors.inkFaint, fontSize: 20 }}>›</Body>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

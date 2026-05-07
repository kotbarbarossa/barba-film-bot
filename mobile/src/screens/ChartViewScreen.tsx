import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { TabBar } from '@/components/TabBar';
import { Button } from '@/components/Button';
import { useGlobalTrending, useChart } from '@/hooks/queries/useCharts';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import type { ChartSlug } from '@/types/api';

const CHART_META: Record<string, { icon: string; title: string; sub: string }> = {
  'global-trending': { icon: '🔥', title: 'Горячая десятка',    sub: 'активно смотрят и высоко оценивают прямо сейчас' },
  'top-rated':       { icon: '⭐', title: 'Топ10 рейтинг',       sub: 'наивысшие средние оценки пользователей' },
  'top-want':        { icon: '🎯', title: 'Топ10 в хочу',        sub: 'чаще всего добавляли в список недавно' },
  'top-watched':     { icon: '🍿', title: 'Топ10 просмотрено',   sub: 'больше всего смотрели и пересматривали' },
  'top-controversial': { icon: '🎭', title: 'Топ10 спорных',    sub: 'максимальный разброс оценок' },
  'top-quick':       { icon: '⚡', title: 'Топ10 смотрят сразу', sub: 'добавляют и смотрят без откладывания' },
  'top-postponed':   { icon: '📦', title: 'Кладбище фильмов',    sub: 'лежат в хотелках у многих, никто не смотрит' },
};

export function ChartViewScreen({ chartId = 'global-trending' }: { chartId?: string }) {
  const { theme } = useTheme();
  const router = useRouter();

  const isGlobal = chartId === 'global-trending';
  const trendingQuery = useGlobalTrending();
  const chartQuery = useChart(
    (isGlobal ? 'top-rated' : chartId) as Exclude<ChartSlug, 'global-trending'>,
  );
  const { data, isLoading } = isGlobal ? trendingQuery : chartQuery;
  const entries = data?.entries ?? [];

  const { data: myMovies = [] } = useMyMovies();
  const myMovieIds = new Set(myMovies.map(m => m.movie.id));

  const meta = CHART_META[chartId] ?? { icon: '📊', title: chartId, sub: '' };

  if (isLoading) {
    return (
      <Phone>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.ink} />
        </View>
        <TabBar />
      </Phone>
    );
  }

  if (entries.length === 0) {
    return <ChartEmptyScreen />;
  }

  return (
    <Phone>
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <Pressable onPress={() => router.back()}>
          <H size="md" style={{ paddingRight: 6 }}>← чарты</H>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <H size="xl">{meta.icon} {meta.title}</H>
          <ArtNote>{meta.sub} · обновлено сегодня</ArtNote>
        </View>

        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 8 }}>
          {entries.map((entry, i) => {
            const mine = myMovieIds.has(entry.movie_id);
            return (
              <Pressable
                key={entry.movie_id}
                onPress={() => router.push({
                  pathname: '/movie-from-chart/[id]',
                  params: {
                    id: String(entry.movie_id),
                    posterUrl: entry.poster_url ?? '',
                    title: entry.title_ru ?? entry.title_original ?? '',
                    year: String(entry.year ?? ''),
                    score: String(entry.score.toFixed(1)),
                    watchCount: String(entry.watch_count),
                    rank: String(i + 1),
                    chartTitle: meta.title,
                  },
                } as any)}
                style={[
                  styles.row,
                  { borderColor: mine ? theme.accentMint : theme.line, backgroundColor: 'transparent' },
                ]}
              >
                <Text style={[styles.rank, { color: i === 0 ? theme.accentOrange : theme.ink }]}>#{i + 1}</Text>
                <Poster width={40} aspectRatio={2 / 3} posterUrl={entry.poster_url} label={entry.title_ru?.slice(0, 4) ?? '?'} />
                <View style={{ flex: 1 }}>
                  <Body weight="bold" size={13}>{entry.title_ru ?? entry.title_original}</Body>
                  <Mono size={9}>{entry.year}</Mono>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <StarRow value={entry.score} size={11} />
                    <Body weight="bold" size={11}>{entry.score.toFixed(1)}</Body>
                    <Body color={theme.inkFaint} size={10}>· {entry.watch_count} оценок</Body>
                  </View>
                </View>
                {mine ? (
                  <View style={[styles.badge, { backgroundColor: theme.accentMint, borderColor: theme.line }]}>
                    <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 10, color: theme.ink }}>✓</Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <TabBar />
    </Phone>
  );
}

export function ChartEmptyScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <Phone>
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <Pressable onPress={() => router.back()}>
          <H size="md" style={{ paddingRight: 6 }}>← чарты</H>
        </Pressable>
      </View>

      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <View style={[styles.illu, { borderColor: theme.line, backgroundColor: theme.shade }]}>
          <Text style={{ fontSize: 40 }}>📭</Text>
        </View>
        <H size="lg" style={{ textAlign: 'center' }}>Чарт пока пуст</H>
        <Body color={theme.inkSoft} style={{ textAlign: 'center', maxWidth: 260 }}>
          Нужно больше данных от пользователей. Возвращайся через пару дней —
          подборка обновится автоматически.
        </Body>
        <View style={{ marginTop: 12 }}>
          <Button title="← К чартам" onPress={() => router.back()} />
        </View>
      </View>

      <TabBar />
    </Phone>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 8,
    borderWidth: 1.5, borderRadius: 12,
  },
  rank: {
    minWidth: 36, textAlign: 'center',
    fontFamily: 'Caveat-Bold', fontSize: 22,
  },
  badge: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  illu: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 2, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
});

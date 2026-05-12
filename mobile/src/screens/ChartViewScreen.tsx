import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { TabBar } from '@/components/TabBar';
import { Button } from '@/components/Button';
import { useGlobalTrending, useChart } from '@/hooks/queries/useCharts';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import { useSettingsStore } from '@/store/settings.store';
import { movieTitle } from '@/utils/localize';
import type { ChartSlug } from '@/types/api';

const CHART_ICONS: Record<string, string> = {
  'global-trending':  '🔥',
  'top-rated':        '⭐',
  'top-want':         '🎯',
  'top-watched':      '🍿',
  'top-controversial':'🎭',
  'top-quick':        '⚡',
  'top-postponed':    '📦',
};

function chartTitleKey(id: string): string {
  return `charts.${id.replace(/-/g, '_')}_title`;
}
function chartSubKey(id: string): string {
  return `charts.${id.replace(/-/g, '_')}_sub`;
}

export function ChartViewScreen({ chartId = 'global-trending' }: { chartId?: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();

  const isGlobal = chartId === 'global-trending';
  const trendingQuery = useGlobalTrending();
  const chartQuery = useChart(
    (isGlobal ? 'top-rated' : chartId) as Exclude<ChartSlug, 'global-trending'>,
  );
  const { data, isLoading } = isGlobal ? trendingQuery : chartQuery;
  const entries = data?.entries ?? [];

  const { data: myMovies = [] } = useMyMovies();
  const myMovieIds = new Set(myMovies.map(m => m.movie.id));
  const language = useSettingsStore(s => s.language);

  const icon = CHART_ICONS[chartId] ?? '📊';

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
          <H size="md" style={{ paddingRight: 6 }}>{t('charts.back')}</H>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        <View style={{ paddingHorizontal: 18, paddingTop: 8 }}>
          <H size="xl">{icon} {t(chartTitleKey(chartId))}</H>
          <ArtNote>{t(chartSubKey(chartId))} · {t('charts.updated_today')}</ArtNote>
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
                    title: movieTitle(entry, language),
                    year: String(entry.year ?? ''),
                    score: String(entry.score.toFixed(1)),
                    watchCount: String(entry.watch_count),
                    rank: String(i + 1),
                    chartId,
                  },
                } as any)}
                style={[
                  styles.row,
                  { borderColor: mine ? theme.accentMint : theme.line, backgroundColor: 'transparent' },
                ]}
              >
                <Text style={[styles.rank, { color: i === 0 ? theme.accentOrange : theme.ink }]}>#{i + 1}</Text>
                <Poster width={40} aspectRatio={2 / 3} posterUrl={entry.poster_url} label={(movieTitle(entry, language) || '?').slice(0, 4)} />
                <View style={{ flex: 1 }}>
                  <Body weight="bold" size={13}>{movieTitle(entry, language)}</Body>
                  <Mono size={9}>{entry.year}</Mono>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <StarRow value={entry.score} size={11} />
                    <Body weight="bold" size={11}>{entry.score.toFixed(1)}</Body>
                    <Body color={theme.inkFaint} size={10}>· {t('charts.ratings_count_short', { count: entry.watch_count })}</Body>
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
  const { t } = useTranslation();
  return (
    <Phone>
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <Pressable onPress={() => router.back()}>
          <H size="md" style={{ paddingRight: 6 }}>{t('charts.back')}</H>
        </Pressable>
      </View>

      <View style={{ flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
        <View style={[styles.illu, { borderColor: theme.line, backgroundColor: theme.shade }]}>
          <Text style={{ fontSize: 40 }}>📭</Text>
        </View>
        <H size="lg" style={{ textAlign: 'center' }}>{t('charts.empty_title')}</H>
        <Body color={theme.inkSoft} style={{ textAlign: 'center', maxWidth: 260 }}>
          {t('charts.empty_body')}
        </Body>
        <View style={{ marginTop: 12 }}>
          <Button title={t('charts.back_to_charts')} onPress={() => router.back()} />
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

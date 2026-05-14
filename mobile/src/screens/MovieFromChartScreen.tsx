import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { Chip } from '@/components/Chip';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono } from '@/components/Text';
import { Button } from '@/components/Button';
import { TabBar } from '@/components/TabBar';
import { usePublicMovie } from '@/hooks/queries/useMovie';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import { useAddMovie } from '@/hooks/mutations/useAddMovie';
import { useSettingsStore } from '@/store/settings.store';
import { movieTitle, genreName, personName } from '@/utils/localize';

type Props = {
  movieId: string;
  posterUrl?: string;
  title?: string;
  year?: string;
  score?: string;
  watchCount?: string;
  rank?: string;
  chartId?: string;
  onOpenCard?: () => void;
};

function chartTitleKey(id: string): string {
  return `charts.${id.replace(/-/g, '_')}_title`;
}

export function MovieFromChartScreen({ movieId, posterUrl, title: titleProp, year, score, watchCount, rank, chartId, onOpenCard }: Props) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const numericId = parseInt(movieId, 10);

  const { data: movieDetail, isLoading: loadingDetail } = usePublicMovie(numericId);
  const { data: myMovies = [] } = useMyMovies();
  const { mutateAsync: addMovie, isPending } = useAddMovie();

  const inMyList = myMovies.some(m => m.movie.id === numericId);
  const [added, setAdded] = useState(false);

  const language = useSettingsStore(s => s.language);
  const title = titleProp || (movieDetail ? movieTitle(movieDetail, language) : '') || '';
  const isEn = language === 'en';
  const resolvedPosterUrl = posterUrl || (isEn ? movieDetail?.poster_url_original : null) || movieDetail?.poster_url || undefined;
  const hasImage = !!resolvedPosterUrl;
  const heroTextColor = hasImage ? '#fff' : theme.ink;

  const handleAdd = async () => {
    try {
      await addMovie({ title, media_type: 'film', year: year ? parseInt(year, 10) : undefined });
      setAdded(true);
    } catch {
      Alert.alert(t('chart_movie.error'), t('chart_movie.error_body'));
    }
  };

  const handleOpenMyCard = () => {
    if (onOpenCard) {
      onOpenCard();
    } else {
      router.push({ pathname: '/movie/[id]', params: { id: movieId } } as any);
    }
  };

  const isInList = inMyList || added;

  const displayMovie = movieDetail ?? null;
  const actors = displayMovie?.persons?.filter(p => p.role_type === 'actor').map(p => personName(p.person, language)).join(' · ');
  const directors = displayMovie?.persons?.filter(p => p.role_type === 'director').map(p => personName(p.person, language)).join(', ');

  const chartTitle = chartId ? t(chartTitleKey(chartId)) : undefined;

  return (
    <Phone>
      <View style={[styles.hero, { backgroundColor: theme.paper2 }]}>
        <Poster
          aspectRatio={undefined}
          height={280}
          posterUrl={resolvedPosterUrl || null}
          label={title.slice(0, 8)}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 0, borderWidth: 0 } as any}
        />
        {hasImage && (
          <View style={[styles.heroFade, { backgroundColor: 'rgba(0,0,0,0.38)' }]} />
        )}
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: heroTextColor }}>{t('chart_movie.back_to_chart')}</Text>
          </Pressable>
        </View>
        {rank && chartTitle ? (
          <View style={[styles.chartBadge, { backgroundColor: theme.accentYellow, borderColor: theme.line }]}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 12, color: theme.onYellow }}>#{rank} · {chartTitle}</Text>
          </View>
        ) : null}
        <View style={styles.heroBottom}>
          <H size="xl" color={heroTextColor}>{title}</H>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
            {year ? <Mono style={{ color: hasImage ? 'rgba(255,255,255,0.8)' : undefined }}>{year}</Mono> : null}
            {displayMovie?.country ? <Mono style={{ color: hasImage ? 'rgba(255,255,255,0.8)' : undefined }}>{displayMovie.country}</Mono> : null}
            {displayMovie?.duration_minutes ? (
              <Mono style={{ color: hasImage ? 'rgba(255,255,255,0.8)' : undefined }}>{displayMovie.duration_minutes} {t('chart_movie.min')}</Mono>
            ) : null}
          </View>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingBottom: 16 }}>
        {/* Ratings row */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          {score ? (
            <View style={[styles.ratingBox, { backgroundColor: theme.shade, borderColor: theme.line }]}>
              <Mono size={9}>{t('charts.in_chart')}</Mono>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <StarRow value={parseFloat(score)} size={13} />
                <Body weight="bold" size={14}>{score}</Body>
                {watchCount ? <Body color={theme.inkFaint} size={10}>· {t('charts.ratings_count_short', { count: watchCount })}</Body> : null}
              </View>
            </View>
          ) : null}
          {displayMovie?.imdb_rating ? (
            <View style={[styles.ratingBox, { backgroundColor: theme.shade, borderColor: theme.line }]}>
              <Mono size={9}>IMDB</Mono>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <StarRow value={displayMovie.imdb_rating} size={13} />
                <Body weight="bold" size={14}>{displayMovie.imdb_rating}</Body>
              </View>
            </View>
          ) : null}
        </View>

        {/* Categories */}
        {displayMovie?.categories && displayMovie.categories.length > 0 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
            {displayMovie.categories.map(c => (
              <Chip key={c.id} label={genreName(c, language)} />
            ))}
          </View>
        ) : null}

        {/* Description */}
        {loadingDetail && !displayMovie ? (
          <ActivityIndicator color={theme.inkFaint} size="small" style={{ marginVertical: 8 }} />
        ) : null}
        {(isEn ? displayMovie?.description_original : null) ?? displayMovie?.description ? (
          <>
            <Mono style={{ marginBottom: 4 }}>{t('chart_movie.description')}</Mono>
            <Body color={theme.inkSoft}>{(isEn ? displayMovie?.description_original : null) ?? displayMovie?.description}</Body>
          </>
        ) : null}

        {/* Cast */}
        {directors ? (
          <View style={{ marginTop: 12 }}>
            <Body><Mono>{t('chart_movie.director')}</Mono>{directors}</Body>
          </View>
        ) : null}
        {actors ? (
          <View style={{ marginTop: 4 }}>
            <Body><Mono>{t('chart_movie.cast')}</Mono>{actors}</Body>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: theme.line, backgroundColor: theme.paper }]}>
        {isInList ? (
          <Button title={t('chart_movie.in_list')} full variant="ghost" onPress={handleOpenMyCard} />
        ) : (
          <Button
            title={isPending ? t('chart_movie.adding') : t('chart_movie.add_to_watchlist')}
            variant="primary"
            full
            onPress={handleAdd}
            disabled={isPending}
          />
        )}
      </View>
      <TabBar />
    </Phone>
  );
}

const styles = StyleSheet.create({
  hero: { height: 280, overflow: 'hidden', position: 'relative' },
  heroFade: { ...StyleSheet.absoluteFillObject },
  heroTop: {
    position: 'absolute', top: 12, left: 16, right: 16,
  },
  chartBadge: {
    position: 'absolute', top: 46, left: 16,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1.5, borderRadius: 6,
  },
  heroBottom: {
    position: 'absolute', bottom: 12, left: 16, right: 16,
  },
  ratingBox: {
    padding: 8,
    borderWidth: 1.5, borderRadius: 12,
  },
  actions: {
    padding: 12, borderTopWidth: 1.5,
  },
});

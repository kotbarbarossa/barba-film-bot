import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster, PosterPending, PosterMissing } from '@/components/Poster';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { useRouter } from 'expo-router';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import { useSettingsStore } from '@/store/settings.store';
import { useFiltersStore } from '@/store/filters.store';
import { movieTitle } from '@/utils/localize';
import type { UserMovieListResponse } from '@/types/api';

export function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const { data: movies } = useMyMovies();
  const language = useSettingsStore(s => s.language);

  const setFilters = useFiltersStore(s => s.setFilters);
  const resetFilters = useFiltersStore(s => s.reset);

  const allMovies = movies ?? [];
  const movieCount = allMovies.length;
  const notWatchedCount = useMemo(() => allMovies.filter(m => m.status !== 'watched').length, [allMovies]);
  const watchedCount = useMemo(() => allMovies.filter(m => m.status === 'watched').length, [allMovies]);

  const recentAdded = useMemo(
    () => [...allMovies]
      .filter(m => m.status !== 'watched')
      .sort((a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime())
      .slice(0, 10),
    [allMovies],
  );
  const recentWatched = useMemo(
    () => allMovies
      .filter(m => m.status === 'watched')
      .sort((a, b) => {
        const aW = a.watched_at ? new Date(a.watched_at).getTime() : 0;
        const bW = b.watched_at ? new Date(b.watched_at).getTime() : 0;
        return bW - aW || new Date(b.added_at).getTime() - new Date(a.added_at).getTime();
      })
      .slice(0, 10),
    [allMovies],
  );

  const unwatched = useMemo(() => allMovies.filter(m => m.status !== 'watched'), [allMovies]);

  const onRandom = () => {
    if (unwatched.length === 0) return;
    const pick = unwatched[Math.floor(Math.random() * unwatched.length)];
    router.push({ pathname: '/movie/[id]', params: { id: String(pick.movie.id) } } as any);
  };

  if (movies === undefined) {
    return (
      <Phone>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={theme.ink} />
        </View>
      </Phone>
    );
  }

  if (movieCount === 0) {
    return (
      <Phone>
        <View style={[styles.row, { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }]}>
          <H size="lg">{t('home.title')}</H>
        </View>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={[styles.emptyIllu, { borderColor: theme.line, backgroundColor: theme.accentYellow }]}>
            <Text style={{ fontSize: 52 }}>🎬</Text>
          </View>
          <H size="xl" style={{ textAlign: 'center' }}>{t('home.empty_title')}</H>
          <Body color={theme.inkSoft} style={{ textAlign: 'center', maxWidth: 260 }}>
            {t('home.empty_body')}
          </Body>
          <View style={{ marginTop: 8, gap: 8, alignItems: 'center' }}>
            <Pressable
              onPress={() => router.push('/add' as any)}
              style={[styles.addBtn, { backgroundColor: theme.accentOrange, borderColor: theme.ink, shadowColor: theme.line }]}
            >
              <Text style={{ fontFamily: 'Neucha', fontSize: 18, lineHeight: 22, paddingVertical: 4, color: theme.paper }}>{t('home.add_movie')}</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/charts' as any)}>
              <Text style={{ fontFamily: 'Neucha', fontSize: 16, lineHeight: 19, paddingVertical: 4, color: theme.inkSoft }}>{t('home.see_charts')}</Text>
            </Pressable>
          </View>
        </View>
      </Phone>
    );
  }

  return (
    <Phone>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
        <View style={[styles.row, { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }]}>
          <H size="lg">{t('home.title')}</H>
        </View>

        <Pressable
          onPress={onRandom}
          style={[styles.dice, { backgroundColor: theme.ink, borderColor: theme.line, shadowColor: theme.line }]}
        >
          <H size="xl" color={theme.paper} style={{ fontSize: 40 }}>{t('home.random')}</H>
          <Body color={theme.paper} size={13} style={{ opacity: 0.85 }}>
            {t('home.random_sub', { count: unwatched.length })}
          </Body>
        </Pressable>

        <View style={styles.tilesRow}>
          <NavTile
            title={t('home.all_mine')}
            emoji="📚"
            tone="orange"
            sub={t('home.movies_count_sub', { count: movieCount })}
            onPress={() => router.push('/movies' as any)}
          />
          <NavTile
            title={t('home.charts')}
            emoji="🔥"
            tone="yellow"
            sub={t('home.seven_collections')}
            onPress={() => router.push('/charts' as any)}
          />
        </View>

        <PosterShelf
          title={t('home.recently_added')}
          sub={notWatchedCount > 0 ? `${notWatchedCount} →` : ''}
          movies={recentAdded}
          onMoviePress={(m) => router.push({ pathname: '/movie/[id]', params: { id: String(m.movie.id) } } as any)}
          onSubPress={() => {
            resetFilters();
            setFilters({ status: 'want', sort: 'added_desc' });
            router.push('/movies' as any);
          }}
        />
        <PosterShelf
          title={t('home.recently_watched')}
          sub={watchedCount > 0 ? `${watchedCount} →` : ''}
          movies={recentWatched}
          onMoviePress={(m) => router.push({ pathname: '/movie/[id]', params: { id: String(m.movie.id) } } as any)}
          onSubPress={() => {
            resetFilters();
            setFilters({ status: 'watched', sort: 'watched_first' });
            router.push('/movies' as any);
          }}
        />
      </ScrollView>
    </Phone>
  );
}

function NavTile({
  title,
  emoji,
  tone,
  sub,
  onPress,
}: {
  title: string;
  emoji: string;
  tone: 'orange' | 'yellow';
  sub: string;
  onPress?: () => void;
}) {
  const { theme } = useTheme();
  const bg = tone === 'orange' ? theme.accentOrange : theme.accentYellow;
  const fg = tone === 'orange' ? theme.paper : theme.onYellow;
  return (
    <Pressable onPress={onPress} style={[styles.tile, { backgroundColor: bg, borderColor: theme.line }]}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <H size="md" color={fg}>{title}</H>
        <Body color={fg} size={11} style={{ opacity: 0.85 }}>{sub}</Body>
      </View>
      <Text style={{ fontFamily: 'Neucha', fontSize: 22, lineHeight: 26, paddingVertical: 4, color: fg, opacity: 0.6 }}>›</Text>
    </Pressable>
  );
}

function PosterShelf({
  title,
  sub,
  movies,
  onMoviePress,
  onSubPress,
}: {
  title: string;
  sub: string;
  movies: UserMovieListResponse[];
  onMoviePress: (m: UserMovieListResponse) => void;
  onSubPress?: () => void;
}) {
  const language = useSettingsStore(s => s.language);
  if (movies.length === 0) return null;
  return (
    <View style={{ marginTop: 14 }}>
      <View style={[styles.row, { paddingHorizontal: 18, marginBottom: 6 }]}>
        <H size="md" style={{ flex: 1 }}>{title}</H>
        {sub ? (
          <Pressable onPress={onSubPress} hitSlop={8}>
            <Mono style={{ flexShrink: 0 }}>{sub}</Mono>
          </Pressable>
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 18, gap: 8 }}
      >
        {movies.map(m => {
          const status = m.movie.processing_status;
          return (
            <Pressable key={m.id} onPress={() => onMoviePress(m)}>
              {status === 'pending' ? (
                <PosterPending width={76} aspectRatio={2 / 3} />
              ) : status === 'unrecognized' ? (
                <PosterMissing width={76} aspectRatio={2 / 3} />
              ) : (
                <Poster
                  width={76}
                  aspectRatio={2 / 3}
                  posterUrl={(language === 'en' ? m.movie.poster_url_original : null) ?? m.movie.poster_url}
                  label={(movieTitle(m.movie, language) || '?').slice(0, 5)}
                />
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyIllu: {
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 3, height: 3 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  addBtn: {
    paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 12, borderWidth: 1.5,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1, shadowRadius: 0, elevation: 2,
  },
  dice: {
    marginHorizontal: 18,
    marginTop: 10,
    padding: 20,
    borderWidth: 1.5,
    borderRadius: 14,
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  tilesRow: {
    flexDirection: 'row',
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 10,
  },
  tile: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});

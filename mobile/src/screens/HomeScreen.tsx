import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text } from 'react-native';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster, PosterProcessing, PosterUnrecognized } from '@/components/Poster';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { useRouter } from 'expo-router';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import type { UserMovieListResponse } from '@/types/api';

export function HomeScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: movies = [] } = useMyMovies();

  const movieCount = movies.length;
  const wantCount = useMemo(() => movies.filter(m => m.status === 'want').length, [movies]);
  const watchedCount = useMemo(() => movies.filter(m => m.status === 'watched').length, [movies]);

  const recentAdded = useMemo(
    () => [...movies].sort((a, b) => b.id - a.id).slice(0, 6),
    [movies],
  );
  const recentWatched = useMemo(
    () => movies.filter(m => m.status === 'watched').sort((a, b) => b.id - a.id).slice(0, 6),
    [movies],
  );

  const onRandom = () => {
    if (movies.length === 0) return;
    const pick = movies[Math.floor(Math.random() * movies.length)];
    router.push({ pathname: '/movie/[id]', params: { id: String(pick.movie.id) } } as any);
  };

  if (movieCount === 0) {
    return (
      <Phone>
        <View style={[styles.row, { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 6 }]}>
          <H size="lg">Кинокопилка</H>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[styles.iconBox, { borderColor: theme.ink }]} />
            <View style={[styles.iconBox, { borderColor: theme.ink, backgroundColor: theme.accentYellow }]} />
          </View>
        </View>
        <View style={{ flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <View style={[styles.emptyIllu, { borderColor: theme.line, backgroundColor: theme.accentYellow }]}>
            <Text style={{ fontSize: 52 }}>🎬</Text>
          </View>
          <H size="xl" style={{ textAlign: 'center' }}>Копилка пуста</H>
          <Body color={theme.inkSoft} style={{ textAlign: 'center', maxWidth: 260 }}>
            Добавь первый фильм — и здесь появятся твои полки, статистика и кнопка «Наугад»
          </Body>
          <View style={{ marginTop: 8, gap: 8, alignItems: 'center' }}>
            <Pressable
              onPress={() => router.push('/add' as any)}
              style={[styles.addBtn, { backgroundColor: theme.accentOrange, borderColor: theme.ink, shadowColor: theme.line }]}
            >
              <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 18, color: theme.paper }}>+ Добавить фильм</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/charts' as any)}>
              <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 15, color: theme.inkSoft }}>🔥 Посмотреть чарты</Text>
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
          <H size="lg">Кинокопилка</H>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <View style={[styles.iconBox, { borderColor: theme.ink }]} />
            <View style={[styles.iconBox, { borderColor: theme.ink, backgroundColor: theme.accentYellow }]} />
          </View>
        </View>

        <Pressable
          onPress={onRandom}
          style={[styles.dice, { backgroundColor: theme.ink, borderColor: theme.line, shadowColor: theme.line }]}
        >
          <H size="xl" color={theme.paper} style={{ fontSize: 40 }}>🎲 Наугад</H>
          <Body color={theme.paper} size={13} style={{ opacity: 0.85 }}>
            один из {movieCount} фильмов в твоём списке
          </Body>
        </Pressable>

        <View style={styles.tilesRow}>
          <NavTile
            title="Все мои"
            emoji="📚"
            tone="orange"
            sub={`${movieCount} фильмов`}
            onPress={() => router.push('/movies' as any)}
          />
          <NavTile
            title="Чарты"
            emoji="🔥"
            tone="yellow"
            sub="7 подборок"
            onPress={() => router.push('/charts' as any)}
          />
        </View>

        <PosterShelf
          title="Недавно добавленные"
          sub={wantCount > 0 ? `${wantCount} →` : ''}
          movies={recentAdded}
          onMoviePress={(m) => router.push({ pathname: '/movie/[id]', params: { id: String(m.movie.id) } } as any)}
        />
        <PosterShelf
          title="Недавно просмотренные"
          sub={watchedCount > 0 ? `${watchedCount} →` : ''}
          movies={recentWatched}
          onMoviePress={(m) => router.push({ pathname: '/movie/[id]', params: { id: String(m.movie.id) } } as any)}
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
  const fg = tone === 'orange' ? theme.paper : theme.ink;
  return (
    <Pressable onPress={onPress} style={[styles.tile, { backgroundColor: bg, borderColor: theme.line }]}>
      <Text style={{ fontSize: 24 }}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <H size="md" color={fg}>{title}</H>
        <Body color={fg} size={11} style={{ opacity: 0.85 }}>{sub}</Body>
      </View>
      <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: fg, opacity: 0.6 }}>›</Text>
    </Pressable>
  );
}

function PosterShelf({
  title,
  sub,
  movies,
  onMoviePress,
}: {
  title: string;
  sub: string;
  movies: UserMovieListResponse[];
  onMoviePress: (m: UserMovieListResponse) => void;
}) {
  if (movies.length === 0) return null;
  return (
    <View style={{ marginTop: 14 }}>
      <View style={[styles.row, { paddingHorizontal: 18, marginBottom: 6 }]}>
        <H size="md">{title}</H>
        {sub ? <Mono>{sub}</Mono> : null}
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
                <PosterProcessing width={76} aspectRatio={2 / 3} />
              ) : status === 'unrecognized' ? (
                <PosterUnrecognized width={76} aspectRatio={2 / 3} />
              ) : (
                <Poster
                  width={76}
                  aspectRatio={2 / 3}
                  posterUrl={m.movie.poster_url}
                  label={(m.movie.title_ru ?? m.movie.title_original ?? '?').slice(0, 5)}
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
  iconBox: { width: 22, height: 22, borderWidth: 1.5, borderRadius: 3 },
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

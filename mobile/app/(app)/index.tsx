import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoviePoster } from '@/components/movie/MoviePoster';
import { Body, BodyBold, Heading, HeadingLg, HeadingSm } from '@/components/ui/Typography';
import { colors, radius, spacing } from '@/constants/theme';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import { useAuthStore } from '@/store/auth.store';

export default function HomeScreen() {
  const { data: movies } = useMyMovies();
  const { signOut } = useAuthStore();

  const recentlyAdded = useMemo(
    () => [...(movies ?? [])].sort((a, b) => b.added_at.localeCompare(a.added_at)).slice(0, 5),
    [movies],
  );

  const watchingOrWant = useMemo(
    () => (movies ?? []).filter((m) => m.status === 'want' || m.status === 'watching'),
    [movies],
  );

  function handleRandom() {
    if (!watchingOrWant.length) return;
    const pick = watchingOrWant[Math.floor(Math.random() * watchingOrWant.length)];
    router.push(`/movie/${pick.movie.id}`);
  }

  const totalCount = movies?.length ?? 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <HeadingLg>Кино-{'\n'}копилка</HeadingLg>
            <Body style={{ color: colors.inkFaint }}>{totalCount} фильмов в коллекции</Body>
          </View>
          <Pressable onPress={() => signOut()}>
            <Body style={{ color: colors.inkFaint, fontSize: 12 }}>выйти</Body>
          </Pressable>
        </View>

        {/* Random */}
        <Pressable
          onPress={handleRandom}
          style={({ pressed }) => ({
            backgroundColor: colors.ink,
            borderRadius: radius.lg,
            padding: spacing.md,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <HeadingLg style={{ color: colors.paper, fontSize: 36 }}>🎲 Наугад</HeadingLg>
          <Body style={{ color: colors.paper, opacity: 0.85 }}>
            {watchingOrWant.length > 0
              ? `один из ${watchingOrWant.length} фильмов в списке`
              : 'добавь фильмы чтобы начать'}
          </Body>
        </Pressable>

        {/* Recently added */}
        {recentlyAdded.length > 0 && (
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Heading>Недавно добавленные</Heading>
              <Pressable onPress={() => router.push('/(app)/movies')}>
                <Body style={{ color: colors.inkFaint, fontSize: 12 }}>все →</Body>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              {recentlyAdded.map((item) => (
                <Pressable key={item.movie.id} onPress={() => router.push(`/movie/${item.movie.id}`)}>
                  <MoviePoster
                    posterUrl={item.movie.poster_url}
                    processing={item.movie.processing_status === 'pending'}
                    width={70}
                    height={105}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Navigation tiles */}
        <View style={{ gap: spacing.sm }}>
          <NavTile icon="🎭" title="По жанру" sub="фильтр по жанрам" onPress={() => router.push('/(app)/movies?filter=genre')} />
          <NavTile icon="📅" title="По годам" sub="80-е, 90-е, 2000-е…" onPress={() => router.push('/(app)/movies?filter=period')} />
          <NavTile icon="👁" title="Недавно просмотренные" sub="последние 10" onPress={() => router.push('/(app)/movies?filter=watched')} />
          <NavTile icon="📚" title="Все мои фильмы" sub={`${totalCount} в коллекции`} onPress={() => router.push('/(app)/movies')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NavTile({ icon, title, sub, onPress }: { icon: string; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
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
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 8,
          backgroundColor: colors.paper,
          borderWidth: 1.5,
          borderColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Body style={{ fontSize: 18 }}>{icon}</Body>
      </View>
      <View style={{ flex: 1 }}>
        <BodyBold>{title}</BodyBold>
        <Body style={{ color: colors.inkFaint, fontSize: 12 }}>{sub}</Body>
      </View>
      <Body style={{ color: colors.inkFaint, fontSize: 20 }}>›</Body>
    </Pressable>
  );
}

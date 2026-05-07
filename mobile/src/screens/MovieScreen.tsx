import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { Chip } from '@/components/Chip';
import { StatusPill } from '@/components/StatusPill';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono } from '@/components/Text';
import { Button } from '@/components/Button';
import { TabBar } from '@/components/TabBar';
import { useMovie } from '@/hooks/queries/useMovie';
import { useMarkWatched, useUpdateMovie } from '@/hooks/mutations/useUpdateMovie';
import { useDeleteMovie } from '@/hooks/mutations/useDeleteMovie';

export function MovieScreen({ id }: { id: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const movieId = parseInt(id, 10);

  const { data: item, isLoading } = useMovie(movieId);
  const { mutateAsync: markWatched, isPending: markingWatched } = useMarkWatched(movieId);
  const { mutateAsync: deleteMovie, isPending: deleting } = useDeleteMovie();

  const movie = item?.movie;
  const watched = item?.status === 'watched';
  const hasImage = !!movie?.poster_url;

  if (isLoading || !item || !movie) {
    return (
      <Phone>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.ink} />
        </View>
      </Phone>
    );
  }

  const handleMarkWatched = async () => {
    try {
      await markWatched();
      router.push({ pathname: '/rate', params: { title: movie.title_ru ?? movie.title_original ?? '', movieId: id } } as any);
    } catch {
      Alert.alert('Ошибка', 'Не удалось обновить статус');
    }
  };

  const handleDelete = () => {
    Alert.alert('Удалить фильм?', `«${movie.title_ru ?? movie.title_original}» будет удалён из твоего списка.`, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMovie(movieId);
            router.back();
          } catch {
            Alert.alert('Ошибка', 'Не удалось удалить фильм');
          }
        },
      },
    ]);
  };

  const handleShare = () => {
    router.push({
      pathname: '/share',
      params: {
        title: movie.title_ru ?? movie.title_original ?? '',
        year: String(movie.year ?? ''),
        rating: String(item.rating ?? ''),
      },
    } as any);
  };

  const actors = movie.persons?.filter(p => p.role_type === 'actor').map(p => p.person.name).join(' · ');
  const directors = movie.persons?.filter(p => p.role_type === 'director').map(p => p.person.name).join(', ');

  return (
    <Phone>
      <View style={[styles.hero, { backgroundColor: theme.paper2 }]}>
        <Poster
          aspectRatio={undefined}
          height={300}
          posterUrl={movie.poster_url}
          label={movie.title_ru?.slice(0, 8) ?? 'ПОСТЕР'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 0, borderWidth: 0 } as any}
        />
        {hasImage && (
          <View style={[styles.heroFade, { backgroundColor: 'rgba(0,0,0,0.38)' }]} />
        )}
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: hasImage ? '#fff' : theme.ink }}>←</Text>
          </Pressable>
          <Pressable onPress={handleShare}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: hasImage ? '#fff' : theme.ink }}>↗</Text>
          </Pressable>
        </View>
        <View style={styles.heroTitle}>
          <H size="xl" color={hasImage ? '#fff' : theme.ink}>{movie.title_ru ?? movie.title_original}</H>
          <Mono style={{ color: hasImage ? 'rgba(255,255,255,0.8)' : undefined }}>
            {[movie.year, movie.duration_minutes ? `${movie.duration_minutes} МИН` : null, movie.imdb_rating ? `⭐ ${movie.imdb_rating}` : null]
              .filter(Boolean)
              .join(' · ')}
          </Mono>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
          <StatusPill status={item.status} />
          {movie.categories?.map(c => (
            <Chip key={c.id} label={c.name} />
          ))}
        </View>

        {watched && item.rating != null && (
          <View style={[styles.rating, { backgroundColor: theme.shade, borderColor: theme.line }]}>
            <Mono>МОЯ ОЦЕНКА</Mono>
            <StarRow value={item.rating} size={18} />
            <Body weight="bold" size={14}>{item.rating}/10</Body>
            <Pressable
              style={{ marginLeft: 'auto' }}
              onPress={() => router.push({ pathname: '/rate', params: { title: movie.title_ru ?? '', movieId: id } } as any)}
            >
              <Text style={{ fontFamily: 'Caveat-Bold', color: theme.accentOrange }}>изм.</Text>
            </Pressable>
          </View>
        )}

        {movie.description ? (
          <>
            <Mono style={{ marginBottom: 4 }}>ОПИСАНИЕ</Mono>
            <Body color={theme.inkSoft}>{movie.description}</Body>
          </>
        ) : null}

        {actors ? (
          <View style={{ marginTop: 12 }}>
            <Body><Mono>в ролях: </Mono>{actors}</Body>
          </View>
        ) : null}
        {directors ? (
          <View style={{ marginTop: 4 }}>
            <Body><Mono>режиссёр: </Mono>{directors}</Body>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: theme.line }]}>
        {watched ? (
          <>
            <Button title="пересмотреть?" style={{ flex: 1 }} onPress={handleMarkWatched} disabled={markingWatched} />
            <Button title="↗" style={{ paddingHorizontal: 14, minWidth: 52 }} onPress={handleShare} />
            <Button title="🗑" style={{ paddingHorizontal: 14, minWidth: 52 }} onPress={handleDelete} disabled={deleting} />
          </>
        ) : (
          <>
            <Button
              title={markingWatched ? '…' : '✓ Посмотрел'}
              variant="primary"
              style={{ flex: 1 }}
              onPress={handleMarkWatched}
              disabled={markingWatched}
            />
            <Button title="↗" style={{ paddingHorizontal: 14, minWidth: 52 }} onPress={handleShare} />
            <Button title="🗑" style={{ paddingHorizontal: 14, minWidth: 52 }} onPress={handleDelete} disabled={deleting} />
          </>
        )}
      </View>
      <TabBar />
    </Phone>
  );
}

const styles = StyleSheet.create({
  hero: { height: 300, overflow: 'hidden', position: 'relative' },
  heroFade: { ...StyleSheet.absoluteFillObject },
  heroTop: {
    position: 'absolute', top: 12, left: 16, right: 16,
    flexDirection: 'row', justifyContent: 'space-between',
  },
  heroTitle: { position: 'absolute', bottom: 12, left: 16, right: 16 },
  rating: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1.5, borderRadius: 14,
    marginBottom: 10,
  },
  actions: {
    flexDirection: 'row', gap: 8,
    padding: 12,
    borderTopWidth: 1.5,
  },
});

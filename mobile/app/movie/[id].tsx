import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MoviePoster } from '@/components/movie/MoviePoster';
import { StarRating } from '@/components/movie/StarRating';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Body, BodyBold, Caption, Heading, HeadingSm } from '@/components/ui/Typography';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useDeleteMovie } from '@/hooks/mutations/useDeleteMovie';
import { useMarkWatched, useUpdateMovie } from '@/hooks/mutations/useUpdateMovie';
import { useMovie } from '@/hooks/queries/useMovie';

export default function MovieDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const movieId = parseInt(id, 10);

  const { data, isLoading } = useMovie(movieId);
  const { mutateAsync: markWatched, isPending: markingWatched } = useMarkWatched(movieId);
  const { mutateAsync: updateMovie } = useUpdateMovie(movieId);
  const { mutateAsync: deleteMovie, isPending: deleting } = useDeleteMovie();

  const [ratingPickerOpen, setRatingPickerOpen] = useState(false);

  if (isLoading || !data) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper, alignItems: 'center', justifyContent: 'center' }}>
        <Body style={{ color: colors.inkFaint }}>Загрузка...</Body>
      </SafeAreaView>
    );
  }

  const { movie, status, rating, rewatch_count } = data;
  const isProcessing = movie.processing_status === 'pending';
  const title = movie.title_ru ?? movie.title_original ?? movie.user_query ?? '—';
  const actors = movie.persons.filter((p) => p.role_type === 'actor').slice(0, 4);
  const directors = movie.persons.filter((p) => p.role_type === 'director');

  async function handleMarkWatched() {
    await markWatched();
    setRatingPickerOpen(true);
  }

  async function handleRating(value: number) {
    await updateMovie({ rating: value });
    setRatingPickerOpen(false);
  }

  async function handleShare() {
    await Share.share({
      message: `${title}${movie.year ? ` (${movie.year})` : ''} — из моей КиноКопилки`,
    });
  }

  async function handleDelete() {
    Alert.alert('Удалить из списка?', title, [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: async () => {
          await deleteMovie(movieId);
          router.back();
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Back */}
      <Pressable onPress={() => router.back()} style={{ padding: spacing.md }}>
        <Body style={{ fontFamily: fonts.caveat, fontSize: 22 }}>← назад</Body>
      </Pressable>

      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <MoviePoster
            posterUrl={movie.poster_url}
            processing={isProcessing}
            width={110}
            height={165}
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Heading style={{ lineHeight: 28 }}>{title}</Heading>
            {movie.title_original && movie.title_ru && (
              <Body style={{ color: colors.inkFaint, fontSize: 12 }}>{movie.title_original}</Body>
            )}

            <Caption>
              {[movie.year, movie.country, movie.duration_minutes ? `${movie.duration_minutes} мин` : null]
                .filter(Boolean)
                .join(' · ')}
            </Caption>

            {movie.imdb_rating && (
              <View
                style={{
                  backgroundColor: colors.yellow,
                  borderWidth: 1.5,
                  borderColor: colors.ink,
                  borderRadius: radius.full,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  alignSelf: 'flex-start',
                }}
              >
                <Body style={{ fontSize: 12 }}>⭐ {movie.imdb_rating} IMDb</Body>
              </View>
            )}

            <StatusBadge status={status} />
          </View>
        </View>

        {/* Processing state */}
        {isProcessing && (
          <View
            style={{
              backgroundColor: colors.paper2,
              borderWidth: 1.5,
              borderColor: colors.ink,
              borderRadius: radius.md,
              padding: spacing.md,
            }}
          >
            <Body style={{ color: colors.inkSoft }}>
              ⏳ Ищем данные о фильме. Обычно 5–15 секунд. Можно закрыть и вернуться позже.
            </Body>
          </View>
        )}

        {/* Genres */}
        {movie.categories.length > 0 && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {movie.categories.map((cat) => (
              <View
                key={cat.id}
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.ink,
                  borderRadius: radius.full,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Body style={{ fontSize: 12 }}>{cat.name}</Body>
              </View>
            ))}
          </View>
        )}

        {/* Rating */}
        <View style={{ gap: 6 }}>
          <Caption>Моя оценка</Caption>
          {ratingPickerOpen ? (
            <View style={{ gap: 8 }}>
              <Body style={{ color: colors.inkFaint }}>Выбери оценку:</Body>
              <StarRating value={rating} onSelect={handleRating} size={28} />
            </View>
          ) : (
            <Pressable onPress={() => setRatingPickerOpen(true)}>
              {rating != null ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <StarRating value={rating} size={22} />
                  <BodyBold>{rating}/10</BodyBold>
                </View>
              ) : (
                <Body style={{ color: colors.inkFaint }}>Нажми чтобы поставить оценку</Body>
              )}
            </Pressable>
          )}
        </View>

        {/* Description */}
        {movie.description && (
          <View style={{ gap: 6 }}>
            <Caption>Описание</Caption>
            <Body style={{ lineHeight: 22 }}>{movie.description}</Body>
          </View>
        )}

        {/* Cast */}
        {(actors.length > 0 || directors.length > 0) && (
          <View style={{ gap: 6 }}>
            <Caption>В ролях</Caption>
            <Body style={{ lineHeight: 22 }}>
              {actors.map((a) => a.person.name).join(', ')}
              {directors.length > 0 && actors.length > 0 && ' · '}
              {directors.length > 0 && `реж. ${directors.map((d) => d.person.name).join(', ')}`}
            </Body>
          </View>
        )}

        {rewatch_count > 0 && (
          <Body style={{ color: colors.inkFaint, fontSize: 12 }}>
            Пересмотрено: {rewatch_count} раз
          </Body>
        )}
      </ScrollView>

      {/* Action bar */}
      {!isProcessing && (
        <View
          style={{
            flexDirection: 'row',
            gap: spacing.sm,
            padding: spacing.md,
            borderTopWidth: 1.5,
            borderTopColor: colors.ink,
            backgroundColor: colors.paper,
          }}
        >
          {status !== 'watched' && (
            <Button
              title="✓ Посмотрел"
              variant="primary"
              style={{ flex: 1 }}
              loading={markingWatched}
              onPress={handleMarkWatched}
            />
          )}
          <Button title="↗" variant="secondary" style={{ width: 48 }} onPress={handleShare} />
          <Button
            title="🗑"
            variant="secondary"
            style={{ width: 48 }}
            loading={deleting}
            onPress={handleDelete}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

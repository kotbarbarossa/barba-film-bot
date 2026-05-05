import { Pressable, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/constants/theme';
import type { UserMovieListResponse } from '@/types/api';

import { MoviePoster } from './MoviePoster';
import { StatusBadge } from '../ui/StatusBadge';
import { Body, BodyBold, Caption } from '../ui/Typography';

interface MovieListItemProps {
  item: UserMovieListResponse;
  onPress: () => void;
}

export function MovieListItem({ item, onPress }: MovieListItemProps) {
  const { movie, status, rating } = item;
  const isProcessing = movie.processing_status === 'pending';
  const title = movie.title_ru ?? movie.title_original ?? movie.user_query ?? '—';
  const subtitle = movie.title_original && movie.title_ru ? movie.title_original : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        gap: spacing.md,
        padding: spacing.md,
        backgroundColor: pressed ? colors.shade : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: colors.shade2,
      })}
    >
      <MoviePoster
        posterUrl={movie.poster_url}
        processing={isProcessing}
        width={60}
        height={90}
      />

      <View style={{ flex: 1, gap: 4 }}>
        <BodyBold numberOfLines={2}>{title}</BodyBold>
        {subtitle && (
          <Body style={{ color: colors.inkFaint, fontSize: 12 }} numberOfLines={1}>
            {subtitle}
          </Body>
        )}

        <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
          {movie.year && (
            <Caption style={{ color: colors.inkSoft }}>{movie.year}</Caption>
          )}
          {movie.media_type && (
            <Caption>{movie.media_type === 'film' ? 'Фильм' : 'Сериал'}</Caption>
          )}
          {movie.imdb_rating && (
            <Caption style={{ color: colors.ink }}>⭐ {movie.imdb_rating}</Caption>
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 }}>
          <StatusBadge status={status} />
          {rating != null && (
            <View
              style={{
                backgroundColor: colors.yellow,
                borderWidth: 1.5,
                borderColor: colors.ink,
                borderRadius: radius.full,
                paddingHorizontal: 8,
                paddingVertical: 2,
              }}
            >
              <Body style={{ fontSize: 11, fontFamily: fonts.kalamBold }}>{rating}/10</Body>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

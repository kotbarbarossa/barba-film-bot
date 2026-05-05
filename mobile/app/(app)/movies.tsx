import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MovieListItem } from '@/components/movie/MovieListItem';
import { Body, Heading } from '@/components/ui/Typography';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useMyMovies } from '@/hooks/queries/useMyMovies';
import type { MediaType, UserMovieListResponse, WatchStatus } from '@/types/api';

type SortKey = 'added' | 'watched' | 'rating' | 'year' | 'imdb';

interface Filters {
  search: string;
  status: WatchStatus | null;
  mediaType: MediaType | null;
  sortBy: SortKey;
}

const defaultFilters: Filters = {
  search: '',
  status: null,
  mediaType: null,
  sortBy: 'added',
};

export default function MoviesScreen() {
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const { data: movies, isLoading } = useMyMovies({
    search: filters.search || undefined,
    status: filters.status ?? undefined,
  });

  const processed = useMemo(() => {
    let result: UserMovieListResponse[] = movies ?? [];

    if (filters.mediaType) {
      result = result.filter((m) => m.movie.media_type === filters.mediaType);
    }

    return result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'watched':
          return (b.watched_at ?? '').localeCompare(a.watched_at ?? '');
        case 'rating':
          return (b.rating ?? 0) - (a.rating ?? 0);
        case 'year':
          return (b.movie.year ?? 0) - (a.movie.year ?? 0);
        case 'imdb':
          return (b.movie.imdb_rating ?? 0) - (a.movie.imdb_rating ?? 0);
        default:
          return b.added_at.localeCompare(a.added_at);
      }
    });
  }, [movies, filters.mediaType, filters.sortBy]);

  function set<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  const activeFiltersCount = [filters.status, filters.mediaType].filter(Boolean).length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      {/* Header */}
      <View style={{ padding: spacing.md, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Heading>Мои фильмы</Heading>
          <Pressable
            onPress={() => setShowFilters((v) => !v)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: radius.full,
              borderWidth: 1.5,
              borderColor: activeFiltersCount > 0 ? colors.orange : colors.ink,
              backgroundColor: activeFiltersCount > 0 ? colors.orange : 'transparent',
            }}
          >
            <Body style={{ fontSize: 12, color: activeFiltersCount > 0 ? colors.paper : colors.ink }}>
              Фильтры {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Body>
          </Pressable>
        </View>

        <TextInput
          value={filters.search}
          onChangeText={(v) => set('search', v)}
          placeholder="Поиск..."
          placeholderTextColor={colors.inkFaint}
          style={{
            fontFamily: fonts.kalam,
            fontSize: 14,
            color: colors.ink,
            backgroundColor: colors.paper2,
            borderRadius: radius.sm,
            borderWidth: 1.5,
            borderColor: colors.ink,
            paddingHorizontal: spacing.md,
            paddingVertical: 10,
          }}
        />
      </View>

      {/* Filter panel */}
      {showFilters && (
        <View
          style={{
            marginHorizontal: spacing.md,
            marginBottom: spacing.sm,
            padding: spacing.md,
            backgroundColor: colors.paper2,
            borderRadius: radius.md,
            borderWidth: 1.5,
            borderColor: colors.ink,
            gap: spacing.sm,
          }}
        >
          <Body style={{ color: colors.inkFaint, fontSize: 12 }}>Статус</Body>
          <ToggleRow
            options={[
              { label: 'Все', value: null },
              { label: 'Хочу', value: 'want' },
              { label: 'Смотрю', value: 'watching' },
              { label: 'Просмотрено', value: 'watched' },
            ]}
            value={filters.status}
            onChange={(v) => set('status', v)}
          />

          <Body style={{ color: colors.inkFaint, fontSize: 12 }}>Тип</Body>
          <ToggleRow
            options={[
              { label: 'Все', value: null },
              { label: 'Фильмы', value: 'film' },
              { label: 'Сериалы', value: 'series' },
            ]}
            value={filters.mediaType}
            onChange={(v) => set('mediaType', v)}
          />

          <Body style={{ color: colors.inkFaint, fontSize: 12 }}>Сортировка</Body>
          <ToggleRow
            options={[
              { label: 'Добавлен', value: 'added' },
              { label: 'Просмотрен', value: 'watched' },
              { label: 'Оценка', value: 'rating' },
              { label: 'Год', value: 'year' },
              { label: 'IMDb', value: 'imdb' },
            ]}
            value={filters.sortBy}
            onChange={(v) => set('sortBy', v)}
          />

          {activeFiltersCount > 0 && (
            <Pressable onPress={() => setFilters(defaultFilters)}>
              <Body style={{ color: colors.orange, fontSize: 12 }}>Сбросить фильтры</Body>
            </Pressable>
          )}
        </View>
      )}

      {/* List */}
      <FlatList
        data={processed}
        keyExtractor={(item) => String(item.movie.id)}
        renderItem={({ item }) => (
          <MovieListItem item={item} onPress={() => router.push(`/movie/${item.movie.id}`)} />
        )}
        ListEmptyComponent={
          <View style={{ padding: spacing.xl, alignItems: 'center' }}>
            <Body style={{ color: colors.inkFaint }}>
              {isLoading ? 'Загрузка...' : 'Фильмов не найдено'}
            </Body>
          </View>
        }
      />
    </SafeAreaView>
  );
}

function ToggleRow<T>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((opt) => (
        <Pressable
          key={String(opt.value)}
          onPress={() => onChange(opt.value)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: radius.full,
            borderWidth: 1.5,
            borderColor: colors.ink,
            backgroundColor: value === opt.value ? colors.ink : 'transparent',
          }}
        >
          <Body
            style={{ fontSize: 12, color: value === opt.value ? colors.paper : colors.ink }}
          >
            {opt.label}
          </Body>
        </Pressable>
      ))}
    </View>
  );
}

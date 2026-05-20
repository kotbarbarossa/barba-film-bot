import React, { useState, useMemo } from 'react';
import {
  View, FlatList, StyleSheet, Pressable, Text,
  ActivityIndicator, TextInput,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster, PosterPending, PosterMissing } from '@/components/Poster';
import { Chip } from '@/components/Chip';
import { StatusPill } from '@/components/StatusPill';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { useRouter } from 'expo-router';
import { useInfiniteMovies } from '@/hooks/queries/useInfiniteMovies';
import { useFiltersStore, isFiltersActive } from '@/store/filters.store';
import { useSettingsStore } from '@/store/settings.store';
import { movieTitle } from '@/utils/localize';
import type { UserMovieListResponse } from '@/types/api';

export function MoviesScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [searchOpen, setSearchOpen] = useState(false);

  const filters = useFiltersStore();
  const language = useSettingsStore(s => s.language);
  const apiFilters = useMemo(
    () => filters.toApiFilters(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filters.status, filters.categoryId, filters.yearFrom, filters.yearTo, filters.sort],
  );

  const {
    data,
    isLoading,
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
  } = useInfiniteMovies(apiFilters);

  const allMovies = useMemo(() => data?.pages.flat() ?? [], [data]);
  const filtersActive = isFiltersActive(filters);

  const filtered = useMemo(() => {
    let list: UserMovieListResponse[] = allMovies;

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (m: UserMovieListResponse) =>
          m.movie.title_ru?.toLowerCase().includes(q) ||
          m.movie.title_original?.toLowerCase().includes(q),
      );
    }
    if (filters.mediaType !== 'all') {
      list = list.filter((m: UserMovieListResponse) => m.movie.media_type === filters.mediaType);
    }
    if (filters.hasRating) {
      list = list.filter((m: UserMovieListResponse) => m.rating != null);
    }

    return list;
  }, [allMovies, filters.search, filters.mediaType, filters.hasRating]);

  const countByStatus = (s: string) =>
    allMovies.filter((m: UserMovieListResponse) => m.status === s).length;

  const STATUS_TABS = [
    { label: t('movies.tab_all',     { count: allMovies.length }),      value: 'all',      tone: 'solid' },
    { label: t('movies.tab_want',    { count: countByStatus('want') }),  value: 'want',     tone: 'yellow' },
    { label: t('movies.tab_watched', { count: countByStatus('watched') }), value: 'watched', tone: 'orange' },
  ] as const;

  const renderItem = ({ item }: { item: UserMovieListResponse }) => {
    const ps = item.movie.processing_status;
    const isPending = ps === 'pending';
    const isMissing = ps === 'unrecognized';
    const displayTitle =
      isPending || isMissing
        ? (item.movie.user_query ?? (movieTitle(item.movie, language) || '…'))
        : movieTitle(item.movie, language);

    return (
      <Pressable
        onPress={() =>
          router.push({ pathname: '/movie/[id]', params: { id: String(item.movie.id) } } as any)
        }
        style={[styles.item, { borderBottomColor: theme.shade2 }]}
      >
        {isPending ? (
          <PosterPending width={44} aspectRatio={2 / 3} compact />
        ) : isMissing ? (
          <PosterMissing width={44} aspectRatio={2 / 3} compact />
        ) : (
          <Poster
            width={44}
            aspectRatio={2 / 3}
            posterUrl={(language === 'en' ? item.movie.poster_url_original : null) ?? item.movie.poster_url}
            label={(movieTitle(item.movie, language) || '?').slice(0, 4)}
          />
        )}
        <View style={{ flex: 1 }}>
          <Body
            weight="bold"
            size={15}
            style={[
              { lineHeight: 20 },
              isPending && { fontStyle: 'italic' },
              isMissing && { fontStyle: 'italic', textDecorationLine: 'line-through', color: theme.accentOrange },
            ]}
          >
            {displayTitle}
          </Body>
          {isPending ? (
            <Mono size={11} color={theme.ink}>{t('movies.processing')}</Mono>
          ) : isMissing ? (
            <Mono size={11} color={theme.accentOrange}>{t('movies.not_found_label')}</Mono>
          ) : (
            <Mono size={11} style={{ textTransform: 'none' }}>
              {[
                item.movie.year,
                item.movie.media_type === 'film'
                  ? t('movies.type_film')
                  : item.movie.media_type === 'series'
                  ? t('movies.type_series')
                  : null,
              ]
                .filter(Boolean)
                .join(' · ')}
            </Mono>
          )}
          {!isPending && !isMissing && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap', paddingRight: 10 }}>
              <StatusPill status={item.status} size={10} />
              {item.rating != null ? (
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 4 }}>
                  <View style={{ marginTop: 1 }}><StarRow value={item.rating} size={13} /></View>
                  <Text style={{ fontFamily: 'Neucha', fontSize: 14, lineHeight: 14, color: theme.ink, minWidth: 28, includeFontPadding: false, marginTop: 3 }} numberOfLines={1}>{item.rating}</Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
        <Text style={{ fontFamily: 'Neucha', fontSize: 22, lineHeight: 26, paddingVertical: 4, color: theme.inkFaint }}>›</Text>
      </Pressable>
    );
  };

  return (
    <Phone>
      {/* ── Header ── */}
      <View style={[styles.headerRow, { paddingHorizontal: 16, paddingTop: 12 }]}>
        <View style={{ flex: 1 }}>
          <H size="lg">{t('movies.title')}</H>
          <ArtNote>{t('movies.in_collection', { count: allMovies.length })}</ArtNote>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {filtersActive && (
            <Pressable
              style={[styles.headerBtn, { borderColor: theme.accentOrange, backgroundColor: theme.accentOrange }]}
              onPress={() => {
                filters.reset();
                setSearchOpen(false);
              }}
            >
              <Text style={{ fontSize: 12 }}>✕</Text>
            </Pressable>
          )}
          <Pressable
            style={[styles.headerBtn, { borderColor: searchOpen ? theme.ink : theme.line }]}
            onPress={() => {
              if (searchOpen) filters.setFilters({ search: '' });
              setSearchOpen((v) => !v);
            }}
          >
            <Text>🔍</Text>
          </Pressable>
          <Pressable
            style={[
              styles.headerBtn,
              { borderColor: filtersActive ? theme.accentOrange : theme.line },
            ]}
            onPress={() => router.push('/filters' as any)}
          >
            <Text style={{ color: theme.ink }}>⚙</Text>
          </Pressable>
        </View>
      </View>

      {/* ── Search ── */}
      {searchOpen && (
        <View style={{ paddingHorizontal: 16, paddingTop: 6 }}>
          <TextInput
            autoFocus
            value={filters.search}
            onChangeText={(text) => filters.setFilters({ search: text })}
            placeholder={t('movies.search_placeholder')}
            placeholderTextColor={theme.inkFaint}
            style={[
              styles.searchInput,
              { borderColor: theme.line, color: theme.ink, backgroundColor: theme.paper2 },
            ]}
          />
        </View>
      )}

      {/* ── Status tabs ── */}
      <View style={styles.tabsRow}>
        {STATUS_TABS.map((tab) => (
          <Pressable
            key={tab.value}
            onPress={() => filters.setFilters({ status: tab.value })}
            style={{ marginRight: 6 }}
          >
            <Chip
              label={tab.label}
              tone={filters.status === tab.value ? tab.tone : undefined}
            />
          </Pressable>
        ))}
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', paddingTop: 48 }}>
          <ActivityIndicator color={theme.ink} />
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && { flex: 1 },
          ]}
          onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isFetchingNextPage
              ? <ActivityIndicator color={theme.ink} style={{ paddingVertical: 16 }} />
              : null
          }
          ListEmptyComponent={
            <EmptyListState filtersActive={filtersActive} onReset={() => filters.reset()} />
          }
        />
      )}
    </Phone>
  );
}

function EmptyListState({
  filtersActive, onReset,
}: { filtersActive: boolean; onReset: () => void }) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  if (filtersActive) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <Text style={{ fontSize: 36 }}>🔍</Text>
        <ArtNote style={{ textAlign: 'center' }}>{t('movies.nothing_found')}</ArtNote>
        <Pressable onPress={onReset}>
          <Text style={{ fontFamily: 'Neucha', fontSize: 15, lineHeight: 18, paddingVertical: 4, color: theme.accentOrange }}>
            {t('movies.reset_filters')}
          </Text>
        </Pressable>
      </View>
    );
  }
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ArtNote style={{ textAlign: 'center' }}>{t('movies.empty_collection')}</ArtNote>
    </View>
  );
}


const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerBtn: {
    width: 32, height: 32, borderRadius: 999, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  searchInput: {
    borderWidth: 1.5, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 4,
    fontFamily: 'Neucha', fontSize: 16, lineHeight: 19,
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  listContent: {
    padding: 16,
  },
  item: {
    flexDirection: 'row', gap: 10,
    paddingBottom: 8, marginBottom: 8,
    borderBottomWidth: 1, alignItems: 'center',
  },
});

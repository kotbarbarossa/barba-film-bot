import React, { useState } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Chip } from '@/components/Chip';
import { H, Body, Mono } from '@/components/Text';
import { Button } from '@/components/Button';
import { useMyCategories } from '@/hooks/queries/useMyCategories';
import type { CategoryResponse } from '@/types/api';
import {
  useFiltersStore,
  isFiltersActive,
  type MediaTypeFilter,
  type SortOption,
  type StatusFilter,
} from '@/store/filters.store';
import { useSettingsStore } from '@/store/settings.store';
import { genreName } from '@/utils/localize';

export function FiltersScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const stored = useFiltersStore();
  const lang = useSettingsStore((s) => s.language);
  const { data: categories = [] as CategoryResponse[], isLoading: catsLoading } = useMyCategories();

  const [status, setStatus] = useState<StatusFilter>(stored.status);
  const [categoryId, setCategoryId] = useState<number | null>(stored.categoryId);
  const [mediaType, setMediaType] = useState<MediaTypeFilter>(stored.mediaType);
  const [yearFrom, setYearFrom] = useState<number | null>(stored.yearFrom);
  const [yearTo, setYearTo] = useState<number | null>(stored.yearTo);
  const [hasRating, setHasRating] = useState(stored.hasRating);
  const [sort, setSort] = useState<SortOption>(stored.sort);

  const STATUS_OPTIONS: { label: string; value: StatusFilter }[] = [
    { label: t('filters.all'),     value: 'all' },
    { label: t('filters.want'),    value: 'want' },
    { label: t('filters.watched'), value: 'watched' },
  ];

  const MEDIA_TYPES: { label: string; value: MediaTypeFilter }[] = [
    { label: t('filters.all'),    value: 'all' },
    { label: t('filters.films'),  value: 'film' },
    { label: t('filters.series'), value: 'series' },
  ];

  const YEAR_PERIODS: { label: string; from: number | null; to: number | null }[] = [
    { label: t('filters.any'),          from: null, to: null },
    { label: t('filters.before_1990'),  from: null, to: 1989 },
    { label: t('filters.nineties'),     from: 1990, to: 1999 },
    { label: t('filters.noughties'),    from: 2000, to: 2009 },
    { label: t('filters.tens'),         from: 2010, to: 2019 },
    { label: '2020+',                   from: 2020, to: null },
  ];

  const SORTS: { label: string; value: SortOption }[] = [
    { label: t('filters.year_desc'),     value: 'year_desc' },
    { label: t('filters.rating_desc'),   value: 'rating_desc' },
    { label: t('filters.added_desc'),    value: 'added_desc' },
    { label: t('filters.watched_first'), value: 'watched_first' },
  ];

  const activePeriod = YEAR_PERIODS.find((p) => p.from === yearFrom && p.to === yearTo);
  const selectedCategory = categories.find((c) => c.id === categoryId);

  const draftActive = isFiltersActive({
    ...stored,
    status, categoryId, mediaType, yearFrom, yearTo, hasRating, sort,
  });

  const handleReset = () => {
    setStatus('all');
    setCategoryId(null);
    setMediaType('all');
    setYearFrom(null);
    setYearTo(null);
    setHasRating(false);
    setSort('added_desc');
  };

  const handleApply = () => {
    stored.setFilters({ status, categoryId, mediaType, yearFrom, yearTo, hasRating, sort });
    router.back();
  };

  return (
    <Phone safeBottom>
      <View style={[styles.header, { paddingHorizontal: 16, borderBottomColor: theme.line }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: 'Neucha', fontSize: 22, lineHeight: 26, paddingVertical: 4, letterSpacing: 2, color: theme.ink }}>✕</Text>
        </Pressable>
        <H size="md" style={{ flexShrink: 0 }}>{t('filters.title')}</H>
        <Pressable onPress={handleReset}>
          <Text style={{ fontFamily: 'Neucha', fontSize: 16, lineHeight: 19, paddingVertical: 4, letterSpacing: 1, color: draftActive ? theme.accentOrange : theme.inkFaint }}>
            {t('filters.reset')}
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 96 }}>

        <Section title={t('filters.status')}>
          <View style={styles.chipsWrap}>
            {STATUS_OPTIONS.map((s) => (
              <Pressable key={s.value} onPress={() => setStatus(s.value)}>
                <Chip label={s.label} tone={
                  status === s.value
                    ? s.value === 'want' ? 'yellow'
                    : s.value === 'watching' ? 'blue'
                    : s.value === 'watched' ? 'orange'
                    : 'solid'
                    : undefined
                } />
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title={t('filters.type')}>
          <View style={styles.chipsWrap}>
            {MEDIA_TYPES.map((mt) => (
              <Pressable key={mt.value} onPress={() => setMediaType(mt.value)}>
                <Chip label={mt.label} tone={mediaType === mt.value ? 'solid' : undefined} />
              </Pressable>
            ))}
          </View>
        </Section>

        <Section
          title={t('filters.genre')}
          hint={selectedCategory ? genreName(selectedCategory, lang) : undefined}
        >
          {catsLoading ? (
            <ActivityIndicator color={theme.inkSoft} style={{ alignSelf: 'flex-start' }} />
          ) : (
            <View style={styles.chipsWrap}>
              <Pressable onPress={() => setCategoryId(null)}>
                <Chip label={t('filters.any')} tone={categoryId === null ? 'solid' : undefined} />
              </Pressable>
              {categories.map((c) => (
                <Pressable key={c.id} onPress={() => setCategoryId(categoryId === c.id ? null : c.id)}>
                  <Chip label={genreName(c, lang)} tone={categoryId === c.id ? 'orange' : undefined} />
                </Pressable>
              ))}
            </View>
          )}
        </Section>

        <Section
          title={t('filters.year')}
          hint={activePeriod && activePeriod.label !== t('filters.any') ? activePeriod.label : undefined}
        >
          <View style={styles.chipsWrap}>
            {YEAR_PERIODS.map((p) => {
              const active = p.from === yearFrom && p.to === yearTo;
              return (
                <Pressable key={p.label} onPress={() => { setYearFrom(p.from); setYearTo(p.to); }}>
                  <Chip label={p.label} tone={active ? 'yellow' : undefined} />
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Section title={t('filters.rating_section')}>
          <Pressable
            onPress={() => setHasRating(!hasRating)}
            style={[styles.toggleRow, { borderColor: theme.line }]}
          >
            <Body size={14}>{t('filters.only_rated')}</Body>
            <View style={[styles.toggle, { backgroundColor: hasRating ? theme.ink : theme.paper2, borderColor: theme.line }]}>
              <View style={[styles.toggleDot, { backgroundColor: theme.paper, borderColor: theme.line, marginLeft: hasRating ? 18 : 0 }]} />
            </View>
          </Pressable>
        </Section>

        <Section title={t('filters.sort')}>
          <View style={{ gap: 6 }}>
            {SORTS.map((s) => {
              const active = sort === s.value;
              return (
                <Pressable
                  key={s.value}
                  onPress={() => setSort(s.value)}
                  style={[styles.sortRow, {
                    borderColor: theme.line,
                    backgroundColor: active ? theme.accentYellow : 'transparent',
                  }]}
                >
                  <Body size={14} color={active ? theme.onYellow : theme.ink}>{s.label}</Body>
                  {active && <Mono color={theme.onYellow}>✓</Mono>}
                </Pressable>
              );
            })}
          </View>
        </Section>

      </ScrollView>

      <View style={[styles.actions, { borderTopColor: theme.line, backgroundColor: theme.paper }]}>
        <Button title={t('filters.apply')} variant="primary" full onPress={handleApply} />
      </View>
    </Phone>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: 22 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 }}>
        <H size="md" style={{ flexShrink: 0 }}>{title + ' '}</H>
        {hint ? (
          <Mono style={{ color: theme.accentOrange, flex: 1, minWidth: 0 }} numberOfLines={1}>
            {hint}
          </Mono>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1.5,
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toggleRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, paddingHorizontal: 14,
    borderWidth: 1.5, borderRadius: 12,
  },
  toggle: {
    width: 40, height: 22, borderRadius: 11, borderWidth: 1.5,
    padding: 1, justifyContent: 'center',
  },
  toggleDot: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 1.5,
  },
  sortRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 14,
    borderWidth: 1.5, borderRadius: 12,
  },
  actions: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    padding: 12, borderTopWidth: 1.5,
  },
});

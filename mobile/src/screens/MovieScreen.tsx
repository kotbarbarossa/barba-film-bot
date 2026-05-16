import React from 'react';
import { View, ScrollView, StyleSheet, Pressable, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster, PosterPending, PosterMissing } from '@/components/Poster';
import { Chip } from '@/components/Chip';
import { StatusPill } from '@/components/StatusPill';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { TabBar } from '@/components/TabBar';
import { useMovie } from '@/hooks/queries/useMovie';
import { useMarkWatched, useUpdateMovie } from '@/hooks/mutations/useUpdateMovie';
import { useDeleteMovie } from '@/hooks/mutations/useDeleteMovie';
import { useSettingsStore } from '@/store/settings.store';
import { movieTitle, genreName, personName } from '@/utils/localize';
import type { UserMovieDetailResponse } from '@/types/api';

export function MovieScreen({ id }: { id: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const movieId = parseInt(id, 10);

  const { data: item, isLoading } = useMovie(movieId);
  const { mutateAsync: markWatched, isPending: markingWatched } = useMarkWatched(movieId);
  const { mutateAsync: deleteMovie, isPending: deleting } = useDeleteMovie();
  const language = useSettingsStore(s => s.language);

  const movie = item?.movie;
  const watched = item?.status === 'watched';
  const isEn = language === 'en';
  const posterUrl = (isEn ? movie?.poster_url_original : null) ?? movie?.poster_url ?? null;
  const description = (isEn ? movie?.description_original : null) ?? movie?.description ?? null;
  const hasImage = !!posterUrl;

  if (isLoading || !item || !movie) {
    return (
      <Phone>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator color={theme.ink} />
        </View>
      </Phone>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      t('movie.delete_title'),
      t('movie.delete_body', { title: movie.user_query ?? movieTitle(movie, language) }),
      [
        { text: t('movie.cancel'), style: 'cancel' },
        {
          text: t('movie.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteMovie(movieId);
              router.back();
            } catch {
              Alert.alert(t('movie.error'), t('movie.delete_error'));
            }
          },
        },
      ],
    );
  };

  if (movie.processing_status === 'pending') {
    return <PendingView item={item} onBack={() => router.back()} onDelete={handleDelete} deleting={deleting} />;
  }

  if (movie.processing_status === 'unrecognized') {
    return <MissingView item={item} onBack={() => router.back()} onDelete={handleDelete} deleting={deleting} />;
  }

  const handleMarkWatched = async () => {
    try {
      await markWatched();
      router.push({ pathname: '/rate', params: { title: movieTitle(movie, language), movieId: id, posterUrl: posterUrl ?? '' } } as any);
    } catch {
      Alert.alert(t('movie.error'), t('movie.update_error'));
    }
  };

  const handleShare = () => {
    router.push({
      pathname: '/share',
      params: {
        id: String(movieId),
        title: movieTitle(movie, language),
        year: String(movie.year ?? ''),
        rating: String(item.rating ?? ''),
        posterUrl: posterUrl ?? '',
      },
    } as any);
  };

  const actors = movie.persons?.filter(p => p.role_type === 'actor').map(p => personName(p.person, language)).join(' · ');
  const directors = movie.persons?.filter(p => p.role_type === 'director').map(p => personName(p.person, language)).join(', ');

  return (
    <Phone>
      <View style={[styles.hero, { backgroundColor: theme.paper2 }]}>
        <Poster
          aspectRatio={undefined}
          height={300}
          posterUrl={posterUrl}
          label={movieTitle(movie, language).slice(0, 8) || 'POSTER'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, borderRadius: 0, borderWidth: 0 } as any}
        />
        {hasImage && (
          <View style={[styles.heroFade, { backgroundColor: 'rgba(0,0,0,0.38)' }]} />
        )}
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: hasImage ? '#fff' : theme.ink }}>←</Text>
          </Pressable>
        </View>
        <View style={styles.heroTitle}>
          <H size="xl" color={hasImage ? '#fff' : theme.ink}>{movieTitle(movie, language)}</H>
          <Mono style={{ color: hasImage ? 'rgba(255,255,255,0.8)' : undefined }}>
            {[movie.year, movie.duration_minutes ? `${movie.duration_minutes} ${t('movie.min')}` : null, movie.imdb_rating ? `⭐ ${movie.imdb_rating}` : null]
              .filter(Boolean)
              .join(' · ')}
          </Mono>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 18, paddingTop: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            <StatusPill status={item.status} />
          {movie.categories?.map(c => (
            <Chip key={c.id} label={genreName(c, language)} />
          ))}
        </View>

        {watched && item.rating != null && (
          <View style={[styles.rating, { backgroundColor: theme.shade, borderColor: theme.line }]}>
            <Mono>{t('movie.my_rating')}</Mono>
            <StarRow value={item.rating} size={18} />
            <Body weight="bold" size={14}>{item.rating}/10</Body>
            <Pressable
              style={{ marginLeft: 'auto' }}
              onPress={() => router.push({ pathname: '/rate', params: { title: movieTitle(movie, language), movieId: id, posterUrl: posterUrl ?? '' } } as any)}
            >
              <Text style={{ fontFamily: 'Caveat-Bold', color: theme.accentOrange }}>{t('movie.edit')}</Text>
            </Pressable>
          </View>
        )}

        {description ? (
          <>
            <Mono style={{ marginBottom: 4 }}>{t('movie.description')}</Mono>
            <Body color={theme.inkSoft}>{description}</Body>
          </>
        ) : null}

        {actors ? (
          <View style={{ marginTop: 12 }}>
            <Body><Mono>{t('movie.cast')}</Mono>{actors}</Body>
          </View>
        ) : null}
        {directors ? (
          <View style={{ marginTop: 4 }}>
            <Body><Mono>{t('movie.director')}</Mono>{directors}</Body>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.actions, { borderTopColor: theme.line }]}>
        {watched ? (
          <>
            <Button
              title={t('share.button')}
              style={{ flex: 1, backgroundColor: theme.accentYellow }}
              textStyle={{ color: '#111' }}
              onPress={handleShare}
            />
            <Button title={t('movie.rewatch')} style={{ flex: 1 }} onPress={handleMarkWatched} disabled={markingWatched} />
            <Button title="🗑" style={{ paddingHorizontal: 14, minWidth: 52 }} onPress={handleDelete} disabled={deleting} />
          </>
        ) : (
          <>
            <Button
              title={t('share.button')}
              style={{ flex: 1, backgroundColor: theme.accentYellow }}
              textStyle={{ color: '#111' }}
              onPress={handleShare}
            />
            <Button
              title={markingWatched ? '…' : t('movie.watched')}
              variant="primary"
              style={{ flex: 1 }}
              onPress={handleMarkWatched}
              disabled={markingWatched}
            />
            <Button title="🗑" style={{ paddingHorizontal: 14, minWidth: 52 }} onPress={handleDelete} disabled={deleting} />
          </>
        )}
      </View>
      <TabBar />
    </Phone>
  );
}

// ─── Internal: Pending & Missing views ───────────────────────────────────────

type SubViewProps = {
  item: UserMovieDetailResponse;
  onBack: () => void;
  onDelete: () => void;
  deleting: boolean;
};

function PendingView({ item, onBack, onDelete, deleting }: SubViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore(s => s.language);
  const displayTitle = item.movie.user_query ?? (movieTitle(item.movie, language) || '…');

  return (
    <Phone safeBottom>
      <View style={subStyles.header}>
        <Pressable onPress={onBack}>
          <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: theme.ink }}>{t('movie.back')}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={subStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <PosterPending
          width={168}
          style={{
            alignSelf: 'center',
            shadowColor: theme.shade2,
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 4,
            transform: [{ rotate: '-2deg' }],
          }}
        />

        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <ArtNote color={theme.inkFaint}>{t('movie.pending_you_added')}</ArtNote>
          <H size="xl" style={{ textAlign: 'center', marginTop: 4 }}>«{displayTitle}»</H>
        </View>

        <View style={[subStyles.statusBox, { backgroundColor: theme.shade, borderColor: theme.line }]}>
          <View style={[subStyles.statusIcon, { backgroundColor: theme.accentYellow, borderColor: theme.ink }]}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 16, lineHeight: 20 }}>⌛</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: theme.ink, lineHeight: 24 }}>
              {t('movie.pending_searching')}
            </Text>
            <Body color={theme.inkSoft} style={{ marginTop: 4 }}>
              {t('movie.pending_body')}
            </Body>
            <View style={[subStyles.progress, { backgroundColor: theme.shade2, marginTop: 10 }]}>
              <View style={[subStyles.progressFill, { backgroundColor: theme.ink }]} />
            </View>
          </View>
        </View>

        <ArtNote color={theme.inkSoft} style={{ textAlign: 'center', marginTop: 18, lineHeight: 18 }}>
          {t('movie.pending_close')}
        </ArtNote>
      </ScrollView>

      <View style={[subStyles.actionBar, { borderTopColor: theme.line }]}>
        <View style={{ flex: 1 }} />
        <Button title={t('movie.delete_action')} onPress={onDelete} disabled={deleting} />
      </View>
    </Phone>
  );
}

function MissingView({ item, onBack, onDelete, deleting }: SubViewProps) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const language = useSettingsStore(s => s.language);
  const displayTitle = item.movie.user_query ?? (movieTitle(item.movie, language) || '…');

  return (
    <Phone safeBottom>
      <View style={subStyles.header}>
        <Pressable onPress={onBack}>
          <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: theme.ink }}>{t('movie.back')}</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={subStyles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <PosterMissing
          width={168}
          style={{
            alignSelf: 'center',
            shadowColor: theme.shade2,
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 0,
            elevation: 4,
            transform: [{ rotate: '2deg' }],
          }}
        />

        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <ArtNote color={theme.inkFaint}>{t('movie.missing_you_searched')}</ArtNote>
          <H size="xl" style={{ textAlign: 'center', marginTop: 4 }}>«{displayTitle}»</H>
        </View>

        <View style={[subStyles.statusBox, { backgroundColor: theme.shade, borderColor: theme.line }]}>
          {/* Circle border + ? as siblings — avoids Android borderRadius text clipping */}
          <View style={{ width: 28, height: 28, flexShrink: 0 }}>
            <View style={[subStyles.statusIcon, { backgroundColor: theme.paper2, borderColor: theme.ink }]} />
            <Text style={{
              position: 'absolute', top: 0, left: 0, width: 28, height: 28,
              textAlign: 'center', textAlignVertical: 'center',
              fontFamily: 'Caveat-Bold', fontSize: 18, color: theme.accentOrange,
              includeFontPadding: false,
            }}>?</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: theme.ink, lineHeight: 24 }}>
              {t('movie.missing_title')}
            </Text>
            <Body color={theme.inkSoft} style={{ marginTop: 4 }}>
              {t('movie.missing_body')}
            </Body>
          </View>
        </View>

        <ArtNote color={theme.inkSoft} style={{ textAlign: 'center', marginTop: 18, lineHeight: 18 }}>
          {t('movie.missing_hint')}
        </ArtNote>
      </ScrollView>

      <View style={[subStyles.actionBar, { borderTopColor: theme.line }]}>
        <View style={{ flex: 1 }} />
        <Button title={t('movie.delete_action')} onPress={onDelete} disabled={deleting} />
      </View>
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

const subStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  scroll: {
    padding: 22,
    paddingTop: 8,
    alignItems: 'stretch',
  },
  statusBox: {
    marginTop: 22,
    padding: 14,
    borderWidth: 1.5,
    borderRadius: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  statusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  progress: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    width: '60%',
    height: '100%',
    borderRadius: 2,
  },
  actionBar: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
    borderTopWidth: 1.5,
  },
});

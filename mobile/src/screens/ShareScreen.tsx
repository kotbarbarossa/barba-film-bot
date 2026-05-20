import React, { useRef, useState } from 'react';
import { View, StyleSheet, Pressable, Text, Share, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { captureRef } from 'react-native-view-shot';
import RNShare from 'react-native-share';
import { SHARE_BASE_URL } from '@/constants/env';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { useMovieCharts } from '@/hooks/queries/useCharts';


export function ShareScreen({
  id,
  title = '',
  year,
  rating,
  posterUrl,
}: {
  id?: string;
  title?: string;
  year?: number | string;
  rating?: number | string;
  posterUrl?: string;
}) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const cardRef = useRef<View>(null);
  const [sharing, setSharing] = useState(false);
  const numericId = id ? parseInt(id, 10) : 0;
  const { data: chartData } = useMovieCharts(numericId, !!id);

  const numYear = typeof year === 'string' ? parseInt(year, 10) : year;
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;

  const buildMessage = () => {
    let line = title;
    if (numYear) line += ` (${numYear})`;
    if (numRating && numRating > 0) line += ` — ${t('share.my_rating')} ${numRating}/10`;
    if (id) {
      return `${line}\n\n${SHARE_BASE_URL}/share/movie/${id}`;
    }
    return line;
  };

  const onShare = async () => {
    setSharing(true);
    try {
      const message = buildMessage();
      if (cardRef.current) {
        const uri = await captureRef(cardRef, { format: 'png', quality: 1 });
        if (Platform.OS === 'ios') {
          const result = await Share.share({ url: uri, message });
          if (result.action === Share.sharedAction) router.back();
        } else {
          await RNShare.open({ url: `file://${uri}`, message, type: 'image/png', failOnCancel: false });
          router.back();
        }
      } else {
        const result = await Share.share({ message });
        if (result.action === Share.sharedAction) router.back();
      }
    } catch {
      // user dismissed the sheet — not an error
    } finally {
      setSharing(false);
    }
  };

  return (
    <Phone safeBottom>
      <View style={[styles.sheet, { backgroundColor: theme.paper, borderColor: theme.line }]}>
        <View style={[styles.handle, { backgroundColor: theme.inkFaint }]} />

        <View style={styles.header}>
          <H size="lg">{t('share.title')}</H>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: 'Neucha', fontSize: 22, lineHeight: 26, paddingVertical: 4, color: theme.ink }}>✕</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* Portrait card — captured and shared as image */}
          <View
            ref={cardRef}
            collapsable={false}
            style={[styles.card, { backgroundColor: theme.paper2, borderColor: theme.line }]}
          >
            <Poster
              aspectRatio={2 / 3}
              posterUrl={posterUrl}
              label={title.slice(0, 4)}
              style={{ borderRadius: 0, borderWidth: 0 } as any}
            />
            <View style={[styles.cardDivider, { backgroundColor: theme.line }]} />
            <View style={styles.cardInfo}>
              <Body weight="bold" size={17}>{title || '—'}</Body>
              {numYear ? <Mono size={12} style={{ marginTop: 2 }}>{numYear}</Mono> : null}
              {numRating != null && numRating > 0 ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 }}>
                  <StarRow value={numRating} size={15} />
                  <Body weight="bold" size={15}>{numRating}/10</Body>
                </View>
              ) : null}
              {chartData && chartData.positions.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                  {chartData.positions.map(pos => (
                    <View key={pos.chart_slug} style={[styles.chartBadge, { backgroundColor: theme.accentYellow, borderColor: theme.line }]}>
                      <Text style={{ fontFamily: 'Neucha', fontSize: 14, lineHeight: 17, paddingVertical: 4, letterSpacing: 2, color: theme.onYellow }} numberOfLines={1}>
                        {`#${pos.rank} ${t(`charts.${pos.chart_slug.replace(/-/g, '_')}_title`)} `}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </View>
            <View style={[styles.cardFooter, { borderTopColor: theme.line }]}>
              <Mono size={10} style={{ color: theme.inkFaint }}>{t('share.branding')}</Mono>
            </View>
          </View>

          <ArtNote style={{ textAlign: 'center', marginTop: 14 }}>
            {t('share.hint')}
          </ArtNote>
        </ScrollView>

        <View style={styles.actions}>
          <Button
            title={sharing ? t('share.sharing') : t('share.button')}
            full
            variant="primary"
            onPress={onShare}
            disabled={sharing}
          />
        </View>
      </View>
    </Phone>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 6, opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 4,
  },
  scroll: {
    paddingTop: 12,
    paddingBottom: 8,
  },
  card: {
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  cardDivider: {
    height: 1.5,
  },
  cardInfo: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 20,
  },
  cardFooter: {
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chartBadge: {
    paddingHorizontal: 7, paddingVertical: 4,
    borderWidth: 1.5, borderRadius: 6,
  },
  actions: {
    paddingTop: 12,
  },
});

import React from 'react';
import { View, StyleSheet, Pressable, Text, Share, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';

const TARGETS = [
  { icon: '✈',  label: 'Telegram' },
  { icon: '💬', label: 'WhatsApp' },
  { icon: '📋', label: 'Скопировать' },
  { icon: '✉',  label: 'Email' },
  { icon: '⋯',  label: 'Ещё…' },
];

export function ShareScreen({
  title = '',
  year,
  rating,
}: {
  title?: string;
  year?: number | string;
  rating?: number | string;
}) {
  const { theme } = useTheme();
  const router = useRouter();

  const numYear = typeof year === 'string' ? parseInt(year, 10) : year;
  const numRating = typeof rating === 'string' ? parseFloat(rating) : rating;

  const onSystemShare = async () => {
    try {
      await Share.share({
        message: `${title}${numYear ? ` (${numYear})` : ''}${numRating ? ` — моя оценка ${numRating}/10` : ''}\n\nhttps://kinokopilka.app`,
      });
    } catch {}
  };

  return (
    <Phone safeBottom>
      <View style={[styles.sheet, { backgroundColor: theme.paper, borderColor: theme.line }]}>
        <View style={[styles.handle, { backgroundColor: theme.inkFaint }]} />

        <View style={[styles.header, { paddingTop: 8 }]}>
          <H size="lg">Поделиться фильмом</H>
          <Pressable onPress={() => router.back()}>
            <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: theme.ink }}>✕</Text>
          </Pressable>
        </View>

        <View style={[styles.preview, { backgroundColor: theme.paper2, borderColor: theme.line }]}>
          <Poster width={64} aspectRatio={2 / 3} label={title.slice(0, 4)} />
          <View style={{ flex: 1 }}>
            <Body weight="bold" size={14}>{title || '—'}</Body>
            {numYear ? <Mono>{numYear}</Mono> : null}
            {numRating != null && numRating > 0 ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <StarRow value={numRating} size={12} />
                <Body weight="bold" size={12}>{numRating}/10</Body>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.targets}>
          {TARGETS.map(t => (
            <Pressable
              key={t.label}
              onPress={t.label === 'Ещё…' ? onSystemShare : undefined}
              style={styles.target}
            >
              <View style={[styles.targetIcon, { borderColor: theme.line, backgroundColor: theme.paper2 }]}>
                <Text style={{ fontSize: 22 }}>{t.icon}</Text>
              </View>
              <Body size={11} style={{ marginTop: 4 }}>{t.label}</Body>
            </Pressable>
          ))}
        </View>

        <ArtNote style={{ textAlign: 'center', marginTop: 12 }}>
          получатель увидит карточку и сможет сразу добавить фильм себе
        </ArtNote>

        <View style={{ marginTop: 'auto' }}>
          <Button
            title={Platform.OS === 'ios' ? 'Системное «Поделиться»' : 'Открыть «Поделиться»'}
            full
            onPress={onSystemShare}
          />
        </View>
      </View>
    </Phone>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 18, paddingBottom: 16,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 6, opacity: 0.5,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  preview: {
    flexDirection: 'row', gap: 12,
    padding: 10, marginTop: 14,
    borderWidth: 1.5, borderRadius: 14,
  },
  targets: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  target: { alignItems: 'center', flex: 1 },
  targetIcon: {
    width: 48, height: 48, borderRadius: 12, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
});

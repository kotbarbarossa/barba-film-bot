import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { StarRow } from '@/components/StarRow';
import { H, Body, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { useUpdateMovie } from '@/hooks/mutations/useUpdateMovie';

const QUICK_KEYS = [
  { v: 10, key: 'rating.masterpiece' },
  { v: 9,  key: 'rating.excellent' },
  { v: 8,  key: 'rating.great' },
  { v: 7,  key: 'rating.fine' },
  { v: 5,  key: 'rating.meh' },
  { v: 3,  key: 'rating.bad' },
] as const;

export function RatingPromptScreen({ title = '', movieId, posterUrl }: { title?: string; movieId?: string; posterUrl?: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [value, setValue] = useState(0);
  const numericId = movieId ? parseInt(movieId, 10) : 0;
  const { mutateAsync, isPending } = useUpdateMovie(numericId);

  const handleSave = async (rating: number | null) => {
    if (numericId > 0) {
      try {
        await mutateAsync({ rating });
      } catch {
        Alert.alert(t('rating.error'), t('rating.save_error'));
      }
    }
    router.back();
  };

  return (
    <Phone safeBottom>
      <View style={[styles.sheet, { backgroundColor: theme.paper, borderColor: theme.line }]}>
        <View style={[styles.handle, { backgroundColor: theme.inkFaint }]} />

        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Poster width={80} aspectRatio={2 / 3} posterUrl={posterUrl ?? null} label={title.slice(0, 4) || '?'} />
        </View>

        <H size="lg" style={{ textAlign: 'center', marginTop: 14 }}>{t('rating.question')}</H>
        {title ? <Body color={theme.inkSoft} style={{ textAlign: 'center' }}>«{title}»</Body> : null}

        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <StarRow value={value} size={36} color={theme.accentOrange} />
          <Body weight="bold" size={32} style={{ marginTop: 8 }}>{value > 0 ? `${value}/10` : '— / 10'}</Body>
        </View>

        <View style={styles.scaleWrap}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map(n => (
            <Pressable
              key={n}
              onPress={() => setValue(n)}
              style={[styles.scaleBtn, { backgroundColor: n <= value ? theme.accentOrange : theme.paper2, borderColor: theme.line }]}
            >
              <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 16, lineHeight: 19, paddingVertical: 4, color: n <= value ? theme.paper : theme.ink }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.chipsWrap, { marginTop: 14 }]}>
          {QUICK_KEYS.map(q => (
            <Pressable
              key={q.v}
              onPress={() => setValue(q.v)}
              style={[styles.quickChip, { borderColor: theme.line, backgroundColor: value === q.v ? theme.accentYellow : 'transparent' }]}
            >
              <Body weight="bold" size={13} color={value === q.v ? theme.onYellow : theme.ink}>{q.v}</Body>
              <Body size={13} color={value === q.v ? theme.onYellow : theme.inkSoft}>{t(q.key)}</Body>
            </Pressable>
          ))}
        </View>

        <ArtNote style={{ textAlign: 'center', marginTop: 16 }}>
          {t('rating.skip_hint')}
        </ArtNote>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Button title={t('rating.no_rating')} style={{ flex: 1 }} onPress={() => handleSave(null)} disabled={isPending} />
          <Button
            title={isPending ? '…' : t('rating.save')}
            variant="primary"
            style={{ flex: 1.4 }}
            onPress={() => handleSave(value > 0 ? value : null)}
            disabled={isPending}
          />
        </View>
      </View>
    </Phone>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    paddingHorizontal: 22, paddingTop: 8, paddingBottom: 16,
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    borderTopWidth: 1.5, borderLeftWidth: 1.5, borderRightWidth: 1.5,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    alignSelf: 'center', marginTop: 6, opacity: 0.5,
  },
  scaleWrap: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  scaleBtn: {
    width: 28, height: 36, borderRadius: 8, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6 },
  quickChip: {
    flexDirection: 'row', gap: 4, alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1.5, borderRadius: 999,
  },
});

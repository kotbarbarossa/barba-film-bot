import React, { useState } from 'react';
import { View, StyleSheet, Pressable, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { Poster } from '@/components/Poster';
import { StarRow } from '@/components/StarRow';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { useUpdateMovie } from '@/hooks/mutations/useUpdateMovie';

const QUICK = [
  { v: 10, label: 'шедевр' },
  { v: 9,  label: 'отлично' },
  { v: 8,  label: 'круто' },
  { v: 7,  label: 'норм' },
  { v: 5,  label: 'так себе' },
  { v: 3,  label: 'плохо' },
];

export function RatingPromptScreen({ title = '', movieId }: { title?: string; movieId?: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [value, setValue] = useState(0);
  const numericId = movieId ? parseInt(movieId, 10) : 0;
  const { mutateAsync, isPending } = useUpdateMovie(numericId);

  const handleSave = async (rating: number | null) => {
    if (numericId > 0) {
      try {
        await mutateAsync({ rating });
      } catch {
        Alert.alert('Ошибка', 'Не удалось сохранить оценку');
      }
    }
    router.back();
  };

  return (
    <Phone safeBottom>
      <View style={[styles.sheet, { backgroundColor: theme.paper, borderColor: theme.line }]}>
        <View style={[styles.handle, { backgroundColor: theme.inkFaint }]} />

        <View style={{ alignItems: 'center', marginTop: 12 }}>
          <Poster width={80} aspectRatio={2 / 3} label="POS" />
        </View>

        <H size="lg" style={{ textAlign: 'center', marginTop: 14 }}>Как тебе фильм?</H>
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
              <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 16, color: n <= value ? theme.paper : theme.ink }}>{n}</Text>
            </Pressable>
          ))}
        </View>

        <View style={[styles.chipsWrap, { marginTop: 14 }]}>
          {QUICK.map(q => (
            <Pressable
              key={q.v}
              onPress={() => setValue(q.v)}
              style={[styles.quickChip, { borderColor: theme.line, backgroundColor: value === q.v ? theme.accentYellow : 'transparent' }]}
            >
              <Body weight="bold" size={11} color={value === q.v ? theme.onYellow : theme.ink}>{q.v}</Body>
              <Body size={11} color={value === q.v ? theme.onYellow : theme.inkSoft}>{q.label}</Body>
            </Pressable>
          ))}
        </View>

        <ArtNote style={{ textAlign: 'center', marginTop: 16 }}>
          можно оставить «без оценки» — сохраним факт просмотра
        </ArtNote>

        <View style={{ flexDirection: 'row', gap: 8, marginTop: 16 }}>
          <Button title="без оценки" style={{ flex: 1 }} onPress={() => handleSave(null)} disabled={isPending} />
          <Button
            title={isPending ? '…' : '✓ Сохранить'}
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

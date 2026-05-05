import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/Button';
import { Body, Caption, Heading } from '@/components/ui/Typography';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useAddMovie } from '@/hooks/mutations/useAddMovie';
import type { MediaType } from '@/types/api';

export default function AddScreen() {
  const [title, setTitle] = useState('');
  const [mediaType, setMediaType] = useState<MediaType>('film');
  const [year, setYear] = useState('');
  const [hint, setHint] = useState('');

  const { mutateAsync, isPending } = useAddMovie();

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) {
      Alert.alert('Введи название фильма');
      return;
    }

    const parsedYear = year ? parseInt(year, 10) : undefined;
    if (year && (isNaN(parsedYear!) || parsedYear! < 1888 || parsedYear! > 2100)) {
      Alert.alert('Введи корректный год');
      return;
    }

    try {
      const result = await mutateAsync({
        title: trimmed,
        media_type: mediaType,
        year: parsedYear,
        user_query: hint.trim() || undefined,
      });
      setTitle('');
      setYear('');
      setHint('');
      router.push(`/movie/${result.movie.id}`);
    } catch {
      Alert.alert('Ошибка', 'Не удалось добавить фильм. Попробуй ещё раз.');
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.paper }}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled"
      >
        <Heading>Добавить фильм</Heading>

        {/* Title */}
        <View style={{ gap: spacing.sm }}>
          <Caption>Название</Caption>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Достучаться до небес"
            placeholderTextColor={colors.inkFaint}
            returnKeyType="next"
            style={inputStyle}
          />
        </View>

        {/* Media type */}
        <View style={{ gap: spacing.sm }}>
          <Caption>Тип</Caption>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <TypeButton
              label="Фильм"
              active={mediaType === 'film'}
              onPress={() => setMediaType('film')}
            />
            <TypeButton
              label="Сериал"
              active={mediaType === 'series'}
              onPress={() => setMediaType('series')}
            />
          </View>
        </View>

        {/* Year (films only) */}
        {mediaType === 'film' && (
          <View style={{ gap: spacing.sm }}>
            <Caption>Год (необязательно)</Caption>
            <TextInput
              value={year}
              onChangeText={setYear}
              placeholder="1997"
              placeholderTextColor={colors.inkFaint}
              keyboardType="number-pad"
              maxLength={4}
              style={inputStyle}
            />
          </View>
        )}

        {/* Hint */}
        <View style={{ gap: spacing.sm }}>
          <Caption>Подсказка для поиска (необязательно)</Caption>
          <TextInput
            value={hint}
            onChangeText={setHint}
            placeholder="советский мультфильм, с Де Ниро..."
            placeholderTextColor={colors.inkFaint}
            multiline
            numberOfLines={2}
            style={[inputStyle, { height: 72, textAlignVertical: 'top' }]}
          />
        </View>

        <Body style={{ color: colors.inkFaint, fontSize: 12, lineHeight: 18 }}>
          После добавления мы автоматически найдём постер, описание, актёров и рейтинг IMDb.
          Обычно занимает 5–15 секунд.
        </Body>

        <Button
          title="Добавить"
          variant="primary"
          fullWidth
          loading={isPending}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function TypeButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: radius.md,
        borderWidth: 1.5,
        borderColor: colors.ink,
        backgroundColor: active ? colors.ink : 'transparent',
      }}
    >
      <Body style={{ color: active ? colors.paper : colors.ink }}>{label}</Body>
    </Pressable>
  );
}

const inputStyle = {
  fontFamily: fonts.kalam,
  fontSize: 14,
  color: colors.ink,
  backgroundColor: colors.paper2,
  borderRadius: radius.sm,
  borderWidth: 1.5,
  borderColor: colors.ink,
  paddingHorizontal: spacing.md,
  paddingVertical: 12,
} as const;

import React from 'react';
import { View, ScrollView, StyleSheet, TextInput, Pressable, Text, Alert, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, Body, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { useAddMovie } from '@/hooks/mutations/useAddMovie';

export function AddScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [title, setTitle] = React.useState('');
  const [year, setYear] = React.useState('');
  const [hint, setHint] = React.useState('');
  const [type, setType] = React.useState<'film' | 'series'>('film');

  const { mutateAsync, isPending } = useAddMovie();
  const toastOpacity = React.useRef(new Animated.Value(0)).current;

  const showToastAndRedirect = () => {
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => router.replace('/movies' as any));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Укажи название', 'Введи название фильма или сериала');
      return;
    }
    try {
      const result = await mutateAsync({
        title: title.trim(),
        media_type: type,
        year: year ? parseInt(year, 10) : undefined,
        user_query: hint.trim() || undefined,
      });
      if (result.movie.processing_status === 'pending') {
        showToastAndRedirect();
      } else {
        router.replace({ pathname: '/movie/[id]', params: { id: String(result.movie.id) } } as any);
      }
    } catch {
      Alert.alert('Ошибка', 'Не удалось найти фильм. Попробуй уточнить название.');
    }
  };

  return (
    <Phone safeBottom>
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 22, color: theme.ink }}>← назад</Text>
        </Pressable>
        <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 18, color: theme.accentOrange }}>добавить</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingTop: 8 }}>
        <H size="xl">Новый фильм</H>
        <ArtNote>достаточно названия — остальное можно оставить пустым</ArtNote>

        <View style={{ marginTop: 18 }}>
          <Mono>НАЗВАНИЕ *</Mono>
          <View style={[styles.field, { backgroundColor: theme.shade, borderColor: theme.line }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Название фильма или сериала"
              placeholderTextColor={theme.inkFaint}
              style={{ fontFamily: 'Kalam', fontSize: 15, color: theme.ink }}
            />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Mono>ТИП</Mono>
          <View style={[styles.segment, { borderColor: theme.line }]}>
            <Pressable
              onPress={() => setType('film')}
              style={[styles.segmentBtn, type === 'film' && { backgroundColor: theme.ink }]}
            >
              <Text style={[styles.segmentText, { color: type === 'film' ? theme.paper : theme.ink }]}>🎬 Фильм</Text>
            </Pressable>
            <Pressable
              onPress={() => setType('series')}
              style={[styles.segmentBtn, type === 'series' && { backgroundColor: theme.ink }]}
            >
              <Text style={[styles.segmentText, { color: type === 'series' ? theme.paper : theme.ink }]}>📺 Сериал</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={styles.labelRow}>
            <Mono>ГОД</Mono>
            <Mono color={theme.inkFaint}>необязательно</Mono>
          </View>
          <View style={[styles.field, { borderColor: theme.line }]}>
            <TextInput
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              placeholder="2024"
              placeholderTextColor={theme.inkFaint}
              style={{ fontFamily: 'Kalam', fontSize: 15, color: theme.ink }}
            />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={styles.labelRow}>
            <Mono>ПОДСКАЗКА</Mono>
            <Mono color={theme.inkFaint}>необязательно</Mono>
          </View>
          <View style={[styles.field, { borderColor: theme.line, minHeight: 50 }]}>
            <TextInput
              value={hint}
              onChangeText={setHint}
              placeholder='«советский мультфильм», «с Де Ниро»…'
              placeholderTextColor={theme.inkFaint}
              multiline
              style={{ fontFamily: 'Kalam', fontSize: 13, color: theme.ink }}
            />
          </View>
        </View>
      </ScrollView>

      <Animated.View
        style={[styles.toast, { backgroundColor: theme.accentYellow, borderColor: theme.ink, opacity: toastOpacity }]}
        pointerEvents="none"
      >
        <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 20, color: theme.ink }}>✓ Добавлено в обработку</Text>
        <Text style={{ fontFamily: 'Kalam', fontSize: 13, color: theme.inkSoft }}>
          Данные о фильме скоро появятся в списке
        </Text>
      </Animated.View>

      <View style={{ padding: 12 }}>
        <Button
          title={isPending ? 'Ищу…' : 'Найти и добавить'}
          variant="primary"
          full
          onPress={handleSubmit}
          disabled={isPending}
        />
      </View>
    </Phone>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 80,
    left: 16,
    right: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 2,
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
  },
  field: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 14,
    marginTop: 4,
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  segment: {
    flexDirection: 'row',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontFamily: 'Caveat-Bold', fontSize: 18 },
});

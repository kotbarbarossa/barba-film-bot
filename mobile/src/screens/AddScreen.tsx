import React from 'react';
import { View, StyleSheet, TextInput, Pressable, Text, Alert, Animated } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme';
import { Phone } from '@/components/Phone';
import { H, Mono, ArtNote } from '@/components/Text';
import { Button } from '@/components/Button';
import { useAddMovie } from '@/hooks/mutations/useAddMovie';

export function AddScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { t } = useTranslation();
  const [title, setTitle] = React.useState('');
  const [year, setYear] = React.useState('');
  const [hint, setHint] = React.useState('');
  const [type, setType] = React.useState<'film' | 'series'>('film');
  const [toastVariant, setToastVariant] = React.useState<'pending' | 'found'>('pending');
  const { mutateAsync, isPending } = useAddMovie();
  const toastOpacity = React.useRef(new Animated.Value(0)).current;


  const showToastAndRedirect = (variant: 'pending' | 'found') => {
    setToastVariant(variant);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1800),
      Animated.timing(toastOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => router.replace('/movies' as any));
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert(t('add.alert_title'), t('add.alert_body'));
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
        showToastAndRedirect('pending');
      } else {
        showToastAndRedirect('found');
      }
    } catch {
      Alert.alert(t('add.error'), t('add.error_body'));
    }
  };

  const toastBg = toastVariant === 'found' ? theme.accentMint : theme.accentYellow;
  const toastFg = theme.onYellow;
  const toastTitle = toastVariant === 'found' ? t('add.toast_found_title') : t('add.toast_pending_title');
  const toastSub = toastVariant === 'found' ? t('add.toast_found_sub') : t('add.toast_pending_sub');

  return (
    <Phone safeBottom>
      <View style={[styles.header, { paddingHorizontal: 16 }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: 'Neucha', fontSize: 22, lineHeight: 26, paddingVertical: 4, color: theme.ink }}>{t('add.back')}</Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={{ padding: 22, paddingTop: 8, paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        bottomOffset={16}
      >
        <H size="xl">{t('add.title')}</H>
        <ArtNote>{t('add.subtitle')}</ArtNote>

        <View style={{ marginTop: 18 }}>
          <Mono>{t('add.name_label')}</Mono>
          <View style={[styles.field, { backgroundColor: theme.shade, borderColor: theme.line }]}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t('add.name_placeholder')}
              placeholderTextColor={theme.inkFaint}
              style={{ fontFamily: 'Nunito', fontSize: 15, color: theme.ink }}
            />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <Mono>{t('add.type_label')}</Mono>
          <View style={[styles.segment, { borderColor: theme.line }]}>
            <Pressable
              onPress={() => setType('film')}
              style={[styles.segmentBtn, type === 'film' && { backgroundColor: theme.ink }]}
            >
              <Text numberOfLines={1} style={[styles.segmentText, { color: type === 'film' ? theme.paper : theme.ink }]}>{t('add.film')}</Text>
            </Pressable>
            <Pressable
              onPress={() => setType('series')}
              style={[styles.segmentBtn, type === 'series' && { backgroundColor: theme.ink }]}
            >
              <Text numberOfLines={1} style={[styles.segmentText, { color: type === 'series' ? theme.paper : theme.ink }]}>{t('add.series')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={styles.labelRow}>
            <Mono>{t('add.year_label')}</Mono>
            <Mono color={theme.inkFaint}>{t('add.optional')}</Mono>
          </View>
          <View style={[styles.field, { borderColor: theme.line }]}>
            <TextInput
              value={year}
              onChangeText={setYear}
              keyboardType="number-pad"
              placeholder="2024"
              placeholderTextColor={theme.inkFaint}
              style={{ fontFamily: 'Nunito', fontSize: 15, color: theme.ink }}
            />
          </View>
        </View>

        <View style={{ marginTop: 14 }}>
          <View style={styles.labelRow}>
            <Mono>{t('add.hint_label')}</Mono>
            <Mono color={theme.inkFaint}>{t('add.optional')}</Mono>
          </View>
          <View style={[styles.field, { borderColor: theme.line, minHeight: 50 }]}>
            <TextInput
              value={hint}
              onChangeText={setHint}
              placeholder={t('add.hint_placeholder')}
              placeholderTextColor={theme.inkFaint}
              multiline
              style={{ fontFamily: 'Nunito', fontSize: 15, color: theme.ink }}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View style={{ padding: 12 }}>
        <Button
          title={isPending ? t('add.searching') : t('add.submit')}
          variant="primary"
          full
          onPress={handleSubmit}
          disabled={isPending}
        />
      </View>

      <Animated.View
        style={[styles.toast, { backgroundColor: toastBg, borderColor: theme.ink, opacity: toastOpacity }]}
        pointerEvents="none"
      >
        <Text style={{ fontFamily: 'Neucha', fontSize: 20, lineHeight: 24, paddingVertical: 4, color: toastFg }}>{toastTitle}</Text>
        <Text style={{ fontFamily: 'Nunito', fontSize: 15, color: toastFg, opacity: 0.7 }}>{toastSub}</Text>
      </Animated.View>
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
    marginTop: 4,
  },
  segmentBtn: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  segmentText: { fontFamily: 'Neucha', fontSize: 18, lineHeight: 22, paddingVertical: 4 },
});

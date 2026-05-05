import { Image, Text, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

interface MoviePosterProps {
  posterUrl: string | null;
  processing?: boolean;
  width?: number;
  height?: number;
}

export function MoviePoster({ posterUrl, processing = false, width = 100, height = 150 }: MoviePosterProps) {
  if (processing) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius: radius.sm,
          backgroundColor: colors.paper2,
          borderWidth: 1.5,
          borderColor: colors.ink,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        <Text style={{ fontSize: 20 }}>⏳</Text>
        <Text
          style={{
            fontFamily: fonts.kalam,
            fontSize: 10,
            color: colors.inkFaint,
            textAlign: 'center',
          }}
        >
          обрабатывается
        </Text>
      </View>
    );
  }

  if (!posterUrl) {
    return (
      <View
        style={{
          width,
          height,
          borderRadius: radius.sm,
          backgroundColor: colors.paper2,
          borderWidth: 1.5,
          borderColor: colors.inkFaint,
          borderStyle: 'dashed',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: fonts.kalam, fontSize: 10, color: colors.inkFaint }}>
          ПОСТЕР
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: posterUrl }}
      style={{ width, height, borderRadius: radius.sm }}
      resizeMode="cover"
    />
  );
}

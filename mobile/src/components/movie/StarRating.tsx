import { Pressable, Text, View } from 'react-native';

import { colors } from '@/constants/theme';

interface StarRatingProps {
  value: number | null;
  max?: number;
  size?: number;
  onSelect?: (rating: number) => void;
}

export function StarRating({ value, max = 10, size = 22, onSelect }: StarRatingProps) {
  const stars = 5;
  const filled = value != null ? (value / max) * stars : 0;

  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: stars }, (_, i) => {
        const fill = Math.max(0, Math.min(1, filled - i));
        const glyph = fill >= 1 ? '★' : fill >= 0.5 ? '⯨' : '☆';

        if (onSelect) {
          return (
            <Pressable key={i} onPress={() => onSelect((i + 1) * 2)}>
              <Text style={{ fontSize: size, color: colors.ink }}>{glyph}</Text>
            </Pressable>
          );
        }
        return (
          <Text key={i} style={{ fontSize: size, color: colors.ink }}>
            {glyph}
          </Text>
        );
      })}
    </View>
  );
}

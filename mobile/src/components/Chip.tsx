import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type Tone = 'solid' | 'orange' | 'yellow' | 'blue' | undefined;

export function Chip({
  label,
  tone,
  size = 12,
  style,
}: {
  label: string;
  tone?: Tone;
  size?: number;
  style?: ViewStyle;
}) {
  const { theme } = useTheme();
  const palette = (() => {
    switch (tone) {
      case 'solid':  return { bg: theme.ink,           fg: theme.paper, border: theme.line };
      case 'orange': return { bg: theme.accentOrange,  fg: theme.paper, border: theme.line };
      case 'yellow': return { bg: theme.accentYellow,  fg: theme.onYellow, border: theme.line };
      case 'blue':   return { bg: theme.accentBlue,    fg: theme.paper, border: theme.line };
      default:       return { bg: theme.paper,         fg: theme.ink,   border: theme.line };
    }
  })();
  return (
    <View style={[styles.chip, { backgroundColor: palette.bg, borderColor: palette.border }, style]}>
      <Text style={[styles.text, { color: palette.fg, fontSize: size }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderWidth: 1.5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  text: {
    fontFamily: 'Kalam',
  },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

type Props = {
  value?: number;
  max?: number;
  size?: number;
  color?: string;
};

export function StarRow({ value = 0, max = 10, size = 18, color }: Props) {
  const { theme } = useTheme();
  const c = color ?? theme.ink;
  const fillUnits = (value / max) * 5;

  return (
    <View style={styles.row}>
      {[0, 1, 2, 3, 4].map(i => {
        const fill = Math.max(0, Math.min(1, fillUnits - i));
        return (
          <View key={i} style={{ width: size, height: size }}>
            <Text style={[styles.empty, { fontSize: size, lineHeight: size, color: c }]}>☆</Text>
            <View style={{ position: 'absolute', left: 0, top: 0, width: size * fill, height: size, overflow: 'hidden' }}>
              <Text style={[styles.full, { fontSize: size, lineHeight: size, color: c }]}>★</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  empty: { includeFontPadding: false },
  full: { includeFontPadding: false },
});

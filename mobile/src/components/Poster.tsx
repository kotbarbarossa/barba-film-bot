import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '@/theme';

type Props = {
  width?: number;
  height?: number;
  aspectRatio?: number;
  label?: string;
  posterUrl?: string | null;
  style?: ViewStyle;
};

export function Poster({ width, height, aspectRatio = 2 / 3, label = 'ПОСТЕР', posterUrl, style }: Props) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.root,
        {
          width: width ?? '100%',
          height,
          aspectRatio: height ? undefined : aspectRatio,
          backgroundColor: theme.paper2,
          borderColor: theme.line,
        },
        style,
      ]}
    >
      {posterUrl ? (
        <Image source={{ uri: posterUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      ) : (
        <>
          <View style={[styles.stripes, { borderColor: theme.shade2 }]} pointerEvents="none" />
          <View style={[styles.label, { backgroundColor: theme.paper, borderColor: theme.line }]}>
            <Text style={[styles.labelText, { color: theme.inkFaint }]}>{label}</Text>
          </View>
        </>
      )}
    </View>
  );
}

export function PosterProcessing(props: Omit<Props, 'label'>) {
  return <Poster {...props} label="⏳ ОБРАБ." />;
}

export function PosterUnrecognized(props: Omit<Props, 'label'>) {
  return <Poster {...props} label="✕ НЕ НАЙДЕН" />;
}

const styles = StyleSheet.create({
  root: {
    borderWidth: 1.5,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  stripes: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  label: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderRadius: 3,
  },
  labelText: {
    fontFamily: 'JetBrainsMono',
    fontSize: 9,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    lineHeight: 11,
  },
});

import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '@/theme';

type Variant = 'default' | 'primary' | 'accent' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'default',
  full,
  style,
  textStyle,
  height,
  fontSize,
  children,
  disabled,
}: {
  title?: string;
  onPress?: () => void;
  variant?: Variant;
  full?: boolean;
  style?: ViewStyle | ViewStyle[];
  textStyle?: TextStyle;
  height?: number;
  fontSize?: number;
  children?: React.ReactNode;
  disabled?: boolean;
}) {
  const { theme } = useTheme();
  const palette = (() => {
    switch (variant) {
      case 'primary': return { bg: theme.ink,          fg: theme.paper, border: theme.line, shadow: true };
      case 'accent':  return { bg: theme.accentOrange, fg: theme.paper, border: theme.line, shadow: true };
      case 'ghost':   return { bg: 'transparent',      fg: theme.ink,   border: theme.line, shadow: false };
      default:        return { bg: theme.paper,        fg: theme.ink,   border: theme.line, shadow: true };
    }
  })();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
          width: full ? '100%' : undefined,
          height,
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
          shadowColor: palette.shadow ? theme.line : 'transparent',
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: palette.shadow ? 1 : 0,
          shadowRadius: 0,
          elevation: palette.shadow ? 2 : 0,
        },
        ...(Array.isArray(style) ? style : style ? [style] : []),
      ]}
    >
      {children ?? (
        <Text numberOfLines={1} style={[styles.text, { color: palette.fg, fontSize: fontSize ?? 18, lineHeight: (fontSize ?? 18) * 1.2, letterSpacing: 2 }, textStyle]}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    fontFamily: 'Neucha',
    fontWeight: '600',
    textAlign: 'center',
  },
});

import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { useTheme } from '@/theme';

type Size = 'xl' | 'lg' | 'md' | 'sm';

export function H({ size = 'md', color, style, children, ...rest }: TextProps & { size?: Size; color?: string }) {
  const { theme } = useTheme();
  const fontSize = { xl: 38, lg: 28, md: 22, sm: 18 }[size];
  return (
    <RNText
      {...rest}
      style={[
        { fontFamily: 'Caveat-Bold', fontSize, color: color ?? theme.ink, lineHeight: fontSize * 1.2, paddingVertical: 4, letterSpacing: 1 },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Body({ color, style, children, weight, size = 16, ...rest }: TextProps & { color?: string; weight?: 'regular' | 'bold'; size?: number }) {
  const { theme } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        { fontFamily: weight === 'bold' ? 'Nunito-Bold' : 'Nunito', fontSize: size, color: color ?? theme.ink, lineHeight: size * 1.4 },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function Mono({ color, style, children, size = 12, ...rest }: TextProps & { color?: string; size?: number }) {
  const { theme } = useTheme();
  return (
    <RNText
      {...rest}
      style={[
        { fontFamily: 'JetBrainsMono', fontSize: size, color: color ?? theme.inkFaint, letterSpacing: 0.5, textTransform: 'uppercase', lineHeight: size * 1.5 },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

export function ArtNote({ color, children, style }: { color?: string; children: React.ReactNode; style?: TextStyle }) {
  const { theme } = useTheme();
  return (
    <RNText
      style={[
        { fontFamily: 'Nunito-Italic', fontSize: 14, color: color ?? theme.inkFaint, lineHeight: 20 },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}

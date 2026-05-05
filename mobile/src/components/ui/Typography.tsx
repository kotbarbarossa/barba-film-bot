import { Text, TextProps } from 'react-native';

import { fonts } from '@/constants/theme';

interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

export function Heading({ style, ...props }: TypographyProps) {
  return (
    <Text
      style={[{ fontFamily: fonts.caveat, fontSize: 28, color: '#1a1814', lineHeight: 32 }, style]}
      {...props}
    />
  );
}

export function HeadingLg({ style, ...props }: TypographyProps) {
  return (
    <Text
      style={[{ fontFamily: fonts.caveat, fontSize: 38, color: '#1a1814', lineHeight: 42 }, style]}
      {...props}
    />
  );
}

export function HeadingSm({ style, ...props }: TypographyProps) {
  return (
    <Text
      style={[{ fontFamily: fonts.caveat, fontSize: 22, color: '#1a1814', lineHeight: 26 }, style]}
      {...props}
    />
  );
}

export function Body({ style, ...props }: TypographyProps) {
  return (
    <Text
      style={[{ fontFamily: fonts.kalam, fontSize: 14, color: '#1a1814', lineHeight: 20 }, style]}
      {...props}
    />
  );
}

export function BodyBold({ style, ...props }: TypographyProps) {
  return (
    <Text
      style={[
        { fontFamily: fonts.kalamBold, fontSize: 14, color: '#1a1814', lineHeight: 20 },
        style,
      ]}
      {...props}
    />
  );
}

export function Caption({ style, ...props }: TypographyProps) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.kalam,
          fontSize: 11,
          color: '#9a948a',
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        },
        style,
      ]}
      {...props}
    />
  );
}

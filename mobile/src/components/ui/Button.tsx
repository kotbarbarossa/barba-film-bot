import { ActivityIndicator, Pressable, PressableProps, Text, ViewStyle } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends Omit<PressableProps, 'style'> {
  title: string;
  variant?: Variant;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<Variant, { bg: string; border: string; text: string }> = {
  primary: { bg: colors.ink, border: colors.ink, text: colors.paper },
  secondary: { bg: colors.paper, border: colors.ink, text: colors.ink },
  ghost: { bg: 'transparent', border: 'transparent', text: colors.ink },
  danger: { bg: colors.orange, border: colors.ink, text: colors.paper },
};

export function Button({ title, variant = 'secondary', loading, fullWidth, style, disabled, ...props }: ButtonProps) {
  const v = variantStyles[variant];

  return (
    <Pressable
      style={({ pressed }) => [
        {
          backgroundColor: v.bg,
          borderColor: v.border,
          borderWidth: 1.5,
          borderRadius: radius.md,
          paddingVertical: 12,
          paddingHorizontal: 20,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: 8,
          opacity: pressed || disabled ? 0.7 : 1,
          width: fullWidth ? '100%' : undefined,
          shadowColor: colors.ink,
          shadowOffset: { width: 2, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 0,
          elevation: 2,
        },
        style,
      ]}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={v.text} />
      ) : (
        <Text style={{ fontFamily: fonts.caveat, fontSize: 18, color: v.text, fontWeight: '600' }}>
          {title}
        </Text>
      )}
    </Pressable>
  );
}

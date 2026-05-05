import { Text, View } from 'react-native';

import { colors, fonts, radius } from '@/constants/theme';
import type { WatchStatus } from '@/types/api';

const config: Record<WatchStatus, { label: string; bg: string; border: string }> = {
  want: { label: 'Хочу', bg: colors.yellow, border: colors.ink },
  watching: { label: 'Смотрю', bg: colors.blue, border: colors.ink },
  watched: { label: 'Просмотрено', bg: colors.orange, border: colors.ink },
  dropped: { label: 'Исключён', bg: colors.paper2, border: colors.ink },
};

interface StatusBadgeProps {
  status: WatchStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { label, bg, border } = config[status];
  return (
    <View
      style={{
        backgroundColor: bg,
        borderColor: border,
        borderWidth: 1.5,
        borderRadius: radius.full,
        paddingHorizontal: 10,
        paddingVertical: 3,
        alignSelf: 'flex-start',
      }}
    >
      <Text style={{ fontFamily: fonts.kalam, fontSize: 12, color: colors.ink }}>{label}</Text>
    </View>
  );
}

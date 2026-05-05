import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Body, Heading } from '@/components/ui/Typography';
import { colors } from '@/constants/theme';

export default function NotFound() {
  return (
    <>
      <Stack.Screen options={{ title: 'Страница не найдена' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.paper, gap: 16, padding: 24 }}>
        <Heading>Страница не найдена</Heading>
        <Link href="/(app)">
          <Body style={{ color: colors.orange }}>Вернуться на главную</Body>
        </Link>
      </View>
    </>
  );
}

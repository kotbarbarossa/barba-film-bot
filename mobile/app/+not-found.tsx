import { Link, Stack } from 'expo-router';
import { View } from 'react-native';
import { useTheme } from '@/theme';
import { H, Body } from '@/components/Text';

export default function NotFound() {
  const { theme } = useTheme();
  return (
    <>
      <Stack.Screen options={{ title: 'Страница не найдена' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.paper, gap: 16, padding: 24 }}>
        <H size="lg">Страница не найдена</H>
        <Link href="/">
          <Body color={theme.accentOrange}>Вернуться на главную</Body>
        </Link>
      </View>
    </>
  );
}

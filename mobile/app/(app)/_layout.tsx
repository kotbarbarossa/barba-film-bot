import { Tabs } from 'expo-router';

import { colors, fonts } from '@/constants/theme';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.paper,
          borderTopColor: colors.ink,
          borderTopWidth: 1.5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontFamily: fonts.caveat,
          fontSize: 13,
        },
        tabBarActiveTintColor: colors.ink,
        tabBarInactiveTintColor: colors.inkFaint,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Главная',
          tabBarIcon: ({ color }) => <TabIcon glyph="⌂" color={color} />,
        }}
      />
      <Tabs.Screen
        name="movies"
        options={{
          title: 'Список',
          tabBarIcon: ({ color }) => <TabIcon glyph="☰" color={color} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Добавить',
          tabBarIcon: ({ color }) => <TabIcon glyph="＋" color={color} />,
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Чарты',
          tabBarIcon: ({ color }) => <TabIcon glyph="🏆" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ glyph, color }: { glyph: string; color: string }) {
  const { Text } = require('react-native');
  return <Text style={{ fontSize: 20, color }}>{glyph}</Text>;
}

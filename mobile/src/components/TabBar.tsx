import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useRouter, usePathname } from 'expo-router';

const LEFT = [
  { key: 'home',   label: 'Главная', icon: '🏠', route: '/' },
  { key: 'movies', label: 'Фильмы',  icon: '📚', route: '/movies' },
] as const;

const RIGHT = [
  { key: 'charts',  label: 'Чарты',   icon: '🔥', route: '/charts' },
  { key: 'profile', label: 'Профиль', icon: '👤', route: '/profile' },
] as const;

const BAR_HEIGHT = 64;

export function TabBar() {
  const { theme } = useTheme();
  const router = useRouter();
  const path = usePathname();
  const insets = useSafeAreaInsets();

  const isActive = (route: string) =>
    route === '/' ? path === '/' : path.startsWith(route);

  const renderTab = (tab: { key: string; label: string; icon: string; route: string }, shift?: object) => {
    const active = isActive(tab.route);
    return (
      <Pressable key={tab.key} onPress={() => router.push(tab.route as any)} style={[styles.tab, shift]}>
        <View style={[
          styles.icon,
          active && { backgroundColor: theme.accentYellow, borderColor: theme.ink, borderWidth: 1.5, borderRadius: 6 },
        ]}>
          <Text style={{ fontSize: 15 }}>{tab.icon}</Text>
        </View>
        <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 13, color: active ? theme.ink : theme.inkFaint }}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={[
      styles.bar,
      {
        backgroundColor: theme.paper,
        borderTopColor: theme.line,
        height: BAR_HEIGHT + insets.bottom,
        paddingBottom: insets.bottom,
      },
    ]}>
      {renderTab(LEFT[0])}
      {renderTab(LEFT[1], { paddingRight: 20 })}{/* ← сдвиг Фильмы */}
      <View style={{ width: 56 }} />
      {renderTab(RIGHT[0], { paddingLeft: 20 })}{/* ← сдвиг Чарты */}
      {renderTab(RIGHT[1])}
      <Pressable
        onPress={() => router.push('/add' as any)}
        style={[styles.fab, { backgroundColor: theme.accentOrange, borderColor: theme.ink, shadowColor: theme.ink }]}
      >
        <Text style={{ fontFamily: 'Caveat-Bold', fontSize: 30, color: theme.paper, lineHeight: 32 }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    borderTopWidth: 1.5,
    position: 'relative',
    overflow: 'visible',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  icon: {
    width: 24,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fab: {
    position: 'absolute',
    left: '50%',
    top: -12,
    transform: [{ translateX: -25 }],
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
});

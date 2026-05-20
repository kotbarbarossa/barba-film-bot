import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';

const BAR_HEIGHT = 64;

export function TabBar() {
  const { theme } = useTheme();
  const router = useRouter();
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const TABS = [
    { key: 'home',    label: t('tabs.home'),    icon: '🏠', route: '/' },
    { key: 'movies',  label: t('tabs.movies'),  icon: '📚', route: '/movies' },
    { key: 'charts',  label: t('tabs.charts'),  icon: '🔥', route: '/charts' },
    { key: 'profile', label: t('tabs.profile'), icon: '👤', route: '/profile' },
  ] as const;

  const isActive = (route: string) =>
    route === '/' ? path === '/' : path.startsWith(route);

  const renderTab = (tab: { key: string; label: string; icon: string; route: string }) => {
    const active = isActive(tab.route);
    return (
      <Pressable key={tab.key} onPress={() => router.push(tab.route as any)} style={styles.tab}>
        <View style={[
          styles.icon,
          active && { backgroundColor: theme.accentYellow, borderColor: theme.ink, borderWidth: 1.5, borderRadius: 6 },
        ]}>
          <Text style={{ fontSize: 17 }}>{tab.icon}</Text>
        </View>
        <Text style={{ fontFamily: 'Neucha', fontSize: 14, lineHeight: 17, paddingVertical: 2, color: active ? theme.ink : theme.inkFaint }}>
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
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}
      <View style={styles.fabSlot} />
      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
      <View pointerEvents="box-none" style={styles.fabWrapper}>
        <Pressable
          onPress={() => router.push('/add' as any)}
          style={[styles.fab, { backgroundColor: theme.accentOrange, borderColor: theme.ink, shadowColor: theme.ink }]}
        >
          <Text style={{ fontFamily: 'Neucha', fontSize: 30, color: theme.paper, lineHeight: 36, paddingVertical: 4 }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1.5,
    position: 'relative',
    overflow: 'visible',
  },
  fabSlot: {
    flex: 1,
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
  fabWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
  },
  fab: {
    position: 'absolute',
    top: -12,
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

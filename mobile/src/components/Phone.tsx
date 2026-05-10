import React, { ReactNode, useEffect } from 'react';
import { View, StyleSheet, StatusBar as RNStatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { useTheme } from '@/theme';

export function Phone({ children, safeBottom = false }: { children: ReactNode; safeBottom?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme.paper === '#faf7f2';

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    NavigationBar.setBackgroundColorAsync(theme.paper);
    NavigationBar.setButtonStyleAsync(isLight ? 'dark' : 'light');
  }, [theme.paper]);

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.paper }]}
      edges={safeBottom ? ['top', 'bottom'] : ['top']}
    >
      <RNStatusBar barStyle={isLight ? 'dark-content' : 'light-content'} />
      <View style={styles.screen}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
});

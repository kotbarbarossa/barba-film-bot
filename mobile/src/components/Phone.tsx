import React, { ReactNode } from 'react';
import { View, StyleSheet, StatusBar as RNStatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/theme';

export function Phone({ children, safeBottom = false }: { children: ReactNode; safeBottom?: boolean }) {
  const { theme } = useTheme();
  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: theme.paper }]}
      edges={safeBottom ? ['top', 'bottom'] : ['top']}
    >
      <RNStatusBar barStyle={theme.paper === '#faf7f2' ? 'dark-content' : 'light-content'} />
      <View style={styles.screen}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  screen: { flex: 1 },
});

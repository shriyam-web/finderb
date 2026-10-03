import { type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

export const MAIN_TAB_HREFS = [
  '/(tabs)/home',
  '/(tabs)/categories',
  '/(tabs)/ai',
  '/(tabs)/more',
  '/(tabs)/business',
] as const;

/** Tab screens used to swipe between tabs. Swipe is disabled; this only fills the screen. */
export function TabSwipeHost({ children }: { children: ReactNode }) {
  return (
    <View style={styles.fill} collapsable={false}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

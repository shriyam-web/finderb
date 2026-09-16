import { type Href, usePathname, useRouter } from 'expo-router';
import { type ReactNode, useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';

export const MAIN_TAB_HREFS = [
  '/(tabs)/home',
  '/(tabs)/categories',
  '/(tabs)/ai',
  '/(tabs)/more',
  '/(tabs)/account',
] as const;

const PATH_INDEX: Record<string, number> = {
  home: 0,
  categories: 1,
  ai: 2,
  more: 3,
  account: 4,
};

function tabIndexFromPath(pathname: string) {
  const parts = pathname.split('/').filter((part) => part && part !== '(tabs)');
  if (parts.length !== 1) return -1;
  return PATH_INDEX[parts[0]] ?? -1;
}

/** Horizontal swipe between the 5 main tabs, without wrapping the navigator. */
export function TabSwipeHost({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const index = useMemo(() => tabIndexFromPath(pathname), [pathname]);
  const indexRef = useRef(index);
  const routerRef = useRef(router);
  indexRef.current = index;
  routerRef.current = router;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gesture) => {
        if (indexRef.current < 0) return false;
        const ax = Math.abs(gesture.dx);
        const ay = Math.abs(gesture.dy);
        return ax > 56 && ax > ay * 2.4;
      },
      onPanResponderRelease: (_evt, gesture) => {
        const current = indexRef.current;
        if (current < 0) return;
        const goNext = gesture.vx < -0.35 || gesture.dx < -72;
        const goPrev = gesture.vx > 0.35 || gesture.dx > 72;
        if (goNext && current < MAIN_TAB_HREFS.length - 1) {
          routerRef.current.replace(MAIN_TAB_HREFS[current + 1] as Href);
        } else if (goPrev && current > 0) {
          routerRef.current.replace(MAIN_TAB_HREFS[current - 1] as Href);
        }
      },
    }),
  ).current;

  return (
    <View style={styles.fill} collapsable={false} {...pan.panHandlers}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});

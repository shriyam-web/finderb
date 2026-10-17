import { type Href } from 'expo-router';
import { Platform } from 'react-native';

const FALLBACK: Href = '/(tabs)/home';
export const MORE_TAB: Href = '/(tabs)/more';

type BackCapableRouter = {
  canGoBack: () => boolean;
  canDismiss?: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

type TabRouter = BackCapableRouter & {
  navigate?: (href: Href) => void;
};

function canCall(fn: (() => boolean) | undefined): boolean {
  if (typeof fn !== 'function') return false;
  try {
    return fn();
  } catch {
    return false;
  }
}

/**
 * Safe back. On web, browser history can report that a back exists while no
 * navigator will handle GO_BACK, which opens the Expo error overlay.
 * Only pop when a stack actually has a screen underneath.
 */
export function goBackOrHome(
  router: TabRouter,
  fallback: Href = FALLBACK,
) {
  const canPop =
    Platform.OS === 'web' ? canCall(router.canDismiss) : canCall(router.canGoBack);
  if (canPop) {
    router.back();
    return;
  }
  if (router.navigate) {
    router.navigate(fallback);
    return;
  }
  router.replace(fallback);
}

/**
 * Jobs, news, blogs, and destinations live as hidden tab screens.
 * `replace` resets the tab group to Home, so switch back with `navigate`.
 */
export function backToMore(router: { navigate: (href: Href) => void }) {
  router.navigate(MORE_TAB);
}

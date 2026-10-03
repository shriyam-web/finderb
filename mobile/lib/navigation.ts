import { type Href } from 'expo-router';

const FALLBACK: Href = '/(tabs)/home';
export const MORE_TAB: Href = '/(tabs)/more';

type BackCapableRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

type TabRouter = BackCapableRouter & {
  navigate?: (href: Href) => void;
};

/** Safe back — avoids GO_BACK warning when the stack is empty. */
export function goBackOrHome(
  router: TabRouter,
  fallback: Href = FALLBACK,
) {
  if (router.canGoBack()) {
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

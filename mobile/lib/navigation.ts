import { type Href } from 'expo-router';

const FALLBACK: Href = '/(tabs)/home';
export const MORE_TAB: Href = '/(tabs)/more';

type BackCapableRouter = {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: Href) => void;
};

/** Safe back — avoids GO_BACK warning when the stack is empty. */
export function goBackOrHome(
  router: BackCapableRouter,
  fallback: Href = FALLBACK,
) {
  if (router.canGoBack()) {
    router.back();
    return;
  }
  router.replace(fallback);
}

/** Hidden More services (Jobs / News / Blogs / Tourist) should return to More. */
export function backToMore(router: { replace: (href: Href) => void }) {
  router.replace(MORE_TAB);
}

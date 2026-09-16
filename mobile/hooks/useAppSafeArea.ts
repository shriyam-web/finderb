import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Height of custom tab bar chrome (icons + labels + top pad),
 * excluding the system navigation inset.
 */
export const TAB_BAR_CONTENT_HEIGHT = 56;

/**
 * Typical Android 3-button nav bar height (dp) when edge-to-edge
 * and insets fail to report (rare). Gesture nav usually reports ~16–34.
 */
const ANDROID_NAV_FALLBACK = 48;

/**
 * Bottom system inset for gesture nav AND 3-button nav.
 *
 * - iOS / gesture Android: uses real safe-area inset (home indicator).
 * - Android 3-button (edge-to-edge): usually ~48 via insets.bottom.
 * - Android inset 0: fall back so content never sits under the nav bar.
 */
export function useBottomInset(minPad = 0) {
  const insets = useSafeAreaInsets();
  const raw = insets.bottom;

  if (Platform.OS === 'android') {
    if (raw > 0) return Math.max(raw, minPad);
    return Math.max(ANDROID_NAV_FALLBACK, minPad);
  }

  return Math.max(raw, minPad);
}

/** Extra scroll padding so last items clear the custom tab bar + system nav. */
export function useTabScrollPadding(extra = 24) {
  const bottom = useBottomInset();
  return TAB_BAR_CONTENT_HEIGHT + bottom + extra;
}

/**
 * Bottom padding for full-screen stack pages (no tab bar) —
 * keeps CTAs / list tails above gesture pill or 3-button bar.
 */
export function useStackBottomPadding(extra = 16) {
  const bottom = useBottomInset();
  return bottom + extra;
}

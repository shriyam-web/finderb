import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Base height of tab icons + labels (excluding system nav inset). */
export const TAB_BAR_CONTENT_HEIGHT = 56;

/**
 * Bottom inset that works for both gesture nav and 3-button nav.
 * Android 3-button bars are often ~48dp; never allow a zero pad when
 * the window draws edge-to-edge.
 */
export function useBottomInset(minPad = 8) {
  const insets = useSafeAreaInsets();
  const androidFloor = Platform.OS === 'android' ? 16 : minPad;
  return Math.max(insets.bottom, androidFloor);
}

/** Extra scroll padding so last items clear the custom tab bar. */
export function useTabScrollPadding(extra = 24) {
  const bottom = useBottomInset();
  return TAB_BAR_CONTENT_HEIGHT + bottom + extra;
}

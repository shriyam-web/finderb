import * as SplashScreen from 'expo-splash-screen';

/** Hide the native splash. Safe to call more than once (reload / Fast Refresh). */
export function hideNativeSplash() {
  void SplashScreen.hideAsync().catch(() => undefined);
}

import { Platform } from 'react-native';

/**
 * Expo Router logs an empty GO_BACK as console.error. On web that opens the
 * dev error overlay and blocks the app, even though the warning is dev-only.
 */
if (Platform.OS === 'web' && typeof console !== 'undefined') {
  const report = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    const head = typeof args[0] === 'string' ? args[0] : '';
    if (
      head.includes("The action 'GO_BACK'") &&
      head.includes('was not handled by any navigator')
    ) {
      return;
    }
    report(...args);
  };
}

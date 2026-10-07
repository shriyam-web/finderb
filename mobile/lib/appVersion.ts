import Constants from 'expo-constants';

/** User-facing version for About / footer; the internal build number is never shown. */
export function getAppVersionLabel(): string {
  const version =
    Constants.nativeApplicationVersion?.trim() ||
    Constants.expoConfig?.version?.trim() ||
    '1.0.0';
  return `Version ${version}`;
}

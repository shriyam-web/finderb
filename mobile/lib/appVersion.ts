import Constants from 'expo-constants';

/** Display version for About / footer (native build version when available). */
export function getAppVersionLabel(): string {
  const native =
    Constants.nativeApplicationVersion?.trim() ||
    Constants.expoConfig?.version?.trim() ||
    '1.0.0';
  const build =
    Constants.nativeBuildVersion?.trim() ||
    (typeof Constants.expoConfig?.android?.versionCode === 'number'
      ? String(Constants.expoConfig.android.versionCode)
      : '');
  return build ? `Version ${native} (${build})` : `Version ${native}`;
}

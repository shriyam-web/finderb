import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { SITE_URL } from './supabase';
import { getStoredToken } from './session';
import { ensureNotificationPermission } from './notificationChannels';

function projectId(): string | undefined {
  return (
    Constants.easConfig?.projectId ||
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas
      ?.projectId
  );
}

async function savePushToken(value: string, platform: string, authToken: string | null) {
  const trimmed = value.trim();
  if (!trimmed) return;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;
  await fetch(`${SITE_URL}/api/notifications/push-token`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      token: trimmed,
      platform,
    }),
  });
}

export async function registerDevicePushToken(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const granted = await ensureNotificationPermission();
    if (!granted) return;

    const authToken = await getStoredToken();

    if (Platform.OS === 'android') {
      const device = await Notifications.getDevicePushTokenAsync();
      const native = typeof device.data === 'string' ? device.data : '';
      await savePushToken(native, 'android', authToken);
      return;
    }

    const id = projectId();
    const expoToken = await Notifications.getExpoPushTokenAsync(
      id ? { projectId: id } : undefined,
    );
    await savePushToken(expoToken.data || '', 'ios', authToken);
  } catch (error) {
    console.warn('Push token registration skipped:', error);
  }
}

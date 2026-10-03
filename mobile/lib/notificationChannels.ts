import { PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { afterLocationPermission, queuePermissionRequest } from './permissionGate';

/** New channel id so Android can heads-up. Existing `updates` was DEFAULT and cannot be upgraded. */
export const UPDATES_CHANNEL = 'finderb_heads_up';
export const WELCOME_CHANNEL = 'finderb_welcome';

const CHANNELS_READY = { current: false };

export function configureNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.MAX,
    }),
  });
}

export async function ensureAndroidNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android' || CHANNELS_READY.current) return;

  const shared = {
    vibrationPattern: [0, 250, 140, 250],
    lightColor: '#E8811E',
    enableVibrate: true,
    enableLights: true,
    showBadge: true,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    sound: 'default' as const,
  };

  await Notifications.setNotificationChannelAsync(UPDATES_CHANNEL, {
    name: 'FinderB updates',
    description: 'Announcements and alerts from FinderB',
    importance: Notifications.AndroidImportance.MAX,
    ...shared,
  });

  await Notifications.setNotificationChannelAsync(WELCOME_CHANNEL, {
    name: 'Welcome',
    description: 'A short hello when you first install FinderB',
    importance: Notifications.AndroidImportance.MAX,
    ...shared,
  });

  CHANNELS_READY.current = true;
}

let permissionInFlight: Promise<boolean> | null = null;

/**
 * Several startup tasks ask at once; they share one request, which waits for the location
 * dialog and then takes its turn in the permission queue.
 */
export function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return Promise.resolve(false);
  permissionInFlight ??= askNotificationPermission().finally(() => {
    permissionInFlight = null;
  });
  return permissionInFlight;
}

async function askNotificationPermission(): Promise<boolean> {
  await ensureAndroidNotificationChannels();

  const current = await Notifications.getPermissionsAsync();
  if (current.granted || current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL) {
    return true;
  }

  await afterLocationPermission();
  return queuePermissionRequest(async () => {
    if (Platform.OS === 'android' && Number(Platform.Version) >= 33) {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'FinderB notifications',
          message: 'Allow FinderB to send updates, offers, and alerts.',
          buttonPositive: 'Allow',
          buttonNegative: 'Not now',
        },
      );
      return result === PermissionsAndroid.RESULTS.GRANTED;
    }
    const asked = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
      android: {},
    });
    return asked.granted || asked.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;
  });
}

export function broadcastIdFromNotificationData(
  data: Record<string, unknown> | undefined | null,
): string | null {
  if (!data) return null;
  const raw = data.broadcastId ?? data.broadcast_id ?? data.id;
  const id = String(raw || '').trim();
  return id || null;
}

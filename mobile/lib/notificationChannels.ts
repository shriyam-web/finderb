import { PermissionsAndroid, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { afterLocationPermission, queuePermissionRequest } from './permissionGate';

/** New channel id so Android can heads-up. Existing `updates` was DEFAULT and cannot be upgraded. */
export const UPDATES_CHANNEL = 'finderb_heads_up';
export const WELCOME_CHANNEL = 'finderb_welcome';

const CHANNELS_READY = { current: false };

let deviceAudience: 'user' | 'business' = 'user';

/** A merchant login sees business alerts only; customers never see business ones. */
export function setNotificationAudience(audience: 'user' | 'business') {
  deviceAudience = audience;
}

export function isBusinessNotification(data: Record<string, unknown> | undefined | null): boolean {
  if (!data) return false;
  return data.audience === 'business' || data.type === 'lead' || data.type === 'review' || data.type === 'ownership';
}

function isRemotePushTrigger(trigger: Notifications.NotificationTrigger | null): boolean {
  if (!trigger || typeof trigger !== 'object') return false;
  const type = 'type' in trigger ? String(trigger.type) : '';
  return type === 'push' || type === 'remote';
}

/** Expo often swallows remote heads-up while the app is open; replay as a local alert. */
export async function presentForegroundPush(
  notification: Notifications.Notification,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const identifier = notification.request.identifier || '';
  if (identifier.startsWith('fg-')) return;

  const data = (notification.request.content.data || {}) as Record<string, unknown>;
  if (String(data._localReplay || '') === '1') return;

  const trigger = notification.request.trigger;
  const remote =
    isRemotePushTrigger(trigger) ||
    (trigger == null && Boolean(data.type || data.audience));
  if (!remote) return;

  const show = isBusinessNotification(data) === (deviceAudience === 'business');
  if (!show) return;

  const content = notification.request.content;
  try {
    await Notifications.scheduleNotificationAsync({
      identifier: `fg-${identifier || Date.now()}`,
      content: {
        title: content.title || 'FinderB',
        body: content.body || '',
        data: { ...data, _localReplay: '1' },
        sound: 'default',
        ...(Platform.OS === 'android' ? { channelId: UPDATES_CHANNEL } : null),
      },
      trigger: null,
    });
  } catch (error) {
    console.error('[foreground push]', error);
  }
}

export function configureNotificationHandler() {
  if (Platform.OS === 'web') return;
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const data = notification.request.content.data as Record<string, unknown> | undefined;
      const show = isBusinessNotification(data) === (deviceAudience === 'business');
      return {
        shouldShowAlert: show,
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.MAX,
      };
    },
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

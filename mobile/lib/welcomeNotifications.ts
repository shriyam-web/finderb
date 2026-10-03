import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  WELCOME_CHANNEL,
  ensureNotificationPermission,
} from './notificationChannels';

const WELCOME_FLAG = '@finderb/welcome-notifs-v1';

const WELCOME_NOTES = [
  {
    title: 'Welcome to FinderB 👋',
    body: "India's trusted local guide — find businesses, services & stories near you.",
    delaySec: 45,
  },
  {
    title: 'Explore what’s around you',
    body: 'Open Home to discover nearby businesses, jobs, and local news.',
    delaySec: 180,
  },
] as const;

/**
 * On first install / first open: schedule 2 friendly local notifications
 * a short gap apart. Runs once after permission is granted.
 */
export async function scheduleWelcomeNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    const done = await AsyncStorage.getItem(WELCOME_FLAG);
    if (done === '1') return;

    const ok = await ensureNotificationPermission();
    if (!ok) return;

    for (const note of WELCOME_NOTES) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: note.title,
          body: note.body,
          sound: 'default',
          data: { type: 'welcome' },
          interruptionLevel: 'timeSensitive',
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(Platform.OS === 'android' ? { channelId: WELCOME_CHANNEL } : null),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: note.delaySec,
          repeats: false,
          ...(Platform.OS === 'android' ? { channelId: WELCOME_CHANNEL } : null),
        },
      });
    }

    await AsyncStorage.setItem(WELCOME_FLAG, '1');
  } catch (error) {
    console.warn('Welcome notifications skipped:', error);
  }
}

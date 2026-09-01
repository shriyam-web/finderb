'use server';

import { listUserNotifications } from '@/lib/userNotifications.server';

export async function getUserNotifications() {
  try {
    const notifications = await listUserNotifications(40);
    return { success: true as const, notifications };
  } catch (error) {
    console.error('[getUserNotifications]', error);
    return { success: false as const, error: 'Could not load notifications', notifications: [] };
  }
}

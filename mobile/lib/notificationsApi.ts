import { SITE_URL } from './supabase';
import { getStoredToken } from './session';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  created_at: string;
  cta_url?: string | null;
  cta_label?: string | null;
  show_datetime?: boolean;
};

export async function fetchUserNotifications(): Promise<
  { notifications: AppNotification[] } | { success: false; error: string }
> {
  try {
    const res = await fetch(`${SITE_URL}/api/notifications`, {
      headers: { Accept: 'application/json' },
    });
    const data = (await res.json()) as {
      success?: boolean;
      notifications?: AppNotification[];
      error?: string;
    };
    if (!data.success) {
      return { success: false, error: data.error || 'Could not load notifications.' };
    }
    return { notifications: Array.isArray(data.notifications) ? data.notifications : [] };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error.',
    };
  }
}

export async function recordNotificationReads(ids: string[]): Promise<void> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))];
  if (!unique.length) return;
  const token = await getStoredToken();
  if (!token) return;
  try {
    await fetch(`${SITE_URL}/api/notifications/read`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ids: unique }),
    });
  } catch {
    // local unread state still works without a server ack
  }
}

export async function deleteMobileAccount(): Promise<
  { success: true } | { success: false; error: string }
> {
  const token = await getStoredToken();
  if (!token) {
    return { success: false, error: 'Please log in.' };
  }
  try {
    const res = await fetch(`${SITE_URL}/api/auth/mobile/account`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    const data = (await res.json()) as { success?: boolean; error?: string };
    if (!data.success) {
      return { success: false, error: data.error || 'Could not delete your account.' };
    }
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error.',
    };
  }
}

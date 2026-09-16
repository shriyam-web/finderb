import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchUserNotifications,
  type AppNotification,
} from './notificationsApi';

const SEEN_KEY = '@finderb/notif-seen-ids-v2';
const READ_AT_KEY = '@finderb/notif-read-at-v1';
const SINCE_PREFIX = '@finderb/notif-since-v1:';
const WELCOME_INBOX_PREFIX = '@finderb/welcome-inbox-v1:';

let viewingInbox = false;

export function setViewingNotificationInbox(value: boolean) {
  viewingInbox = value;
}

export function isViewingNotificationInbox() {
  return viewingInbox;
}

type InboxSnapshot = {
  items: AppNotification[];
  unreadCount: number;
  readAt: number | null;
  error: string;
};

function newestTime(items: AppNotification[]): number {
  let max = 0;
  for (const item of items) {
    const t = new Date(item.created_at).getTime();
    if (Number.isFinite(t) && t > max) max = t;
  }
  return max;
}

async function loadSeenIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(SEEN_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return new Set(Array.isArray(list) ? list.map(String) : []);
  } catch {
    return new Set();
  }
}

async function saveSeenIds(ids: Set<string>): Promise<void> {
  const trimmed = [...ids].slice(-200);
  await AsyncStorage.setItem(SEEN_KEY, JSON.stringify(trimmed));
}

async function loadReadAt(): Promise<number | null> {
  try {
    const raw = await AsyncStorage.getItem(READ_AT_KEY);
    if (!raw) return null;
    const t = Date.parse(raw);
    return Number.isFinite(t) ? t : null;
  } catch {
    return null;
  }
}

async function saveReadAt(at: number): Promise<void> {
  await AsyncStorage.setItem(READ_AT_KEY, new Date(at).toISOString());
}

async function resolveSinceMs(opts?: {
  userId?: string | null;
  createdAt?: string | null;
}): Promise<number | null> {
  const userId = opts?.userId?.trim();
  if (!userId) return null;

  const key = `${SINCE_PREFIX}${userId}`;
  try {
    const stored = await AsyncStorage.getItem(key);
    if (stored) {
      const t = Date.parse(stored);
      if (Number.isFinite(t)) return t;
    }
  } catch {
    /* ignore */
  }

  const fromAuth = opts?.createdAt ? Date.parse(opts.createdAt) : NaN;
  if (Number.isFinite(fromAuth)) {
    await AsyncStorage.setItem(key, new Date(fromAuth).toISOString());
    return fromAuth;
  }

  // No signup stamp available — don't invent "now" (would hide older inbox history).
  return null;
}

async function ensureWelcomeInboxItem(
  userId: string,
  sinceMs: number,
): Promise<AppNotification> {
  const key = `${WELCOME_INBOX_PREFIX}${userId}`;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw) as AppNotification;
      if (parsed?.id && parsed.title) return parsed;
    }
  } catch {
    /* recreate */
  }

  const welcome: AppNotification = {
    id: `welcome-${userId}`,
    title: 'Welcome to FinderB 👋',
    message:
      "Glad you're here. We'll only show notifications from today onward — explore nearby shops, jobs, and stories anytime.",
    created_at: new Date(sinceMs).toISOString(),
    cta_url: null,
    cta_label: null,
    show_datetime: true,
  };
  await AsyncStorage.setItem(key, JSON.stringify(welcome));
  return welcome;
}

export function isNotificationUnread(
  item: AppNotification,
  readAt: number | null,
): boolean {
  if (readAt == null) return false;
  const t = new Date(item.created_at).getTime();
  return Number.isFinite(t) && t > readAt;
}

export function countUnread(items: AppNotification[], readAt: number | null): number {
  return items.filter((item) => isNotificationUnread(item, readAt)).length;
}

export async function markInboxRead(now = Date.now()): Promise<void> {
  await saveReadAt(now);
}

export async function syncNotificationInbox(opts?: {
  userId?: string | null;
  createdAt?: string | null;
}): Promise<InboxSnapshot> {
  const result = await fetchUserNotifications();
  if (!('notifications' in result)) {
    return { items: [], unreadCount: 0, readAt: null, error: result.error };
  }

  const sinceMs = await resolveSinceMs(opts);
  let items = result.notifications;

  // New / signed-in users only see broadcasts from signup time onward.
  if (sinceMs != null) {
    items = items.filter((item) => {
      const t = new Date(item.created_at).getTime();
      return Number.isFinite(t) && t >= sinceMs - 5_000;
    });
  }

  if (opts?.userId && sinceMs != null) {
    const welcome = await ensureWelcomeInboxItem(opts.userId, sinceMs);
    if (!items.some((item) => item.id === welcome.id)) {
      items = [welcome, ...items];
    }
  }

  items = [...items].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const seen = await loadSeenIds();
  let readAt = await loadReadAt();
  const firstVisit = seen.size === 0 && readAt == null;

  if (firstVisit) {
    for (const item of items) seen.add(item.id);
    await saveSeenIds(seen);
    // Welcome stays unread until they open the inbox; older history is already filtered out.
    const stamped = sinceMs != null ? sinceMs - 1 : Date.now();
    await saveReadAt(stamped);
    return {
      items,
      unreadCount: countUnread(items, stamped),
      readAt: stamped,
      error: '',
    };
  }

  for (const item of items) seen.add(item.id);
  await saveSeenIds(seen);

  if (readAt == null) {
    readAt = sinceMs != null ? sinceMs - 1 : Date.now();
    await saveReadAt(readAt);
  }

  return {
    items,
    unreadCount: countUnread(items, readAt),
    readAt,
    error: '',
  };
}

export async function rememberBroadcastId(id: string): Promise<void> {
  const trimmed = id.trim();
  if (!trimmed) return;
  const seen = await loadSeenIds();
  seen.add(trimmed);
  await saveSeenIds(seen);
}

/** Call on signup so inbox starts clean from this moment. */
export async function stampNotificationSince(
  userId: string,
  createdAt?: string | null,
): Promise<void> {
  const id = userId.trim();
  if (!id) return;
  const key = `${SINCE_PREFIX}${id}`;
  const existing = await AsyncStorage.getItem(key);
  if (existing) return;
  const parsed = createdAt ? Date.parse(createdAt) : NaN;
  const since = Number.isFinite(parsed) ? parsed : Date.now();
  await AsyncStorage.setItem(key, new Date(since).toISOString());
}

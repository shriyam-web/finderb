import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from './AuthContext';
import type { AppNotification } from '../lib/notificationsApi';
import {
  isNotificationUnread,
  markInboxRead,
  rememberBroadcastId,
  syncNotificationInbox,
} from '../lib/notificationInbox';
import {
  broadcastIdFromNotificationData,
  configureNotificationHandler,
  ensureAndroidNotificationChannels,
} from '../lib/notificationChannels';

configureNotificationHandler();

type InboxValue = {
  items: AppNotification[];
  unreadCount: number;
  readAt: number | null;
  loading: boolean;
  error: string;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  markAllRead: () => Promise<void>;
  isUnread: (item: AppNotification) => boolean;
};

const InboxContext = createContext<InboxValue | null>(null);

export function NotificationInboxProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const signedInRef = useRef(Boolean(user));
  signedInRef.current = Boolean(user);

  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readAt, setReadAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const syncing = useRef(false);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    if (syncing.current) return;
    syncing.current = true;
    if (!opts?.silent) setLoading(true);
    try {
      const snapshot = await syncNotificationInbox({
        userId: signedInRef.current ? user?.id : null,
        createdAt: signedInRef.current ? user?.createdAt : null,
      });
      setItems(snapshot.items);
      setReadAt(snapshot.readAt);
      setUnreadCount(signedInRef.current ? snapshot.unreadCount : 0);
      setError(snapshot.error);
    } finally {
      syncing.current = false;
      setLoading(false);
    }
  }, [user?.createdAt, user?.id]);

  const markAllRead = useCallback(async () => {
    const now = Date.now();
    await markInboxRead(now);
    setReadAt(now);
    setUnreadCount(0);
  }, []);

  const isUnread = useCallback(
    (item: AppNotification) => isNotificationUnread(item, readAt),
    [readAt],
  );

  useEffect(() => {
    if (!user) setUnreadCount(0);
  }, [user]);

  useEffect(() => {
    void ensureAndroidNotificationChannels();
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (user) void refresh({ silent: true });
  }, [user, refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void refresh({ silent: true });
      }
    });
    return () => sub.remove();
  }, [refresh]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') {
        void refresh({ silent: true });
      }
    }, 20000);
    return () => clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (Platform.OS === 'web') return;
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const id = broadcastIdFromNotificationData(
        notification.request.content.data as Record<string, unknown> | undefined,
      );
      if (id) void rememberBroadcastId(id);
      void refresh({ silent: true });
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo<InboxValue>(
    () => ({
      items,
      unreadCount,
      readAt,
      loading,
      error,
      refresh,
      markAllRead,
      isUnread,
    }),
    [items, unreadCount, readAt, loading, error, refresh, markAllRead, isUnread],
  );

  return <InboxContext.Provider value={value}>{children}</InboxContext.Provider>;
}

export function useNotificationInbox() {
  const ctx = useContext(InboxContext);
  if (!ctx) {
    throw new Error('useNotificationInbox must be used within NotificationInboxProvider');
  }
  return ctx;
}

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
  consoleCall,
  isFailure,
  type ConsoleNotification,
} from '../lib/merchantConsoleApi';
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
  isBusinessNotification,
  presentForegroundPush,
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
  const isBusiness = Boolean(user?.isBusinessAccount);

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
      if (isBusiness) {
        const result = await consoleCall<{ items: ConsoleNotification[]; unread: number }>('notifications');
        if (isFailure(result)) {
          setError(result.error);
          setItems([]);
          setUnreadCount(0);
          return;
        }
        setItems(
          (result.items || []).map((item) => ({
            id: item.id,
            title: item.title,
            message: item.body,
            created_at: item.createdAt,
            cta_url: item.ctaUrl,
            cta_label: item.ctaLabel,
            read: item.read,
          })),
        );
        setUnreadCount(result.unread || 0);
        setReadAt(null);
        setError('');
        return;
      }
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
  }, [isBusiness, user?.createdAt, user?.id]);

  const markAllRead = useCallback(async () => {
    if (isBusiness) {
      await consoleCall('markNotificationsRead');
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
      return;
    }
    const now = Date.now();
    await markInboxRead(now);
    setReadAt(now);
    setUnreadCount(0);
  }, [isBusiness]);

  const isUnread = useCallback(
    (item: AppNotification) => {
      if (typeof item.read === 'boolean') return !item.read;
      return isNotificationUnread(item, readAt);
    },
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
      const content = notification.request.content;
      const data = content.data as Record<string, unknown> | undefined;
      const id = broadcastIdFromNotificationData(data);
      if (id) void rememberBroadcastId(id);
      void presentForegroundPush(notification);
      if (isBusiness && isBusinessNotification(data)) {
        const itemId = String(data?.notificationId || notification.request.identifier || '').trim();
        if (itemId && !itemId.startsWith('fg-')) {
          setItems((prev) => {
            if (prev.some((item) => item.id === itemId)) return prev;
            return [
              {
                id: itemId,
                title: content.title || 'FinderB',
                message: content.body || '',
                created_at: new Date().toISOString(),
                cta_url: String(data?.ctaUrl || data?.url || ''),
                cta_label: data?.type === 'review' ? 'View review' : 'Open leads',
                read: false,
              },
              ...prev,
            ];
          });
          setUnreadCount((count) => count + 1);
        }
      }
      void refresh({ silent: true });
    });
    return () => sub.remove();
  }, [isBusiness, refresh]);

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

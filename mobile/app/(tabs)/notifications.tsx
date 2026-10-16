import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { ScreenHeader } from '../../components/ScreenHeader';
import { PullRefreshMark } from '../../components/PullRefreshMark';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useLoginPrompt } from '../../context/LoginPromptContext';
import { useNotificationInbox } from '../../context/NotificationInboxContext';
import { useTheme } from '../../context/ThemeContext';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { setViewingNotificationInbox } from '../../lib/notificationInbox';
import { recordNotificationReads } from '../../lib/notificationsApi';
import { goBackOrHome } from '../../lib/navigation';
import { consoleRouteFor } from '../../components/console/routes';

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function showsDatetime(value: unknown) {
  return value !== false && value !== 'false';
}

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const bottomPad = useTabScrollPadding(24);
  const { items, loading, error, refresh, markAllRead, isUnread } =
    useNotificationInbox();
  const [refreshing, setRefreshing] = useState(false);
  const recordedKey = useRef('');

  useFocusEffect(
    useCallback(() => {
      setViewingNotificationInbox(true);
      recordedKey.current = '';
      void refresh({ silent: true });
      return () => {
        setViewingNotificationInbox(false);
        void markAllRead();
      };
    }, [refresh, markAllRead]),
  );

  useEffect(() => {
    if (!user || items.length === 0) return;
    const key = items.map((item) => item.id).join(',');
    if (recordedKey.current === key) return;
    recordedKey.current = key;
    void recordNotificationReads(items.map((item) => item.id));
  }, [user, items]);

  const guestEmpty = !user;

  const openCta = async (url: string) => {
    const route = user?.isBusinessAccount ? consoleRouteFor(url) : null;
    if (route) {
      router.push(route);
      return;
    }
    try {
      await Linking.openURL(/^https?:\/\//i.test(url) ? url : `https://finderb.com${url}`);
    } catch {
      // ignore invalid / blocked urls
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Notifications"
          variant="bar"
          style={styles.header}
          onBack={() => goBackOrHome(router)}
          right={
            items.some((item) => isUnread(item)) ? (
              <Pressable
                onPress={() => void markAllRead()}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Mark all as read"
              >
                <Text style={styles.markAll}>Mark all as read</Text>
              </Pressable>
            ) : undefined
          }
        />
        {authLoading || (loading && !refreshing && items.length === 0) ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : guestEmpty ? (
          <View style={[styles.empty, { paddingBottom: bottomPad }]}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications-outline" size={28} color={colors.brand} />
            </View>
            <Text style={styles.title}>Login to know our latest updates</Text>
            <Text style={styles.body}>
              Sign in to get FinderB announcements, offers, and alerts as they go out.
            </Text>
            <PrimaryButton
              label="Log in"
              onPress={() => requestLogin('/(tabs)/notifications')}
              style={styles.loginBtn}
            />
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.empty, { paddingBottom: bottomPad }]}>
            <View style={styles.iconWrap}>
              <Ionicons name="notifications-outline" size={28} color={colors.brand} />
            </View>
            <Text style={styles.title}>
              {error ? 'Could not load updates' : "You're all caught up"}
            </Text>
            <Text style={styles.body}>
              {error ||
                'Announcements from FinderB — including those sent from the admin panel — will show up here.'}
            </Text>
            {error ? (
              <PrimaryButton
                label="Try again"
                variant="secondary"
                onPress={() => void refresh()}
                style={styles.loginBtn}
              />
            ) : null}
          </View>
        ) : (
          <View style={{ flex: 1 }}>
          <PullRefreshMark active={refreshing} />
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad, paddingTop: 8 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void refresh({ silent: true }).finally(() =>
                    setRefreshing(false),
                  );
                }}
                tintColor={colors.ink}
              />
            }
          >
            {items.map((item) => {
              const unread = isUnread(item);
              const ctaUrl = typeof item.cta_url === 'string' ? item.cta_url.trim() : '';
              const ctaLabel = (item.cta_label || 'Open').trim() || 'Open';
              return (
                <Pressable
                  key={item.id}
                  onPress={ctaUrl ? () => void openCta(ctaUrl) : undefined}
                  disabled={!ctaUrl}
                  style={[styles.row, unread ? styles.rowUnread : styles.rowRead]}
                  accessibilityRole={ctaUrl ? 'button' : undefined}
                >
                  <View style={styles.rowAccent}>
                    {unread ? <View style={styles.unreadDot} /> : <View style={styles.readTick} />}
                  </View>
                  <View style={styles.rowBody}>
                    <Text
                      style={[styles.cardTitle, unread && styles.cardTitleUnread]}
                    >
                      {item.title}
                    </Text>
                    <Text style={[styles.cardBody, unread && styles.cardBodyUnread]}>
                      {item.message}
                    </Text>
                    {ctaUrl ? (
                      <View style={styles.ctaLink}>
                        <Text style={styles.ctaLinkText}>{ctaLabel}</Text>
                        <Ionicons name="arrow-forward" size={13} color={colors.primary} />
                      </View>
                    ) : null}
                    {showsDatetime(item.show_datetime) ? (
                      <Text style={styles.cardWhen}>{formatWhen(item.created_at)}</Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, paddingTop: 8 },
  header: {
    paddingTop: 16,
    paddingBottom: 14,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    gap: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.brandSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.heading,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    textAlign: 'center',
  },
  loginBtn: {
    alignSelf: 'stretch',
    marginTop: 10,
  },
  markAll: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowUnread: {},
  rowRead: {
    opacity: 0.88,
  },
  rowAccent: {
    width: 14,
    paddingTop: 5,
    alignItems: 'center',
  },
  rowBody: {
    flex: 1,
    gap: 6,
    minWidth: 0,
  },
  cardTitle: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textMuted,
  },
  cardTitleUnread: {
    fontFamily: fonts.semiBold,
    color: colors.heading,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.mango,
  },
  readTick: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderStrong,
  },
  cardBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textSoft,
  },
  cardBodyUnread: {
    color: colors.text,
  },
  ctaLink: {
    marginTop: 4,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ctaLinkText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.primary,
  },
  cardWhen: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textSoft,
    marginTop: 2,
  },
}));

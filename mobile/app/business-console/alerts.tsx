import { useEffect, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { SITE_URL } from '../../lib/supabase';
import type { ConsoleNotification, ConsoleOverview } from '../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../components/console/ConsoleGate';
import { ConsolePage, Empty, createConsoleStyles, timeAgo } from '../../components/console/kit';
import { consoleRouteFor } from '../../components/console/routes';

function iconFor(item: ConsoleNotification): keyof typeof Ionicons.glyphMap {
  const type = item.type.toLowerCase();
  if (item.kind === 'broadcast') return 'megaphone-outline';
  if (/payment|plan|subscription|renew/.test(type)) return 'card-outline';
  if (/lead/.test(type)) return 'people-outline';
  if (/review/.test(type)) return 'star-outline';
  if (/ownership/.test(type)) return 'key-outline';
  if (/approv|status|live/.test(type)) return 'storefront-outline';
  return 'notifications-outline';
}

function OwnershipAnswer({
  requestId,
  onDone,
}: {
  requestId: string;
  onDone: () => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const { run, notify } = useMerchantConsole();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async (decision: 'approved' | 'denied') => {
    if (decision === 'denied' && note.trim().length < 3) {
      notify('Write a short reason before denying.');
      return;
    }
    setBusy(true);
    const result = await run<{ success: true }>('respondOwnership', { requestId, decision, note: note.trim() });
    setBusy(false);
    if (!result.success) {
      notify(result.error || 'Could not save your answer.');
      return;
    }
    notify(decision === 'approved' ? 'You approved this request.' : 'You denied this request.');
    onDone();
  };

  return (
    <View style={styles.answer}>
      <Text style={styles.answerLabel}>High priority · answer within 48 hours</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="Reason, required if you deny"
        placeholderTextColor={c.faint}
        style={styles.answerInput}
      />
      <View style={styles.answerRow}>
        <Pressable disabled={busy} onPress={() => void send('approved')} style={[styles.answerBtn, styles.answerYes]}>
          <Text style={styles.answerYesText}>{busy ? 'Saving' : 'Approve'}</Text>
        </Pressable>
        <Pressable disabled={busy} onPress={() => void send('denied')} style={[styles.answerBtn, styles.answerNo]}>
          <Text style={styles.answerNoText}>Deny</Text>
        </Pressable>
      </View>
    </View>
  );
}

function AlertsBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { run, refresh, refreshing } = useMerchantConsole();
  const marked = useRef(false);
  const items = o.notifications.items;

  useEffect(() => {
    if (marked.current || !o.notifications.unread) return;
    marked.current = true;
    const timer = setTimeout(() => {
      void run('markNotificationsRead').then(() => refresh());
    }, 1200);
    return () => clearTimeout(timer);
  }, [o.notifications.unread, run, refresh]);

  const open = (item: ConsoleNotification) => {
    if (!item.ctaUrl) return;
    const route = consoleRouteFor(item.ctaUrl);
    if (route) {
      router.push(route);
      return;
    }
    const url = /^https?:\/\//i.test(item.ctaUrl) ? item.ctaUrl : `${SITE_URL.replace(/\/$/, '')}${item.ctaUrl}`;
    void WebBrowser.openBrowserAsync(url);
  };

  const markAll = () => {
    void run('markNotificationsRead').then(() => refresh());
  };

  return (
    <ConsolePage
      title="Notifications"
      docked
      subtitle={o.notifications.unread ? `${o.notifications.unread} unread` : 'Updates from FinderB'}
      refreshing={refreshing}
      onRefresh={() => void refresh()}
      bodyStyle={styles.list}
      right={
        o.notifications.unread ? (
          <Pressable onPress={markAll} hitSlop={8} accessibilityRole="button" accessibilityLabel="Mark all as read">
            <Text style={styles.markAll}>Mark all as read</Text>
          </Pressable>
        ) : undefined
      }
    >
      {items.length ? (
        <View style={styles.panel}>
          {items.map((item, index) => (
            <Pressable
              key={`${item.kind}-${item.id}`}
              onPress={() => open(item)}
              disabled={!item.ctaUrl || Boolean(item.ownership?.canDecide)}
              style={({ pressed }) => [
                styles.item,
                index > 0 && styles.itemLine,
                !item.read && styles.unread,
                pressed && styles.pressed,
              ]}
              accessibilityRole={item.ctaUrl ? 'button' : undefined}
            >
              <View style={[styles.icon, item.kind === 'broadcast' && styles.iconBroadcast]}>
                <Ionicons
                  name={iconFor(item)}
                  size={18}
                  color={item.kind === 'broadcast' ? c.warning : c.accent}
                />
              </View>
              <View style={styles.flex}>
                <View style={styles.head}>
                  <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {!item.read ? <View style={styles.dot} /> : null}
                </View>
                {item.body ? <Text style={styles.body}>{item.body}</Text> : null}
                {item.ownership?.canDecide ? (
                  <OwnershipAnswer requestId={item.ownership.requestId} onDone={() => void refresh()} />
                ) : item.type === 'ownership_request' && item.ownership ? (
                  <Text style={styles.time}>
                    {item.ownership.decision === 'approved'
                      ? 'You approved this request'
                      : item.ownership.decision === 'denied'
                        ? 'You denied this request'
                        : 'The 48-hour window has closed'}
                  </Text>
                ) : null}
                <View style={styles.foot}>
                  <Text style={styles.time}>
                    {item.kind === 'broadcast' ? 'Announcement · ' : ''}
                    {timeAgo(item.createdAt)}
                  </Text>
                  {item.ctaUrl ? (
                    <Text style={styles.cta}>
                      {item.ctaLabel || 'Open'}
                    </Text>
                  ) : null}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <Empty
          icon="notifications-outline"
          title="No notifications"
          body="New leads, reviews, plan reminders and FinderB announcements will show up here."
        />
      )}
    </ConsolePage>
  );
}

export default function AlertsScreen() {
  return <ConsoleGate>{(overview) => <AlertsBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  list: { paddingHorizontal: 0, paddingTop: 0 },
  panel: { backgroundColor: c.card, borderBottomWidth: 0.5, borderBottomColor: c.line },
  item: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  itemLine: { borderTopWidth: 0.5, borderTopColor: c.line },
  unread: { backgroundColor: c.primarySoft },
  pressed: { opacity: 0.8 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sunken,
  },
  iconBroadcast: { backgroundColor: c.warningSoft },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  title: { flex: 1, fontFamily: fonts.regular, fontSize: 14.5, lineHeight: 20, color: c.ink },
  titleUnread: { fontFamily: fonts.semiBold },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 6, backgroundColor: c.primary },
  body: { marginTop: 3, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: c.body },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 },
  time: { fontFamily: fonts.regular, fontSize: 12, color: c.faint },
  cta: { fontFamily: fonts.semiBold, fontSize: 13, color: c.accent },
  markAll: { fontFamily: fonts.semiBold, fontSize: 13, color: c.accent },
  answer: { marginTop: 10, gap: 8 },
  answerLabel: { fontFamily: fonts.semiBold, fontSize: 12, color: c.warning },
  answerInput: {
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: c.ink,
    backgroundColor: c.card,
  },
  answerRow: { flexDirection: 'row', gap: 8 },
  answerBtn: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  answerYes: { backgroundColor: c.primary },
  answerNo: { borderWidth: 1, borderColor: c.danger },
  answerYesText: { fontFamily: fonts.semiBold, fontSize: 13, color: c.primaryInk },
  answerNoText: { fontFamily: fonts.semiBold, fontSize: 13, color: c.danger },
}));

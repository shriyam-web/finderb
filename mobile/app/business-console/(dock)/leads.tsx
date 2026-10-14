import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { isFailure, type ConsoleLead } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import {
  Chip,
  ConsolePage,
  Empty,
  HeaderIcon,
  Tag,
  createConsoleStyles,
  timeAgo,
  useTabBack,
} from '../../../components/console/kit';
import { LEAD_STATUSES, LEAD_STATUS_TONE, dialable, type LeadStatus } from '../../../components/console/leadStatus';

type Filter = 'All' | LeadStatus;

function LeadCard({
  lead,
  busy,
  onStatus,
}: {
  lead: ConsoleLead;
  busy: boolean;
  onStatus: (status: LeadStatus) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const phone = dialable(lead.phone);
  const firstName = (lead.name || '').split(/\s+/)[0] || 'there';

  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.mark}>
          <Text style={styles.markText}>{(lead.name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {lead.name || 'Customer'}
            </Text>
            <Tag label={lead.status} tone={LEAD_STATUS_TONE[lead.status] ?? 'neutral'} />
          </View>
          <Text style={styles.meta} numberOfLines={1}>
            {[lead.category, timeAgo(lead.created_at)].filter(Boolean).join(' · ')}
          </Text>
        </View>
      </View>

      {lead.message ? (
        <Text style={styles.message} numberOfLines={2}>
          {lead.message}
        </Text>
      ) : null}

      {lead.locked ? (
        <View style={styles.locked}>
          <Ionicons name="lock-closed-outline" size={14} color={c.warning} />
          <Text style={styles.lockedText}>Phone and email stay hidden on the free plan.</Text>
        </View>
      ) : (
        <View style={styles.contactRow}>
          {lead.phone || lead.email ? (
            <Text style={styles.contactText} numberOfLines={1} selectable>
              {[lead.phone, lead.email].filter(Boolean).join(' · ')}
            </Text>
          ) : (
            <Text style={styles.contactText}>No contact on file</Text>
          )}
          <View style={styles.iconRow}>
            {phone ? (
              <Pressable
                onPress={() => void Linking.openURL(`tel:+${phone}`)}
                style={styles.iconBtn}
                accessibilityLabel={`Call ${firstName}`}
              >
                <Ionicons name="call-outline" size={16} color={c.primary} />
              </Pressable>
            ) : null}
            {phone ? (
              <Pressable
                onPress={() =>
                  void Linking.openURL(
                    `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${firstName}, thanks for reaching out on FinderB.`)}`,
                  )
                }
                style={styles.iconBtn}
                accessibilityLabel={`WhatsApp ${firstName}`}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#128C7E" />
              </Pressable>
            ) : null}
            {lead.email ? (
              <Pressable
                onPress={() => void Linking.openURL(`mailto:${lead.email}`)}
                style={styles.iconBtn}
                accessibilityLabel={`Email ${firstName}`}
              >
                <Ionicons name="mail-outline" size={16} color={c.primary} />
              </Pressable>
            ) : null}
          </View>
        </View>
      )}

      <View style={styles.track}>
        {LEAD_STATUSES.map((status) => {
          const active = lead.status === status;
          return (
            <Pressable
              key={status}
              disabled={busy || active}
              onPress={() => onStatus(status)}
              style={[styles.step, active && styles.stepActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: busy }}
              accessibilityLabel={`Mark as ${status}`}
            >
              <Text style={[styles.stepText, active && styles.stepTextActive]} numberOfLines={1}>
                {status}
              </Text>
            </Pressable>
          );
        })}
        {busy ? <ActivityIndicator style={styles.trackBusy} size="small" color={c.primary} /> : null}
      </View>
    </View>
  );
}

function LeadsBody() {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const back = useTabBack();
  const { run, notify, refresh, overview } = useMerchantConsole();
  const [leads, setLeads] = useState<ConsoleLead[] | null>(null);
  const [unlocked, setUnlocked] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<Filter>('All');
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const result = await run<{ success: true; unlocked: boolean; leads: ConsoleLead[] }>('leads');
    if (isFailure(result)) {
      setError(result.error);
      return;
    }
    setError('');
    setUnlocked(result.unlocked);
    setLeads(result.leads);
  }, [run]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const counts = useMemo(() => {
    const out: Record<string, number> = { All: leads?.length ?? 0 };
    for (const lead of leads ?? []) out[lead.status] = (out[lead.status] ?? 0) + 1;
    return out;
  }, [leads]);

  const visible = (leads ?? []).filter((lead) => filter === 'All' || lead.status === filter);

  const changeStatus = async (lead: ConsoleLead, status: LeadStatus) => {
    setBusyId(lead.id);
    const result = await run('setLeadStatus', { leadId: lead.id, status });
    setBusyId('');
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setLeads((current) => (current ?? []).map((item) => (item.id === lead.id ? { ...item, status } : item)));
    notify(`${lead.name || 'Lead'} marked ${status.toLowerCase()}`);
    void refresh();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refresh()]);
    setRefreshing(false);
  };

  return (
    <ConsolePage
      title="Leads"
      subtitle={leads ? `${leads.length} total · ${counts.New ?? 0} new` : 'Customer enquiries'}
      onBack={back}
      right={
        <HeaderIcon
          icon="notifications-outline"
          label="Notifications"
          badge={overview?.notifications.unread}
          onPress={() => router.push('/business-console/alerts')}
        />
      }
      docked
      refreshing={refreshing}
      onRefresh={() => void onRefresh()}
    >
      {!unlocked ? (
        <Pressable
          onPress={() => router.push('/business-console/plan')}
          style={({ pressed }) => [styles.unlock, pressed && styles.pressed]}
          accessibilityRole="button"
        >
          <View style={styles.unlockIcon}>
            <Ionicons name="lock-open-outline" size={20} color={c.primary} />
          </View>
          <View style={styles.flex}>
            <Text style={styles.unlockTitle}>Unlock customer contacts</Text>
            <Text style={styles.unlockBody}>Upgrade to see each customer’s phone and email and call them first.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={c.faint} />
        </Pressable>
      ) : null}

      {leads && leads.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {(['All', ...LEAD_STATUSES] as Filter[]).map((option) => (
            <Chip
              key={option}
              label={option}
              count={counts[option] ?? 0}
              active={filter === option}
              onPress={() => setFilter(option)}
            />
          ))}
        </ScrollView>
      ) : null}

      {error && !leads ? (
        <Empty icon="cloud-offline-outline" title="Couldn’t load leads" body={error} />
      ) : !leads ? (
        <ActivityIndicator style={styles.loading} color={c.primary} />
      ) : !leads.length ? (
        <Empty
          icon="people-outline"
          title="No leads yet"
          body="When a customer contacts your business on FinderB, they show up here instantly. A complete profile with photos brings more."
        />
      ) : !visible.length ? (
        <Empty icon="filter-outline" title={`No ${filter.toLowerCase()} leads`} body="Pick another filter to see the rest." />
      ) : (
        visible.map((lead) => (
          <LeadCard key={lead.id} lead={lead} busy={busyId === lead.id} onStatus={(status) => void changeStatus(lead, status)} />
        ))
      )}
    </ConsolePage>
  );
}

export default function LeadsScreen() {
  return <ConsoleGate>{() => <LeadsBody />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  pressed: { opacity: 0.8 },
  loading: { marginTop: 40 },
  unlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.primary,
  },
  unlockIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  unlockTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  unlockBody: { marginTop: 2, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 17, color: c.muted },
  filters: { gap: 8, paddingRight: 8 },
  card: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: c.card,
    borderWidth: c.isDark ? 1 : 0.5,
    borderColor: c.line,
    gap: 8,
  },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  markText: { fontFamily: fonts.semiBold, fontSize: 13, color: c.primary },
  nameLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  meta: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  message: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: c.body,
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: c.warning },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactText: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  iconRow: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sunken,
  },
  track: { flexDirection: 'row', gap: 4, marginTop: 2 },
  step: {
    flex: 1,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.sunken,
  },
  stepActive: { backgroundColor: c.primary },
  stepText: { fontFamily: fonts.regular, fontSize: 11, color: c.muted },
  stepTextActive: { fontFamily: fonts.semiBold, color: c.primaryInk },
  trackBusy: { position: 'absolute', alignSelf: 'center', left: 0, right: 0, top: 4 },
}));

import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { isFailure, type ConsoleLead } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import {
  Chip,
  ConsoleHeaderActions,
  ConsolePage,
  Empty,
  HeaderIcon,
  Menu,
  createConsoleStyles,
  timeAgo,
  useTabBack,
} from '../../../components/console/kit';
import {
  LEAD_STATUSES,
  dialable,
  isOpenPipeline,
  pipelineOf,
  type LeadStatus,
} from '../../../components/console/leadStatus';
import { LeadSourceBadge } from '../../../components/console/LeadSourceBadge';
import { ShiningNew } from '../../../components/console/ShiningNew';

type Filter = 'All' | LeadStatus;

const STATUS_ICON: Record<LeadStatus, keyof typeof Ionicons.glyphMap> = {
  'To be contacted': 'call-outline',
  'Asked to connect later': 'time-outline',
  Contacted: 'chatbubble-ellipses-outline',
  'Not interested': 'close-circle-outline',
  'Wrong lead': 'alert-circle-outline',
  Converted: 'trophy-outline',
  Closed: 'archive-outline',
};

const STATUS_LOOK: Record<LeadStatus, { solid: string; soft: string; ink: string; line: string }> = {
  'To be contacted': { solid: '#1D4ED8', soft: '#EFF6FF', ink: '#1E40AF', line: '#BFDBFE' },
  'Asked to connect later': { solid: '#C2410C', soft: '#FFF7ED', ink: '#9A3412', line: '#FDBA74' },
  Contacted: { solid: '#0F766E', soft: '#F0FDFA', ink: '#115E59', line: '#99F6E4' },
  'Not interested': { solid: '#B42318', soft: '#FEF2F2', ink: '#991B1B', line: '#FECACA' },
  'Wrong lead': { solid: '#6D28D9', soft: '#F5F3FF', ink: '#5B21B6', line: '#DDD6FE' },
  Converted: { solid: '#067647', soft: '#ECFDF3', ink: '#065F46', line: '#A7F3D0' },
  Closed: { solid: '#3F3F46', soft: '#F4F4F5', ink: '#3F3F46', line: '#D4D4D8' },
};

function LeadId({ id }: { id: string }) {
  const styles = useStyles();
  const [copied, setCopied] = useState(false);
  return (
    <Pressable
      onPress={() => {
        void Clipboard.setStringAsync(id).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        });
      }}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Copy lead id ${id}`}
      style={styles.leadIdBox}
    >
      <Text style={styles.leadId}>{copied ? 'Copied' : 'Lead ID'}</Text>
    </Pressable>
  );
}

function notePreview(note: string) {
  const words = note.replace(/\s+/g, ' ').trim().split(' ');
  if (words.length <= 5) return words.join(' ');
  return `${words.slice(0, 5).join(' ')}…`;
}

function LeadCard({
  lead,
  busy,
  onStatus,
  onOpen,
  onNote,
}: {
  lead: ConsoleLead;
  busy: boolean;
  onStatus: (status: LeadStatus) => void;
  onOpen: (href: string) => void;
  onNote: (note: string) => Promise<boolean>;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const phone = dialable(lead.phone);
  const firstName = (lead.name || '').split(/\s+/)[0] || 'there';
  const pipeline = pipelineOf(lead.status);
  const waiting = pipeline === 'To be contacted';
  const look = STATUS_LOOK[pipeline];
  const dark = c.isDark;
  const settledInk = waiting ? '#FFFFFF' : dark ? '#FAFAF9' : look.ink;
  const statuses = [pipeline, ...LEAD_STATUSES.filter((status) => status !== pipeline)];
  const savedNote = (lead.merchant_note || '').trim();
  const [editing, setEditing] = useState(false);
  const [noteAsk, setNoteAsk] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [meaning, setMeaning] = useState<{ title: string; body: string } | null>(null);
  const [draft, setDraft] = useState(savedNote);
  useEffect(() => {
    if (!editing) setDraft(savedNote);
  }, [editing, savedNote]);
  const body = (
      <>
      <View style={styles.cardHead}>
        <View
          style={[
            styles.mark,
            waiting
              ? styles.markHot
              : {
                  backgroundColor: dark ? 'rgba(255,255,255,0.06)' : look.soft,
                  borderWidth: 1.5,
                  borderColor: look.solid,
                },
          ]}
        >
          <Text style={[styles.markText, waiting ? styles.onHot : { color: settledInk }]}>
            {(lead.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.nameLine}>
            <Text style={[styles.name, waiting && styles.onHot]} numberOfLines={1}>
              {lead.name || 'Customer'}
            </Text>
            {waiting ? (
              <ShiningNew />
            ) : (
              <View
                style={[
                  styles.statusMark,
                  {
                    backgroundColor: dark ? 'rgba(255,255,255,0.08)' : look.soft,
                    borderColor: dark ? look.solid : look.line,
                  },
                ]}
              >
                <Ionicons name={STATUS_ICON[pipeline]} size={10} color={settledInk} />
                <Text style={[styles.statusMarkText, { color: settledInk }]}>{pipeline}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.meta, waiting && styles.onHotMuted]} numberOfLines={1}>
            {[lead.category, timeAgo(lead.created_at)].filter(Boolean).join(' · ')}
          </Text>
        </View>
        <View style={styles.sideCol}>
          <LeadId id={lead.id} />
          <LeadSourceBadge
            lead={lead}
            align="end"
            onMeaning={(next) => setMeaning((current) => (current?.title === next.title ? null : next))}
          />
        </View>
      </View>

      {meaning ? (
        <View style={[styles.sourceHelp, waiting && styles.sourceHelpHot]}>
          <Text style={[styles.sourceHelpTitle, waiting && styles.onHot]}>{meaning.title}</Text>
          <Text style={[styles.sourceHelpBody, waiting && styles.onHotBody]}>{meaning.body}</Text>
          <Pressable onPress={() => setMeaning(null)} hitSlop={6} accessibilityRole="button">
            <Text style={[styles.sourceHelpClose, waiting && styles.onHot]}>Got it</Text>
          </Pressable>
        </View>
      ) : null}

      {editing || !savedNote || confirmRemove ? (
      <View style={styles.noteRow}>
        {editing ? (
          <View style={styles.noteEditor}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Private note for your team"
              placeholderTextColor={waiting ? 'rgba(255,255,255,0.45)' : c.faint}
              multiline
              maxLength={500}
              style={[
                styles.noteInput,
                waiting
                  ? { color: '#FFFFFF', backgroundColor: 'rgba(255,255,255,0.08)', borderColor: 'rgba(255,255,255,0.22)' }
                  : { color: c.ink, backgroundColor: c.card, borderColor: c.line },
              ]}
            />
            <View style={styles.noteActions}>
              <Pressable
                onPress={() => {
                  setDraft(savedNote);
                  setEditing(false);
                }}
                style={styles.noteGhost}
                accessibilityRole="button"
              >
                <Text style={[styles.noteGhostText, waiting && styles.onHot]}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => {
                  void onNote(draft).then((ok) => {
                    if (ok) setEditing(false);
                  });
                }}
                style={[styles.noteSave, busy && styles.pressed]}
                accessibilityRole="button"
              >
                <Text style={styles.noteSaveText}>{savedNote ? 'Save' : 'Add note'}</Text>
              </Pressable>
            </View>
          </View>
        ) : confirmRemove ? (
          <View style={styles.noteActions}>
            <Text style={[styles.noteGhostText, waiting && styles.onHot]}>Remove this note?</Text>
            <Pressable onPress={() => setConfirmRemove(false)} style={styles.noteGhost} accessibilityRole="button">
              <Text style={[styles.noteGhostText, waiting && styles.onHot]}>Keep</Text>
            </Pressable>
            <Pressable
              disabled={busy}
              onPress={() => {
                void onNote('').then((ok) => {
                  if (ok) setConfirmRemove(false);
                });
              }}
              style={styles.noteGhost}
              accessibilityRole="button"
              accessibilityLabel="Confirm remove note"
            >
              <Text style={[styles.noteGhostText, { color: waiting ? '#FECACA' : c.danger }]}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            style={[styles.addNote, waiting && styles.addNoteHot]}
            accessibilityRole="button"
            accessibilityLabel="Add note"
          >
            <Ionicons name="add" size={12} color={waiting ? '#FFFFFF' : c.ink} />
            <Text style={[styles.addNoteText, waiting && styles.onHot]}>Add note</Text>
          </Pressable>
        )}
      </View>
      ) : null}

      {lead.message ? (
        <View
          style={
            waiting
              ? undefined
              : [
                  styles.messageWell,
                  {
                    backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)',
                    borderColor: dark ? 'rgba(255,255,255,0.1)' : look.line,
                  },
                ]
          }
        >
          <Text style={[styles.message, waiting && styles.onHotBody]}>{lead.message}</Text>
        </View>
      ) : null}

      {lead.locked ? (
        <View style={styles.locked}>
          <Ionicons name="lock-closed-outline" size={14} color={c.warning} />
          <Text style={styles.lockedText}>Phone and email stay hidden on the free plan.</Text>
        </View>
      ) : (
        <View style={styles.contactRow}>
          {phone || lead.email ? (
          <View style={styles.iconRow}>
            {phone ? (
              <Pressable
                onPress={() => onOpen(`tel:+${phone}`)}
                style={[styles.iconBtn, styles.callBtn]}
                accessibilityLabel={`Call ${firstName}`}
              >
                <Ionicons name="call" size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
            {phone ? (
              <Pressable
                onPress={() =>
                  onOpen(
                    `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${firstName}, thanks for reaching out on FinderB.`)}`,
                  )
                }
                style={[styles.iconBtn, styles.whatsappBtn]}
                accessibilityLabel={`WhatsApp ${firstName}`}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
            {lead.email ? (
              <Pressable
                onPress={() => onOpen(`mailto:${lead.email}`)}
                style={[styles.iconBtn, styles.mailBtn]}
                accessibilityLabel={`Email ${firstName}`}
              >
                <Ionicons name="mail" size={16} color="#FFFFFF" />
              </Pressable>
            ) : null}
          </View>
          ) : (
            <Text style={styles.contactText}>No contact on file</Text>
          )}
        </View>
      )}

      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.track}>
          {statuses.map((status) => {
            const active = pipeline === status;
            const look = STATUS_LOOK[status];
            const ink = active ? '#FFFFFF' : waiting ? 'rgba(255,255,255,0.92)' : look.ink;
            return (
              <Pressable
                key={status}
                disabled={busy || active}
                onPress={() => onStatus(status)}
                style={[
                  styles.step,
                  {
                    backgroundColor: active ? look.solid : waiting ? 'rgba(255,255,255,0.1)' : look.soft,
                    borderColor: active ? look.solid : waiting ? 'rgba(255,255,255,0.28)' : look.line,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: active, disabled: busy }}
                accessibilityLabel={`Mark as ${status}`}
              >
                <Ionicons name={STATUS_ICON[status]} size={11} color={ink} />
                <Text style={[styles.stepText, { color: ink }]}>{status}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
        {busy ? <ActivityIndicator style={styles.trackBusy} size="small" color={waiting ? '#FFFFFF' : c.primary} /> : null}
      </View>
      </>
  );

  const card = !waiting ? (
    <LinearGradient
      colors={dark ? [`${look.solid}38`, c.card] : [look.soft, c.card]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, { borderColor: dark ? `${look.solid}66` : look.line }]}
    >
      {body}
    </LinearGradient>
  ) : (
    <LinearGradient colors={['#1C4668', '#0E2438']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.card, styles.cardHot]}>
      <View style={styles.hotRule} />
      {body}
    </LinearGradient>
  );

  return (
    <View style={[styles.leadWrap, savedNote && !editing ? styles.leadWrapNoted : null]}>
      {savedNote && !editing ? (
        <Pressable
          onPress={() => {
            setConfirmRemove(false);
            setNoteAsk(true);
          }}
          style={styles.noteFlag}
          accessibilityRole="button"
          accessibilityLabel={`Note: ${savedNote}. Edit or remove`}
        >
          <Ionicons name="document-text" size={12} color="#92400E" />
          <Text style={styles.noteFlagText} numberOfLines={1}>
            {notePreview(savedNote)}
          </Text>
        </Pressable>
      ) : null}
      {card}
      <Menu
        visible={noteAsk}
        title="Edit or remove this note?"
        onClose={() => setNoteAsk(false)}
        items={[
          {
            label: 'Edit',
            icon: 'create-outline',
            onPress: () => {
              setNoteAsk(false);
              setConfirmRemove(false);
              setEditing(true);
            },
          },
          {
            label: 'Remove',
            icon: 'trash-outline',
            tone: 'danger',
            onPress: () => {
              setNoteAsk(false);
              setConfirmRemove(true);
            },
          },
        ]}
      />
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [kind, setKind] = useState<'customers' | 'jobs'>('customers');
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

  const isJobLead = (lead: ConsoleLead) => (lead.category || '').trim().toLowerCase() === 'job application';
  const customerLeads = (leads ?? []).filter((lead) => !isJobLead(lead));
  const jobLeads = (leads ?? []).filter(isJobLead);
  const scoped = kind === 'jobs' ? jobLeads : customerLeads;

  const counts = useMemo(() => {
    const out: Record<string, number> = { All: scoped.length };
    for (const lead of scoped) {
      const status = pipelineOf(lead.status);
      out[status] = (out[status] ?? 0) + 1;
    }
    return out;
  }, [scoped]);

  const visible = scoped.filter((lead) => filter === 'All' || pipelineOf(lead.status) === filter);

  const changeNote = async (lead: ConsoleLead, note: string) => {
    setBusyId(lead.id);
    const result = await run<{ success: true; note: string }>('setLeadNote', { leadId: lead.id, note });
    setBusyId('');
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return false;
    }
    const saved = result.note.trim();
    setLeads((current) =>
      (current ?? []).map((item) => (item.id === lead.id ? { ...item, merchant_note: saved || null } : item)),
    );
    return true;
  };

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
    setLeads((current) =>
      (current ?? []).map((item) =>
        item.id === lead.id ? { ...item, merchant_read_at: item.merchant_read_at || new Date().toISOString() } : item,
      ),
    );
    void refresh();
  };

  const openContact = async (lead: ConsoleLead, href: string) => {
    if (!lead.merchant_read_at) {
      const result = await run('markLeadRead', { leadId: lead.id });
      if (!isFailure(result)) {
        setLeads((current) =>
          (current ?? []).map((item) =>
            item.id === lead.id ? { ...item, merchant_read_at: new Date().toISOString() } : item,
          ),
        );
        void refresh();
      }
    }
    void Linking.openURL(href);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([load(), refresh()]);
    setRefreshing(false);
  };

  return (
    <ConsolePage
      title="Leads"
      subtitle={
        leads
          ? `${customerLeads.length} customers · ${jobLeads.length} job applications`
          : 'Customer enquiries'
      }
      onBack={back}
      right={
        <ConsoleHeaderActions>
          <HeaderIcon
            icon="notifications-outline"
            label="Notifications"
            badge={overview?.notifications.unread}
            onPress={() => router.push('/business-console/alerts')}
          />
        </ConsoleHeaderActions>
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

      {leads ? (
        <View style={styles.kindRow}>
          <Chip
            label="Customers"
            count={customerLeads.length}
            active={kind === 'customers'}
            onPress={() => {
              setKind('customers');
              setFilter('All');
            }}
          />
          <Chip
            label="Job applications"
            count={jobLeads.length}
            active={kind === 'jobs'}
            onPress={() => {
              setKind('jobs');
              setFilter('All');
            }}
          />
          {scoped.length ? (
            <Pressable
              onPress={() => setFiltersOpen((open) => !open)}
              style={({ pressed }) => [styles.filterBtn, filter !== 'All' && styles.filterBtnOn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={filter === 'All' ? 'Filters' : `Filters, ${filter}`}
            >
              <Ionicons name="options-outline" size={15} color={filter !== 'All' ? c.primary : c.body} />
              <Text style={[styles.filterBtnText, filter !== 'All' && styles.filterBtnTextOn]} numberOfLines={1}>
                {filter === 'All' ? 'Filters' : filter}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {filtersOpen && scoped.length ? (
        <View style={styles.filterPanel}>
          {(['All', ...LEAD_STATUSES] as Filter[]).map((option) => (
            <Chip
              key={option}
              small
              label={option}
              count={counts[option] ?? 0}
              active={filter === option}
              onPress={() => {
                setFilter(option);
                setFiltersOpen(false);
              }}
            />
          ))}
        </View>
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
      ) : !scoped.length ? (
        <Empty
          icon={kind === 'jobs' ? 'briefcase-outline' : 'people-outline'}
          title={kind === 'jobs' ? 'No job applications' : 'No customer leads'}
          body={
            kind === 'jobs'
              ? 'Applications to your job posts show up here, separate from customer enquiries.'
              : 'Customer enquiries stay here. Job applications are on the next tab.'
          }
        />
      ) : !visible.length ? (
        <Empty icon="filter-outline" title={`No ${filter.toLowerCase()} leads`} body="Pick another filter to see the rest." />
      ) : (
        visible.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            busy={busyId === lead.id}
            onStatus={(status) => void changeStatus(lead, status)}
            onOpen={(href) => void openContact(lead, href)}
            onNote={(note) => changeNote(lead, note)}
          />
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
  leadWrap: { position: 'relative' },
  leadWrapNoted: { marginTop: 8 },
  noteFlag: {
    position: 'absolute',
    top: -10,
    left: 16,
    zIndex: 3,
    maxWidth: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    height: 22,
    borderRadius: 999,
    backgroundColor: '#FFF4CC',
    borderWidth: 1,
    borderColor: '#E7B15A',
  },
  noteFlagText: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 11, color: '#92400E' },
  sourceHelp: {
    gap: 4,
    padding: 10,
    borderRadius: 12,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
  },
  sourceHelpHot: { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.22)' },
  sourceHelpTitle: { fontFamily: fonts.semiBold, fontSize: 13, color: c.ink },
  sourceHelpBody: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.body },
  sourceHelpClose: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.ink, marginTop: 2 },
  noteRow: { alignItems: 'flex-start' },
  noteEditor: { alignSelf: 'stretch', gap: 8 },
  noteInput: {
    minHeight: 64,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    textAlignVertical: 'top',
  },
  noteActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  noteGhost: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 2 },
  noteGhostText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.ink },
  noteSave: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: c.primary },
  noteSaveText: { fontFamily: fonts.semiBold, fontSize: 12.5, color: c.primaryInk },
  addNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 7,
    height: 22,
    borderRadius: 999,
    backgroundColor: c.sunken,
    borderWidth: 1,
    borderColor: c.line,
  },
  addNoteHot: { backgroundColor: 'rgba(255,255,255,0.12)', borderColor: 'rgba(255,255,255,0.28)' },
  addNoteText: { fontFamily: fonts.semiBold, fontSize: 11, color: c.ink },
  kindRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 8 },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
    maxWidth: '100%',
  },
  filterBtnOn: { backgroundColor: c.primarySoft, borderColor: c.primary },
  filterBtnText: { flexShrink: 1, fontFamily: fonts.regular, fontSize: 13.5, color: c.body },
  filterBtnTextOn: { fontFamily: fonts.semiBold, color: c.primary },
  filterPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -2,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
  },
  card: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
    gap: 10,
    overflow: 'hidden',
  },
  statusMark: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
  },
  statusMarkText: { fontFamily: fonts.semiBold, fontSize: 10, lineHeight: 12 },
  messageWell: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 8 },
  cardHot: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(231,177,90,0.45)',
    backgroundColor: 'transparent',
  },
  hotRule: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, backgroundColor: '#E7B15A' },
  onHot: { color: '#FFFFFF' },
  onHotMuted: { color: 'rgba(255,255,255,0.72)' },
  onHotBody: { color: 'rgba(255,255,255,0.88)' },
  markHot: { backgroundColor: 'rgba(255,255,255,0.08)', borderWidth: 1, borderColor: '#E7B15A' },
  sideCol: { alignItems: 'flex-end', gap: 6 },
  callBtn: { backgroundColor: '#2563EB' },
  whatsappBtn: { backgroundColor: '#25D366' },
  mailBtn: { backgroundColor: '#EA4335' },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  mark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  markText: { fontFamily: fonts.semiBold, fontSize: 13, color: c.primary },
  nameLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
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
  leadIdBox: {
    borderWidth: 1,
    borderColor: c.lineStrong,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    backgroundColor: c.sunken,
  },
  leadId: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: c.body,
  },
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
  track: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingRight: 4 },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  stepText: { fontFamily: fonts.semiBold, fontSize: 10, lineHeight: 13 },
  trackBusy: { position: 'absolute', alignSelf: 'center', left: 0, right: 0, top: 8 },
}));

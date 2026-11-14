import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, Text, TextInput, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../../constants/typography';
import { useConsoleColors } from '../../../constants/consoleColors';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { isFailure, type ConsoleLead } from '../../../lib/merchantConsoleApi';
import { ConsoleGate } from '../../../components/console/ConsoleGate';
import {
  Btn,
  Chip,
  ConsoleHeaderActions,
  ConsolePage,
  Empty,
  HeaderIcon,
  Menu,
  createConsoleStyles,
  leadWhen,
  useTabBack,
} from '../../../components/console/kit';
import {
  LEAD_STATUSES,
  dialable,
  pipelineOf,
  type LeadStatus,
} from '../../../components/console/leadStatus';
import { LeadSourceBadge } from '../../../components/console/LeadSourceBadge';
import { ShiningNew } from '../../../components/console/ShiningNew';

const SYSTEM_LEAD_LINES = new Set([
  'Clicked Call on business profile',
  'Clicked WhatsApp on business profile',
  'Opened enquiry form on business profile',
]);

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
      <Text style={styles.leadIdLabel}>ID</Text>
      <Text style={styles.leadId}>{copied ? 'Copied' : id.replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase() || '—'}</Text>
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
  const look = STATUS_LOOK[pipeline];
  const dark = c.isDark;
  const settledInk = dark ? '#FAFAF9' : look.ink;
  const systemLine = SYSTEM_LEAD_LINES.has((lead.message || '').trim());
  const others = LEAD_STATUSES.filter((status) => status !== pipeline);
  const savedNote = (lead.merchant_note || '').trim();
  const [editing, setEditing] = useState(false);
  const [noteAsk, setNoteAsk] = useState(false);
  const [statusOpen, setStatusOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [meaning, setMeaning] = useState<{ title: string; body: string } | null>(null);
  const [draft, setDraft] = useState(savedNote);
  useEffect(() => {
    if (!editing) setDraft(savedNote);
  }, [editing, savedNote]);
  const body = (
      <>
      <View style={styles.cardHead}>
        <View style={[styles.mark, { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : look.soft, borderWidth: 1.5, borderColor: look.solid }]}>
          <Text style={[styles.markText, { color: settledInk }]}>
            {(lead.name || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.flex}>
          <View style={styles.nameLine}>
            <Text style={styles.name} numberOfLines={1}>
              {lead.name || 'Customer'}
            </Text>
            {pipeline === 'To be contacted' ? <ShiningNew /> : null}
          </View>
          <Text style={styles.meta} numberOfLines={2}>
            {[lead.category, leadWhen(lead.created_at)].filter(Boolean).join(' · ')}
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
        <View style={styles.sourceHelp}>
          <Text style={styles.sourceHelpTitle}>{meaning.title}</Text>
          <Text style={styles.sourceHelpBody}>{meaning.body}</Text>
          <Pressable onPress={() => setMeaning(null)} hitSlop={6} accessibilityRole="button">
            <Text style={styles.sourceHelpClose}>Got it</Text>
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
              placeholderTextColor={c.faint}
              multiline
              maxLength={500}
              style={[styles.noteInput, { color: c.ink, backgroundColor: c.card, borderColor: c.line }]}
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
                <Text style={styles.noteGhostText}>Cancel</Text>
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
            <Text style={styles.noteGhostText}>Remove this note?</Text>
            <Pressable onPress={() => setConfirmRemove(false)} style={styles.noteGhost} accessibilityRole="button">
              <Text style={styles.noteGhostText}>Keep</Text>
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
              <Text style={[styles.noteGhostText, { color: c.danger }]}>Remove</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => setEditing(true)}
            style={styles.addNote}
            accessibilityRole="button"
            accessibilityLabel="Add note"
          >
            <Ionicons name="add" size={12} color={c.ink} />
            <Text style={styles.addNoteText}>Add note</Text>
          </Pressable>
        )}
      </View>
      ) : null}

      {lead.message ? (
        systemLine ? (
          <Text style={styles.systemLine}>{lead.message}</Text>
        ) : (
          <View style={[styles.messageWell, { backgroundColor: dark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.72)', borderColor: dark ? 'rgba(255,255,255,0.1)' : look.line }]}>
            <Text style={styles.message}>{lead.message}</Text>
          </View>
        )
      ) : null}

      {lead.locked ? (
        <View style={styles.locked}>
          <Ionicons name="lock-closed-outline" size={14} color={c.warning} />
          <Text style={styles.lockedText}>Phone and email stay hidden on the free plan.</Text>
        </View>
      ) : (
        <View style={styles.contactRow}>
          {phone || lead.email ? (
            <View style={styles.loudRow}>
              {phone ? (
                <Pressable
                  onPress={() => onOpen(`tel:+${phone}`)}
                  style={styles.loudCall}
                  accessibilityRole="button"
                  accessibilityLabel={`Call ${firstName}`}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.loudText}>Call</Text>
                </Pressable>
              ) : null}
              {phone ? (
                <Pressable
                  onPress={() =>
                    onOpen(
                      `https://wa.me/${phone}?text=${encodeURIComponent(`Hi ${firstName}, thanks for reaching out on FinderB.`)}`,
                    )
                  }
                  style={styles.loudWhatsapp}
                  accessibilityRole="button"
                  accessibilityLabel={`WhatsApp ${firstName}`}
                >
                  <Ionicons name="logo-whatsapp" size={16} color="#FFFFFF" />
                  <Text style={styles.loudText}>WhatsApp</Text>
                </Pressable>
              ) : null}
              {lead.email ? (
                <Pressable
                  onPress={() => onOpen(`mailto:${lead.email}`)}
                  style={styles.loudMail}
                  accessibilityRole="button"
                  accessibilityLabel={`Email ${firstName}`}
                >
                  <Ionicons name="mail" size={16} color="#FFFFFF" />
                  <Text style={styles.loudText}>Email</Text>
                </Pressable>
              ) : null}
            </View>
          ) : (
            <Text style={styles.contactText}>No contact on file</Text>
          )}
        </View>
      )}

      <View style={styles.statusRow}>
        <View
          style={[
            styles.currentStatus,
            {
              backgroundColor: dark ? 'rgba(255,255,255,0.08)' : look.soft,
              borderColor: dark ? look.solid : look.line,
            },
          ]}
        >
          <Ionicons name={STATUS_ICON[pipeline]} size={12} color={settledInk} />
          <Text style={[styles.currentStatusText, { color: settledInk }]}>{pipeline}</Text>
        </View>
        <Pressable
          onPress={() => setStatusOpen(true)}
          disabled={busy}
          style={[styles.changeStatus, busy && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel={`Change status from ${pipeline}`}
        >
          <Text style={styles.changeStatusText}>Change</Text>
          <Ionicons name="chevron-down" size={12} color={c.ink} />
        </Pressable>
        {busy ? <ActivityIndicator style={styles.statusBusy} size="small" color={c.primary} /> : null}
      </View>
      </>
  );

  const card = (
    <View style={[styles.card, { borderColor: dark ? `${look.solid}66` : look.line }]}>
      {body}
    </View>
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
        visible={statusOpen}
        title="Change status"
        onClose={() => setStatusOpen(false)}
        items={others.map((status) => ({
          label: status,
          icon: STATUS_ICON[status],
          onPress: () => onStatus(status),
        }))}
      />
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
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [kind, setKind] = useState<'customers' | 'jobs'>('customers');
  const [busyId, setBusyId] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [shown, setShown] = useState(50);

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
  const byNewest = (a: ConsoleLead, b: ConsoleLead) =>
    Date.parse(b.created_at || '') - Date.parse(a.created_at || '');
  const waitingFirst = (a: ConsoleLead, b: ConsoleLead) => {
    const rank = (lead: ConsoleLead) => (pipelineOf(lead.status) === 'To be contacted' ? 0 : 1);
    const diff = rank(a) - rank(b);
    return diff || byNewest(a, b);
  };
  const customerLeads = (leads ?? []).filter((lead) => !isJobLead(lead)).sort(waitingFirst);
  const jobLeads = (leads ?? []).filter(isJobLead).sort(waitingFirst);
  const showJobs = (overview?.stats.activeJobs ?? 0) > 0;
  const scoped = kind === 'jobs' && showJobs ? jobLeads : customerLeads;
  const needle = query.trim().toLowerCase();
  const needleDigits = needle.replace(/\D/g, '');

  const counts = useMemo(() => {
    const out: Record<string, number> = { All: scoped.length };
    for (const lead of scoped) {
      const status = pipelineOf(lead.status);
      out[status] = (out[status] ?? 0) + 1;
    }
    return out;
  }, [scoped]);

  const visible = scoped.filter((lead) => {
    if (needle) {
      const name = (lead.name || '').toLowerCase();
      const phone = (lead.phone || '').replace(/\D/g, '');
      return name.includes(needle) || (lead.phone || '').toLowerCase().includes(needle) || (needleDigits.length >= 3 && phone.includes(needleDigits));
    }
    return filter === 'All' || pipelineOf(lead.status) === filter;
  });
  const page = visible.slice(0, shown);

  useEffect(() => {
    setShown(50);
  }, [kind, filter, query]);

  useEffect(() => {
    if (!showJobs && kind === 'jobs') setKind('customers');
  }, [showJobs, kind]);
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

  const changeStatus = async (lead: ConsoleLead, status: LeadStatus, undoing = false) => {
    const previous = pipelineOf(lead.status);
    setBusyId(lead.id);
    const result = await run('setLeadStatus', { leadId: lead.id, status });
    setBusyId('');
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setLeads((current) =>
      (current ?? []).map((item) =>
        item.id === lead.id
          ? { ...item, status, merchant_read_at: item.merchant_read_at || new Date().toISOString() }
          : item,
      ),
    );
    if (undoing) notify('Status restored');
    else notify('Status saved', 'good', { label: 'Undo', onPress: () => void changeStatus(lead, previous, true) });
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
    const pipeline = pipelineOf(lead.status);
    if (pipeline !== 'Contacted' && pipeline !== 'Converted' && pipeline !== 'Closed') {
      void changeStatus(lead, 'Contacted');
    }
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
          ? `${customerLeads.filter((lead) => pipelineOf(lead.status) === 'To be contacted').length} to contact`
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
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name or phone"
          placeholderTextColor={c.faint}
          autoCorrect={false}
          autoCapitalize="none"
          style={styles.search}
          accessibilityLabel="Search leads by name or phone"
        />
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
          {showJobs ? (
            <Chip
              label="Job applications"
              count={jobLeads.length}
              active={kind === 'jobs'}
              onPress={() => {
                setKind('jobs');
                setFilter('All');
              }}
            />
          ) : null}
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
          body="When a customer contacts your shop on FinderB, they show up here. A photo and your hours bring more."
        />
      ) : !scoped.length ? (
        <Empty
          icon={kind === 'jobs' ? 'briefcase-outline' : 'people-outline'}
          title={kind === 'jobs' ? 'No job applications' : 'No customer leads'}
          body={
            kind === 'jobs'
              ? 'Applications to your job posts show up here, separate from customer enquiries.'
              : 'Customer enquiries stay here.'
          }
        />
      ) : !visible.length ? (
        <Empty
          icon={needle ? 'search-outline' : 'filter-outline'}
          title={needle ? 'No matching leads' : `No ${filter.toLowerCase()} leads`}
          body={needle ? 'Try another name or phone number.' : 'Pick another filter to see the rest.'}
        />
      ) : (
        <>
          {page.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              busy={busyId === lead.id}
              onStatus={(status) => void changeStatus(lead, status)}
              onOpen={(href) => void openContact(lead, href)}
              onNote={(note) => changeNote(lead, note)}
            />
          ))}
          {shown < visible.length ? (
            <Btn
              tone="outline"
              label={`Load more (${visible.length - shown} left)`}
              onPress={() => setShown((count) => count + 50)}
            />
          ) : null}
        </>
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
  leadWrapNoted: { marginTop: 6 },
  noteFlag: {
    position: 'absolute',
    top: -8,
    left: 12,
    zIndex: 3,
    maxWidth: '78%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    height: 18,
    borderRadius: 999,
    backgroundColor: '#FFF4CC',
    borderWidth: 1,
    borderColor: '#E7B15A',
  },
  noteFlagText: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 10, color: '#92400E' },
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
  search: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
    paddingHorizontal: 12,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: c.ink,
  },
  systemLine: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.faint },
  loudRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', flexWrap: 'wrap', gap: 8 },
  loudCall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#2563EB',
  },
  loudWhatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#128C7E',
  },
  loudMail: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#EA4335',
  },
  loudText: { fontFamily: fonts.semiBold, fontSize: 14, color: '#FFFFFF' },
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
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
    gap: 6,
    overflow: 'hidden',
  },
  statusRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  currentStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  currentStatusText: { fontFamily: fonts.semiBold, fontSize: 11, lineHeight: 14 },
  changeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  changeStatusHot: { borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(255,255,255,0.1)' },
  changeStatusText: { fontFamily: fonts.semiBold, fontSize: 11, lineHeight: 14, color: c.ink },
  statusBusy: { position: 'absolute', alignSelf: 'center' },
  messageWell: { borderRadius: 8, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5 },
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
  sideCol: { alignItems: 'flex-end', gap: 4 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  mark: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  markText: { fontFamily: fonts.semiBold, fontSize: 12, color: c.primary },
  nameLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  name: { flexShrink: 1, fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  meta: { marginTop: 0, fontFamily: fonts.regular, fontSize: 11, color: c.muted },
  message: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: c.body,
  },
  locked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: c.warning },
  leadIdBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: c.lineStrong,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: c.sunken,
  },
  leadIdLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    letterSpacing: 0.3,
    color: c.faint,
  },
  leadId: {
    fontFamily: fonts.semiBold,
    fontSize: 10,
    color: c.body,
  },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  contactText: { flex: 1, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
}));


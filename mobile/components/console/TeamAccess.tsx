import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure } from '../../lib/merchantConsoleApi';
import {
  TEAM_INVITE_HOURS,
  TEAM_TABS,
  defaultInviteAccess,
  summarizeTeamAccess,
  type TeamAccessMap,
  type TeamInviteChannel,
  type TeamTabKey,
} from '../../lib/teamAccess';
import { Btn, Field, Panel, Section, Tag, createConsoleStyles } from './kit';

type Member = {
  id: string;
  email: string | null;
  mobile: string | null;
  status: 'pending' | 'active' | 'revoked' | 'expired';
  access: TeamAccessMap;
  contactVerified?: boolean;
  lastInviteSentAt?: string | null;
  inviteExpiresAt?: string | null;
};

type Step = 'list' | 'channel' | 'contact' | 'access';

function openWhatsAppHandoff(handoff?: { mobile: string; message: string }) {
  if (!handoff?.mobile || !handoff.message) return false;
  void Linking.openURL(`https://wa.me/91${handoff.mobile}?text=${encodeURIComponent(handoff.message)}`);
  return true;
}

function hoursLeft(member: Pick<Member, 'inviteExpiresAt' | 'lastInviteSentAt'>) {
  const fromExpiry = member.inviteExpiresAt ? new Date(member.inviteExpiresAt).getTime() : Number.POSITIVE_INFINITY;
  const fromSent = member.lastInviteSentAt
    ? new Date(member.lastInviteSentAt).getTime() + TEAM_INVITE_HOURS * 60 * 60 * 1000
    : Number.POSITIVE_INFINITY;
  const end = Math.min(fromExpiry, fromSent);
  if (!Number.isFinite(end)) return null;
  const ms = end - Date.now();
  if (ms <= 0) return 0;
  return Math.max(1, Math.ceil(ms / (60 * 60 * 1000)));
}

export function TeamAccess() {
  const styles = useStyles();
  const c = useConsoleColors();
  const { overview, run, notify } = useMerchantConsole();
  const isOwner = overview?.actor?.isOwner !== false;
  const [members, setMembers] = useState<Member[]>([]);
  const [step, setStep] = useState<Step>('list');
  const [channel, setChannel] = useState<TeamInviteChannel>('email');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [access, setAccess] = useState<TeamAccessMap>(defaultInviteAccess);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const result = await run<{ success: true; members: Member[] }>('listTeam');
    if (!isFailure(result)) setMembers(result.members || []);
  }, [run]);

  useEffect(() => {
    if (isOwner) void load();
  }, [isOwner, load]);

  if (!isOwner) return null;

  const reset = () => {
    setStep('list');
    setChannel('email');
    setEmail('');
    setMobile('');
    setAccess(defaultInviteAccess());
    setDraftId(null);
  };

  const sendCode = async () => {
    setBusy(true);
    const result = await run<{ success: true; member: Member; warning?: string; handoff?: { mobile: string; message: string } }>('inviteTeam', {
      channel,
      email,
      mobile,
      access,
    });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    setDraftId(result.member.id);
    if (openWhatsAppHandoff(result.handoff)) {
      notify('WhatsApp is open. Tap Send so they get a working invite link.');
    } else {
      notify(result.warning || 'Invite link sent.');
    }
    setStep('access');
    await load();
  };

  const saveAccess = async (memberId: string, next: TeamAccessMap, close = false) => {
    setBusy(true);
    const result = await run('updateTeamAccess', { memberId, access: next });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    notify('Access updated.');
    if (close) reset();
    setEditingId(null);
    await load();
  };

  const resend = async (memberId: string) => {
    setBusy(true);
    const result = await run<{ success: true; warning?: string; handoff?: { mobile: string; message: string } }>('resendTeam', { memberId });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    if (openWhatsAppHandoff(result.handoff)) {
      notify('WhatsApp is open. Tap Send so they get a working invite link.');
    } else {
      notify(result.warning || 'Invite link sent again.');
    }
    await load();
  };

  const revoke = (member: Member) => {
    Alert.alert('Remove this person?', 'They will no longer be able to sign in to this business.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const result = await run('revokeTeam', { memberId: member.id });
          if (isFailure(result)) {
            notify(result.error, 'bad');
            return;
          }
          if (draftId === member.id) reset();
          await load();
        },
      },
    ]);
  };

  return (
    <Section title="Team access">
      {step === 'list' ? (
        <Panel>
          <Text style={styles.hint}>
            Invite by email or phone with a link, then tick View or Edit for each tab. Invites
            cancel after {TEAM_INVITE_HOURS} hours if they are not accepted. Only you can change these rights.
          </Text>
          <Btn label="Invite teammate" icon="person-add-outline" onPress={() => setStep('channel')} />
        </Panel>
      ) : null}

      {step === 'channel' ? (
        <Panel>
          <Text style={styles.title}>Send the invite by</Text>
          <Pressable onPress={() => setChannel('email')} style={[styles.choice, channel === 'email' && styles.choiceOn]}>
            <Text style={styles.choiceTitle}>Email</Text>
            <Text style={styles.choiceBody}>An invitation link goes to their inbox.</Text>
          </Pressable>
          <Pressable onPress={() => setChannel('phone')} style={[styles.choice, channel === 'phone' && styles.choiceOn]}>
            <Text style={styles.choiceTitle}>Phone</Text>
            <Text style={styles.choiceBody}>WhatsApp opens with the invite. Tap Send on the next screen.</Text>
          </Pressable>
          <Btn label="Continue" onPress={() => setStep('contact')} />
          <Btn label="Cancel" tone="text" onPress={reset} />
        </Panel>
      ) : null}

      {step === 'contact' ? (
        <Panel>
          <View style={styles.inviteForm}>
            <Text style={styles.title}>{channel === 'email' ? 'Enter their email' : 'Enter their mobile'}</Text>
            {channel === 'email' ? (
              <Field
                boxed
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="name@business.com"
              />
            ) : (
              <Field
                boxed
                label="Mobile"
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                prefix="+91"
                placeholder="98765 43210"
              />
            )}
            <Btn label={busy ? 'Sending…' : 'Send invite'} busy={busy} onPress={() => void sendCode()} />
            <Btn label="Back" tone="text" onPress={() => setStep('channel')} />
          </View>
        </Panel>
      ) : null}

      {step === 'access' ? (
        <Panel>
          <Text style={styles.title}>Choose tab access</Text>
          <Text style={styles.hint}>Tick View to open a tab. Tick Edit to change data on it.</Text>
          <AccessEditor access={access} onChange={setAccess} />
          <Btn
            label="Save access and finish"
            busy={busy}
            onPress={() => (draftId ? void saveAccess(draftId, access, true) : reset())}
          />
        </Panel>
      ) : null}

      {members.length ? (
        <Panel flush>
          {members.map((member, index) => {
            const remaining = hoursLeft(member);
            return (
              <View key={member.id} style={[styles.row, index > 0 && styles.line]}>
                <View style={styles.flex}>
                  <Text style={styles.name}>
                    {[member.email, member.mobile ? `+91 ${member.mobile}` : ''].filter(Boolean).join(' · ')}
                  </Text>
                  <Tag
                    label={
                      member.status === 'active'
                        ? 'Active'
                        : member.status === 'expired'
                          ? 'Cancelled · 48h passed'
                          : member.contactVerified
                            ? 'Verified, set password'
                            : remaining
                              ? `Pending · ${remaining}h left`
                              : 'Pending invite'
                    }
                    tone={member.status === 'active' ? 'success' : member.status === 'expired' ? 'neutral' : 'warning'}
                  />
                  <Text style={styles.meta}>{summarizeTeamAccess(member.access || defaultInviteAccess())}</Text>
                </View>
                <View style={styles.actions}>
                {member.status === 'pending' || member.status === 'expired' ? (
                  <Btn
                    small
                    tone="outline"
                    label={member.status === 'expired' ? 'Resend Invite' : 'Resend Invite'}
                    onPress={() => void resend(member.id)}
                  />
                ) : null}
                {member.status !== 'expired' ? (
                  <Btn
                    small
                    tone="outline"
                    label={editingId === member.id ? 'Close' : 'Modify Access'}
                    onPress={() => setEditingId(editingId === member.id ? null : member.id)}
                  />
                ) : null}
                {member.status !== 'expired' ? (
                  <Btn small tone="danger" label="Remove" onPress={() => revoke(member)} />
                ) : null}
                </View>
                {editingId === member.id ? (
                  <View style={styles.editor}>
                    <AccessEditor
                      access={member.access || defaultInviteAccess()}
                      onChange={(next) =>
                        setMembers((current) =>
                          current.map((item) => (item.id === member.id ? { ...item, access: next } : item)),
                        )
                      }
                    />
                    <Btn
                      label="Save rights"
                      busy={busy}
                      onPress={() =>
                        void saveAccess(
                          member.id,
                          members.find((item) => item.id === member.id)?.access || member.access,
                        )
                      }
                    />
                  </View>
                ) : null}
              </View>
            );
          })}
        </Panel>
      ) : null}
    </Section>
  );
}

function TickBox({
  checked,
  disabled,
  label,
  onChange,
}: {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (value: boolean) => void;
}) {
  const c = useConsoleColors();
  return (
    <Pressable
      onPress={() => {
        if (!disabled) onChange(!checked);
      }}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityState={{ checked, disabled: Boolean(disabled) }}
      accessibilityLabel={label}
      hitSlop={6}
      style={{ width: 44, height: 36, alignItems: 'center', justifyContent: 'center' }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: checked ? '#2563EB' : c.lineStrong,
          backgroundColor: checked ? '#2563EB' : c.card,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled ? 0.35 : 1,
        }}
      >
        {checked ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}

function AccessEditor({
  access,
  onChange,
}: {
  access: TeamAccessMap;
  onChange: (next: TeamAccessMap) => void;
}) {
  const c = useConsoleColors();
  const setRight = (key: TeamTabKey, field: 'view' | 'edit', value: boolean) => {
    const tab = TEAM_TABS.find((item) => item.key === key);
    const current = access[key];
    const next = { ...access };
    if (field === 'edit') {
      next[key] = { view: value ? true : current.view, edit: Boolean(tab?.allowsEdit && value) };
    } else {
      next[key] = { view: value, edit: value ? current.edit : false };
    }
    onChange(next);
  };

  return (
    <View style={{ overflow: 'hidden', borderWidth: 1, borderColor: c.line, borderRadius: 12 }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: c.sunken,
          paddingHorizontal: 12,
          paddingVertical: 8,
        }}
      >
        <Text style={{ flex: 1, fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.6, color: c.muted }}>
          TAB
        </Text>
        <Text style={{ width: 44, textAlign: 'center', fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.6, color: c.muted }}>
          VIEW
        </Text>
        <Text style={{ width: 44, textAlign: 'center', fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.6, color: c.muted }}>
          EDIT
        </Text>
      </View>
      {TEAM_TABS.map((tab, index) => {
        const row = access[tab.key];
        return (
          <View
            key={tab.key}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
              borderTopColor: c.line,
              backgroundColor: c.card,
            }}
          >
            <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
              <Text style={{ fontFamily: fonts.semiBold, fontSize: 14, color: c.ink }}>{tab.label}</Text>
              <Text style={{ marginTop: 1, fontFamily: fonts.regular, fontSize: 11, color: c.muted }}>{tab.hint}</Text>
            </View>
            <TickBox
              checked={row.view}
              label={`${tab.label} view`}
              onChange={(value) => setRight(tab.key, 'view', value)}
            />
            {tab.allowsEdit ? (
              <TickBox
                checked={row.edit}
                disabled={!row.view}
                label={`${tab.label} edit`}
                onChange={(value) => setRight(tab.key, 'edit', value)}
              />
            ) : (
              <Text style={{ width: 44, textAlign: 'center', fontFamily: fonts.regular, fontSize: 12, color: c.faint }}>
                —
              </Text>
            )}
          </View>
        );
      })}
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  hint: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted, marginBottom: 12 },
  inviteForm: { gap: 16, zIndex: 2, position: 'relative' },
  title: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  choice: {
    borderWidth: 1,
    borderColor: c.line,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    backgroundColor: c.card,
  },
  choiceOn: { borderColor: c.accent, backgroundColor: c.primarySoft },
  choiceTitle: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  choiceBody: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  row: { gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  line: { borderTopWidth: 0.5, borderTopColor: c.line },
  flex: { minWidth: 0, gap: 6 },
  name: { fontFamily: fonts.medium, fontSize: 14, color: c.ink },
  meta: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  link: { fontFamily: fonts.semiBold, fontSize: 13 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  editor: { gap: 8 },
}));

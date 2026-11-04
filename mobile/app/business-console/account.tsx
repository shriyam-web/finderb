import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { useOtpCooldown, otpSendLabel } from '../../hooks/useOtpCooldown';
import { fetchAllCategories, type HomeCategory } from '../../lib/api';
import { mobileInputDigits } from '../../lib/phoneInput';
import { isFailure, type ChangeRequest, type ConsoleOverview } from '../../lib/merchantConsoleApi';
import { OtpCodeBoxes } from '../../components/OtpCodeBoxes';
import { ConsoleGate } from '../../components/console/ConsoleGate';
import { TeamAccess } from '../../components/console/TeamAccess';
import { canEditTeamTab } from '../../lib/teamAccess';
import { mixedNameLanguageError, NAME_SINGLE_LANGUAGE_HINT } from '../../lib/aboutFormat';
import {
  Btn,
  ConsolePage,
  Field,
  Panel,
  Row,
  Section,
  Sheet,
  Tag,
  createConsoleStyles,
  shortDate,
  useConsoleScroll,
} from '../../components/console/kit';

type ContactKind = 'email' | 'mobile';
type Requests = {
  success: true;
  category: ChangeRequest | null;
  legalName: ChangeRequest | null;
  displayName: ChangeRequest | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Same stored label as the website and registration: the two deepest levels, never a bare group root. */
function categoryLabel(item: HomeCategory, byId: Map<string, HomeCategory>): string {
  const chain: HomeCategory[] = [item];
  let cursor = item.parentId ? byId.get(item.parentId) : undefined;
  while (cursor && chain.length < 4) {
    chain.unshift(cursor);
    cursor = cursor.parentId ? byId.get(cursor.parentId) : undefined;
  }
  const [parent, sub, leaf] = chain;
  if (leaf && sub) return `${sub.name} › ${leaf.name}`;
  if (sub && parent) return parent.level === 0 ? sub.name : `${parent.name} › ${sub.name}`;
  return parent?.name || item.name;
}

function ContactSheet({
  kind,
  current,
  verified,
  onClose,
}: {
  kind: ContactKind | null;
  current: string;
  verified: boolean;
  onClose: () => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const { run, notify } = useMerchantConsole();
  const otp = useOtpCooldown();
  const [value, setValue] = useState(current);
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState('');

  const clean = kind === 'email' ? value.trim().toLowerCase() : value;
  const original = kind === 'email' ? current.trim().toLowerCase() : current;
  const unchangedVerified = Boolean(verified && clean === original);
  const valid = kind === 'email' ? EMAIL_RE.test(clean) : /^[6-9]\d{9}$/.test(clean);
  const sent = otp.isSentTo(clean);
  const waiting = otp.isWaiting(clean);

  const send = async () => {
    if (!kind || !valid || unchangedVerified) return;
    setSending(true);
    const result = await run<{ success: true; message: string }>('sendContactCode', { kind, value: clean });
    setSending(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    otp.markSent(clean);
    setCode('');
    setNote(result.message);
  };

  const confirm = async (entered = code) => {
    if (!kind || entered.length !== 6) return;
    setChecking(true);
    const result = await run<ConsoleOverview & { message?: string }>('confirmContact', { kind, value: clean, code: entered });
    setChecking(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      setCode('');
      return;
    }
    notify(result.message || (kind === 'email' ? 'Email verified' : 'Mobile verified'));
    onClose();
  };

  return (
    <Sheet
      visible={Boolean(kind)}
      title={kind === 'email' ? 'Login email' : 'Login mobile'}
      onClose={onClose}
    >
      <Text style={styles.sheetLead}>
        {kind === 'email'
          ? 'We’ll email a 6-digit code. Once verified, this becomes the email you log in with.'
          : 'We’ll send a 6-digit code on WhatsApp. Once verified, you can log in with this number.'}
      </Text>
      {kind === 'email' ? (
        <Field
          boxed
          label="Email"
          value={value}
          onChangeText={setValue}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          editable={!checking}
        />
      ) : (
        <Field
          boxed
          label="Mobile number"
          prefix="+91"
          value={value}
          onChangeText={(next) => setValue(mobileInputDigits(next, value))}
          keyboardType="phone-pad"
          maxLength={14}
          editable={!checking}
        />
      )}
      <View style={{ height: 16 }} />
      {sent ? (
        <View style={styles.otp}>
          {note ? <Text style={styles.note}>{note}</Text> : null}
          <OtpCodeBoxes
            value={code}
            onChange={setCode}
            onComplete={(entered) => void confirm(entered)}
            autoFocus
            disabled={checking}
            accent={c.primary}
          />
          <Pressable onPress={() => void send()} disabled={waiting || sending} hitSlop={8} style={styles.resend}>
            <Text style={[styles.resendText, (waiting || sending) && { color: c.faint }]}>
              {waiting ? `Resend in ${otpSendLabel(true, true, otp.secondsLeft)}` : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {sent ? (
        <Btn label="Verify code" busy={checking} disabled={code.length !== 6} onPress={() => void confirm()} />
      ) : (
        <>
        <Btn
          label="Send verification code"
          busy={sending}
          disabled={!valid || unchangedVerified}
          onPress={() => void send()}
        />
        {unchangedVerified ? (
          <Text style={styles.note}>This email is already verified. Change it before sending a new code.</Text>
        ) : null}
        </>
      )}
    </Sheet>
  );
}

function PasswordSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { run, notify } = useMerchantConsole();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [busy, setBusy] = useState(false);

  const mismatch = again.length > 0 && again !== next;
  const save = async () => {
    if (next.length < 8) {
      notify('Use at least 8 characters for the new password.', 'bad');
      return;
    }
    if (mismatch) return;
    setBusy(true);
    const result = await run('changePassword', { currentPassword: current, newPassword: next, confirmPassword: again });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    notify('Password changed');
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title="Change password"
      onClose={onClose}
      action={{ label: 'Save', busy, disabled: !current || !next || !again || mismatch, onPress: () => void save() }}
    >
      <Field label="Current password" value={current} onChangeText={setCurrent} secureTextEntry autoCapitalize="none" />
      <Field
        label="New password"
        value={next}
        onChangeText={setNext}
        secureTextEntry
        autoCapitalize="none"
        hint="At least 8 characters. Mix letters, numbers and a symbol."
      />
      <Field
        label="New password again"
        value={again}
        onChangeText={setAgain}
        secureTextEntry
        autoCapitalize="none"
        error={mismatch ? 'Passwords don’t match.' : undefined}
      />
    </Sheet>
  );
}

function RequestSheet({
  field,
  o,
  onClose,
  onDone,
}: {
  field: 'category' | 'legalName' | 'displayName' | null;
  o: ConsoleOverview;
  onClose: () => void;
  onDone: (next: Requests) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const { run, notify } = useMerchantConsole();
  const [value, setValue] = useState('');
  const [note, setNote] = useState('');
  const [query, setQuery] = useState('');
  const [catalog, setCatalog] = useState<HomeCategory[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (field !== 'category') return;
    let alive = true;
    void fetchAllCategories().then((res) => {
      if (alive) setCatalog(res.categories);
    });
    return () => {
      alive = false;
    };
  }, [field]);

  const byId = useMemo(() => new Map((catalog ?? []).map((item) => [item.id, item])), [catalog]);
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!catalog || !q) return [];
    return catalog
      .filter((item) => item.name.toLowerCase().includes(q) && item.level !== 0)
      .slice(0, 12)
      .map((item) => categoryLabel(item, byId));
  }, [catalog, query, byId]);

  const nameMixed = field === 'displayName' ? mixedNameLanguageError(value) : null;

  const submit = async () => {
    if (!field || !value.trim() || nameMixed) return;
    setBusy(true);
    const result = await run<Requests>('requestChange', { field, value: value.trim(), note: note.trim() });
    setBusy(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    notify('Request sent to the FinderB team');
    onDone(result);
  };

  return (
    <Sheet
      visible={Boolean(field)}
      title={
        field === 'category' ? 'Change category' : field === 'displayName' ? 'Change display name' : 'Change legal name'
      }
      onClose={onClose}
      action={{ label: 'Send', busy, disabled: !value.trim() || Boolean(nameMixed), onPress: () => void submit() }}
    >
      <Text style={styles.sheetLead}>
        Now:{' '}
        <Text style={styles.strong}>
          {field === 'category'
            ? o.business.category
            : field === 'displayName'
              ? o.profile.displayName || o.business.name
              : o.business.legalName}
        </Text>
        . The FinderB team reviews this so search stays accurate — usually within a day.
      </Text>
      {field === 'category' ? (
        <>
          {value ? (
            <View style={styles.picked}>
              <Ionicons name="checkmark-circle" size={18} color={c.success} />
              <Text style={styles.pickedText}>{value}</Text>
              <Pressable onPress={() => setValue('')} hitSlop={8}>
                <Text style={styles.resendText}>Change</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <Field label="Search categories" value={query} onChangeText={setQuery} placeholder="e.g. Bakery" autoFocus />
              {!catalog ? <ActivityIndicator color={c.primary} /> : null}
              {matches.map((label) => (
                <Pressable
                  key={label}
                  onPress={() => setValue(label)}
                  style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                  accessibilityRole="button"
                >
                  <Text style={styles.optionText}>{label}</Text>
                </Pressable>
              ))}
            </>
          )}
        </>
      ) : field === 'displayName' ? (
        <>
          <Field
            label="New display name"
            value={value}
            onChangeText={setValue}
            placeholder="The name customers should see"
            maxLength={50}
          />
          <Text style={nameMixed ? styles.quiet : styles.footnote}>{nameMixed || NAME_SINGLE_LANGUAGE_HINT}</Text>
        </>
      ) : (
        <>
          <Field
            label="New legal name"
            value={value}
            onChangeText={setValue}
            placeholder="As on your GST / shop licence"
            maxLength={50}
          />
        </>
      )}
      <Field
        label="Note for the reviewer (optional)"
        multiline
        value={note}
        onChangeText={setNote}
        placeholder="Why the change? e.g. we now mainly do catering"
        maxLength={300}
      />
    </Sheet>
  );
}

function RequestRow({
  label,
  current,
  request,
  onPress,
  last,
  allowChange = true,
}: {
  label: string;
  current: string;
  request: ChangeRequest | null;
  onPress: () => void;
  last?: boolean;
  allowChange?: boolean;
}) {
  const styles = useStyles();
  return (
    <View style={[styles.requestRow, !last && styles.line]}>
      <View style={styles.flex}>
        <Text style={styles.requestLabel}>{label}</Text>
        <Text style={styles.requestValue}>{current || 'Not set'}</Text>
        {request ? (
          <View style={styles.pending}>
            <Tag label="Waiting for approval" tone="warning" icon="time-outline" />
            <Text style={styles.pendingText}>
              Requested: {request.requested_value} · {shortDate(request.created_at)}
            </Text>
          </View>
        ) : null}
      </View>
      {allowChange && !request ? <Btn small tone="outline" label="Request change" onPress={onPress} /> : null}
    </View>
  );
}

function AccountBody({ o }: { o: ConsoleOverview }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const iconTint = c.accent;
  const { run } = useMerchantConsole();
  const { scrollTo } = useConsoleScroll();
  const { focus } = useLocalSearchParams<{ focus?: string }>();
  const [contact, setContact] = useState<ContactKind | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [requestField, setRequestField] = useState<'category' | 'legalName' | 'displayName' | null>(null);
  const [requests, setRequests] = useState<Requests | null>(null);
  const b = o.business;

  useFocusEffect(
    useCallback(() => {
      void run<Requests>('changeRequests').then((result) => {
        if (!isFailure(result)) setRequests(result);
      });
    }, [run]),
  );

  const kycDone = /verified|approved/i.test(b.kycStatus || '');
  const kycReview = /review|pending|submitted/i.test(b.kycStatus || '');
  const isOwner = o.actor?.isOwner !== false;
  const canEditSettings = canEditTeamTab(o.actor?.access, 'settings', isOwner);

  useEffect(() => {
    if (!isOwner) return;
    if (focus === 'email' || focus === 'mobile') setContact(focus);
    if (focus === 'displayName') setRequestField('displayName');
  }, [focus, isOwner]);

  return (
    <ConsolePage title="Login & security" subtitle="Account" docked>
      {!isOwner ? (
        <Text style={styles.footnote}>
          Login email, mobile, password, and team invites stay with the original business owner.
        </Text>
      ) : null}
      {isOwner && (!b.emailVerified || !b.mobileVerified) ? (
        <View style={styles.warn}>
          <Ionicons name="trending-down" size={18} color={c.warning} />
          <Text style={styles.warnText}>
            <Text style={styles.warnStrong}>Your visibility will drop. </Text>
            Unverified businesses rank lower in search and get fewer calls. Verify your{' '}
            {[!b.mobileVerified && 'mobile', !b.emailVerified && 'email'].filter(Boolean).join(' and ')} soon.
          </Text>
        </View>
      ) : null}
      {isOwner ? <Section title="How you log in">
        <Panel flush>
          <Pressable
            onPress={() => setContact('email')}
            style={({ pressed }) => [styles.contactRow, styles.line, pressed && styles.optionPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Email ${b.loginEmail || 'not added'}. ${b.emailVerified ? 'Change' : 'Verify'}`}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="mail-outline" size={18} color={iconTint} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.requestLabel}>Email</Text>
              <Text style={styles.requestValue} numberOfLines={1}>
                {b.loginEmail || 'Not added'}
              </Text>
              {b.loginEmail ? (
                <View style={styles.contactTag}>
                  <Tag
                    label={b.emailVerified ? 'Verified' : 'Not verified'}
                    tone={b.emailVerified ? 'success' : 'warning'}
                    icon={b.emailVerified ? 'checkmark-circle' : 'alert-circle-outline'}
                  />
                </View>
              ) : null}
            </View>
            <Text style={styles.action}>{b.emailVerified ? 'Change' : 'Verify'}</Text>
          </Pressable>
          <Pressable
            onPress={() => setContact('mobile')}
            style={({ pressed }) => [styles.contactRow, pressed && styles.optionPressed]}
            accessibilityRole="button"
            accessibilityLabel={`Mobile ${b.loginMobile || 'not added'}. ${b.mobileVerified ? 'Change' : 'Verify'}`}
          >
            <View style={styles.contactIcon}>
              <Ionicons name="phone-portrait-outline" size={18} color={iconTint} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.requestLabel}>Mobile</Text>
              <Text style={styles.requestValue}>{b.loginMobile ? `+91 ${b.loginMobile}` : 'Not added'}</Text>
              {b.loginMobile ? (
                <View style={styles.contactTag}>
                  <Tag
                    label={b.mobileVerified ? 'Verified' : 'Not verified'}
                    tone={b.mobileVerified ? 'success' : 'warning'}
                    icon={b.mobileVerified ? 'checkmark-circle' : 'alert-circle-outline'}
                  />
                </View>
              ) : null}
            </View>
            <Text style={styles.action}>{b.mobileVerified ? 'Change' : 'Verify'}</Text>
          </Pressable>
        </Panel>
        <Text style={styles.footnote}>
          Your login mobile is also the phone customers see on your listing. Changing your email or mobile needs a
          one-time code sent to the new address.
        </Text>
      </Section> : null}

      {isOwner ? (
      <Panel flush>
        <Row icon="key-outline" label="Change password" value="For logging in on the website and app" onPress={() => setPasswordOpen(true)} last />
      </Panel>
      ) : null}

      {isOwner ? (
        <View
          onLayout={(event) => {
            if (focus === 'team') scrollTo(event.nativeEvent.layout.y);
          }}
        >
          <TeamAccess />
        </View>
      ) : null}

      <Section title="Needs FinderB approval">
        <Panel flush>
          <RequestRow label="Category" current={b.category} request={requests?.category ?? null} onPress={() => setRequestField('category')} allowChange={canEditSettings} />
          <RequestRow
            label="Legal business name"
            current={b.legalName}
            request={requests?.legalName ?? null}
            onPress={() => setRequestField('legalName')}
            allowChange={canEditSettings}
          />
          <RequestRow
            label="Display name"
            current={o.profile.displayName || b.name}
            request={requests?.displayName ?? null}
            onPress={() => setRequestField('displayName')}
            last
            allowChange={canEditSettings}
          />
        </Panel>
      </Section>

      <Section title="Verification">
        <Panel style={styles.kyc}>
          <View style={styles.kycHead}>
            <Ionicons name={kycDone ? 'shield-checkmark' : 'shield-outline'} size={20} color={iconTint} />
            <Text style={styles.kycTitle}>Identity check (KYC)</Text>
            <Tag
              label={kycDone ? 'Verified' : kycReview ? 'In review' : 'Not started'}
              tone={kycDone ? 'success' : kycReview ? 'warning' : 'neutral'}
            />
          </View>
          <Text style={styles.kycBody}>{o.kycMessage}</Text>
        </Panel>
      </Section>

      <Panel flush>
        <Row icon="finger-print-outline" label="Business ID" value={b.registrationNumber || b.id} last />
      </Panel>

      {contact ? (
        <ContactSheet
          key={contact}
          kind={contact}
          current={contact === 'email' ? b.loginEmail : b.loginMobile}
          verified={contact === 'email' ? b.emailVerified : b.mobileVerified}
          onClose={() => setContact(null)}
        />
      ) : null}
      {passwordOpen ? <PasswordSheet visible onClose={() => setPasswordOpen(false)} /> : null}
      {requestField ? (
        <RequestSheet
          key={requestField}
          field={requestField}
          o={o}
          onClose={() => setRequestField(null)}
          onDone={(next) => {
            setRequests(next);
            setRequestField(null);
          }}
        />
      ) : null}
    </ConsolePage>
  );
}

export default function AccountScreen() {
  return <ConsoleGate>{(overview) => <AccountBody o={overview} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  line: { borderBottomWidth: 0.5, borderBottomColor: c.line },
  sheetLead: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.body },
  strong: { fontFamily: fonts.semiBold, color: c.ink },
  note: { fontFamily: fonts.regular, fontSize: 13, color: c.success, textAlign: 'center' },
  otp: { gap: 14, alignItems: 'stretch' },
  resend: { alignSelf: 'center', paddingVertical: 4 },
  resendText: { fontFamily: fonts.semiBold, fontSize: 13.5, color: c.accent },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  contactIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  contactTag: { marginTop: 6 },
  action: { fontFamily: fonts.semiBold, fontSize: 14, color: c.accent },
  footnote: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.muted, paddingHorizontal: 2 },
  quiet: { fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.danger, paddingHorizontal: 2 },
  warn: {
    flexDirection: 'row',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.isDark ? 'rgba(251,191,36,0.35)' : '#FDE68A',
    backgroundColor: c.warningSoft,
  },
  warnText: { flex: 1, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.body },
  warnStrong: { fontFamily: fonts.semiBold, color: c.ink },
  requestRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  requestLabel: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  requestValue: { marginTop: 2, fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  pending: { marginTop: 8, gap: 5 },
  pendingText: { fontFamily: fonts.regular, fontSize: 12.5, color: c.body },
  picked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: c.successSoft,
  },
  pickedText: { flex: 1, fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  option: { paddingVertical: 13, borderBottomWidth: 0.5, borderBottomColor: c.line },
  optionPressed: { backgroundColor: c.sunken },
  optionText: { fontFamily: fonts.regular, fontSize: 15, color: c.ink },
  kyc: { gap: 8 },
  kycHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kycTitle: { flex: 1, fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  kycBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: c.muted },
  kycBtn: { alignSelf: 'flex-start' },
}));

import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Pressable, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { isFailure, type ConsoleOverview, type ConsoleProfile, type DayTiming, type Timings } from '../../lib/merchantConsoleApi';
import { citiesInState, INDIAN_STATES } from '../../lib/indianPlaces';
import { checkPinInsideCity, type MapPin } from '../../lib/mapPlace';
import { mobileInputDigits } from '../../lib/phoneInput';
import { otpSendLabel, useOtpCooldown } from '../../hooks/useOtpCooldown';
import { OtpCodeBoxes } from '../../components/OtpCodeBoxes';
import { ShopMapPicker } from '../../components/ShopMapPicker';
import { ConsoleGate } from '../../components/console/ConsoleGate';
import {
  Btn,
  Chip,
  ConsolePage,
  Field,
  Panel,
  PickField,
  Section,
  Sheet,
  Tag,
  createConsoleStyles,
} from '../../components/console/kit';
import {
  DAYS,
  DISCOUNT_OPTIONS,
  LISTING_SECTIONS,
  PAYMENT_MODES,
  dayLabel,
  type SectionKey,
} from '../../components/console/listingSections';

const SECTION_FIELDS: Record<SectionKey, (keyof ConsoleProfile)[]> = {
  basics: ['displayName', 'about', 'keywords', 'serviceCategory'],
  contact: ['whatsappNumber', 'ownerName', 'ownerMobile', 'website'],
  location: ['businessAddress', 'city', 'state', 'country', 'latitude', 'longitude'],
  hours: ['timings'],
  offers: ['paymentModes', 'discountRange', 'yearsInBusiness'],
  social: ['instagramUrl', 'facebookUrl', 'youtubeUrl'],
};

const SLOTS: string[] = [
  ...Array.from({ length: 48 }, (_, index) => {
    const h = Math.floor(index / 2);
    return `${String(h).padStart(2, '0')}:${index % 2 ? '30' : '00'}`;
  }),
  '23:59',
];

function slotLabel(value: string): string {
  if (value === '23:59') return 'Midnight';
  const [h, m] = value.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`;
}

const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;
const validMobile = (digits: string) => /^[6-9]\d{9}$/.test(digits);
const last10 = (value: string | null | undefined) => String(value || '').replace(/\D/g, '').slice(-10);
const servicesOf = (value: string) =>
  [...new Set(String(value || '').split(/[,|]/).map((item) => item.trim()).filter(Boolean))];

function TagInput({
  label,
  hint,
  values,
  max,
  placeholder,
  onChange,
}: {
  label: string;
  hint: string;
  values: string[];
  max: number;
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  const add = () => {
    const parts = draft
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (!parts.length) return;
    const seen = new Set(values.map((value) => value.toLowerCase()));
    const next = [...values];
    for (const part of parts) {
      if (next.length >= max) break;
      if (!seen.has(part.toLowerCase())) {
        next.push(part.slice(0, 40));
        seen.add(part.toLowerCase());
      }
    }
    onChange(next);
    setDraft('');
  };
  const full = values.length >= max;
  return (
    <View style={styles.tagInput}>
      <View style={styles.tagTop}>
        <Text style={[styles.tagLabel, focused && { color: c.primary }]}>{label}</Text>
        <Text style={styles.tagCount}>
          {values.length}/{max}
        </Text>
      </View>
      {values.length ? (
        <View style={styles.tagList}>
          {values.map((value) => (
            <Pressable
              key={value}
              onPress={() => onChange(values.filter((item) => item !== value))}
              style={styles.tagPill}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${value}`}
            >
              <Text style={styles.tagPillText}>{value}</Text>
              <Ionicons name="close" size={14} color={c.accent} />
            </Pressable>
          ))}
        </View>
      ) : null}
      {!full ? (
        <View style={[styles.tagAddRow, { borderBottomColor: focused ? c.primary : c.lineStrong, borderBottomWidth: focused ? 2 : 1 }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={add}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={c.faint}
            selectionColor={c.primary}
            cursorColor={c.primary}
            underlineColorAndroid="transparent"
            returnKeyType="done"
            blurOnSubmit={false}
            style={styles.tagField}
          />
          <Pressable
            onPress={add}
            disabled={!draft.trim()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Add ${label.toLowerCase()}`}
            style={[styles.tagAdd, !draft.trim() && styles.dim]}
          >
            <Ionicons name="add" size={20} color={c.primaryInk} />
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.hint}>{hint}</Text>
    </View>
  );
}

function PlaceSheet({
  visible,
  title,
  options,
  onPick,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: string[];
  onPick: (value: string) => void;
  onClose: () => void;
}) {
  const styles = useStyles();
  const [query, setQuery] = useState('');
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (q ? options.filter((option) => option.toLowerCase().includes(q)) : options).slice(0, 120);
  }, [options, query]);
  return (
    <Sheet visible={visible} title={title} onClose={onClose}>
      <Field label="Search" value={query} onChangeText={setQuery} placeholder="Type to search" autoFocus />
      <View>
        {list.map((option) => (
          <Pressable
            key={option}
            onPress={() => onPick(option)}
            style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.optionText}>{option}</Text>
          </Pressable>
        ))}
        {!list.length ? <Text style={styles.hint}>Nothing matches that.</Text> : null}
      </View>
    </Sheet>
  );
}

function HoursEditor({ timings, onChange }: { timings: Timings; onChange: (next: Timings) => void }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const [picking, setPicking] = useState<{ day: string; edge: 'open' | 'close' } | null>(null);

  const update = (day: string, patch: DayTiming) => {
    const current = timings[day] || { open: '09:00', close: '21:00' };
    onChange({ ...timings, [day]: { ...current, ...patch } });
  };

  const setMode = (day: string, mode: 'open' | 'closed' | '24h') => {
    if (mode === 'closed') update(day, { isClosed: true, is24Hours: false });
    else if (mode === '24h') update(day, { isClosed: false, is24Hours: true, open: '00:00', close: '23:59' });
    else {
      const current = timings[day];
      const reset = !current?.open || current.is24Hours;
      update(day, {
        isClosed: false,
        is24Hours: false,
        open: reset ? '09:00' : current.open,
        close: reset ? '21:00' : current.close,
      });
    }
  };

  const copyToAll = (from: string) => {
    const source = timings[from];
    if (!source) return;
    const next: Timings = {};
    for (const day of DAYS) next[day] = { ...source };
    onChange(next);
  };

  return (
    <>
      {DAYS.map((day) => {
        const slot = timings[day];
        const mode = !slot ? null : slot.isClosed ? 'closed' : slot.is24Hours ? '24h' : 'open';
        return (
          <Panel key={day} style={styles.day}>
            <View style={styles.dayHead}>
              <Text style={styles.dayName}>{day}</Text>
              <Text style={styles.daySummary}>{dayLabel(timings, day)}</Text>
            </View>
            <View style={styles.modeRow}>
              <Chip label="Open" active={mode === 'open'} onPress={() => setMode(day, 'open')} />
              <Chip label="24 hours" active={mode === '24h'} onPress={() => setMode(day, '24h')} />
              <Chip label="Closed" active={mode === 'closed'} onPress={() => setMode(day, 'closed')} />
            </View>
            {mode === 'open' ? (
              <View style={styles.timeRow}>
                {(['open', 'close'] as const).map((edge) => (
                  <Pressable
                    key={edge}
                    onPress={() => setPicking({ day, edge })}
                    style={styles.time}
                    accessibilityRole="button"
                    accessibilityLabel={`${day} ${edge === 'open' ? 'opens' : 'closes'} at ${slotLabel(slot?.[edge] || '')}`}
                  >
                    <Text style={styles.timeEdge}>{edge === 'open' ? 'Opens' : 'Closes'}</Text>
                    <Text style={styles.timeValue}>{slot?.[edge] ? slotLabel(slot[edge] as string) : 'Set'}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
            {day === 'Monday' && slot ? (
              <Pressable onPress={() => copyToAll('Monday')} hitSlop={6} style={styles.copy} accessibilityRole="button">
                <Ionicons name="copy-outline" size={15} color={c.accent} />
                <Text style={styles.copyText}>Use Monday’s hours for every day</Text>
              </Pressable>
            ) : null}
          </Panel>
        );
      })}
      <Sheet
        visible={Boolean(picking)}
        title={picking ? `${picking.day} · ${picking.edge === 'open' ? 'opens at' : 'closes at'}` : ''}
        onClose={() => setPicking(null)}
      >
        <View style={styles.slotGrid}>
          {SLOTS.filter((value) => (picking?.edge === 'open' ? value !== '23:59' : value !== '00:00')).map((value) => {
            const active = picking ? timings[picking.day]?.[picking.edge] === value : false;
            return (
              <Chip
                key={value}
                label={slotLabel(value)}
                active={active}
                onPress={() => {
                  if (picking) update(picking.day, { [picking.edge]: value });
                  setPicking(null);
                }}
              />
            );
          })}
        </View>
      </Sheet>
    </>
  );
}

type OwnerProof = { success: true; value: string; ownerMobileVerificationToken: string; message: string };

function PhoneVerifySheet({
  mobile,
  title,
  reason,
  visible,
  onClose,
  onVerified,
}: {
  mobile: string;
  title: string;
  reason: string;
  visible: boolean;
  onClose: () => void;
  onVerified: (token: string) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const { run, notify } = useMerchantConsole();
  const otp = useOtpCooldown();
  const [code, setCode] = useState('');
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [note, setNote] = useState('');
  const sent = otp.isSentTo(mobile);
  const waiting = otp.isWaiting(mobile);

  const send = async () => {
    setSending(true);
    const result = await run<{ success: true; message: string }>('sendOwnerMobileCode', { value: mobile });
    setSending(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    otp.markSent(mobile);
    setCode('');
    setNote(result.message);
  };

  const confirm = async (entered = code) => {
    if (entered.length !== 6) return;
    setChecking(true);
    const result = await run<OwnerProof>('confirmOwnerMobile', { value: mobile, code: entered });
    setChecking(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      setCode('');
      return;
    }
    otp.clearSent();
    onVerified(result.ownerMobileVerificationToken);
    notify('Number verified');
    onClose();
  };

  return (
    <Sheet
      visible={visible}
      title={title}
      onClose={onClose}
      footer={
        sent ? (
          <Btn label="Verify code" busy={checking} disabled={code.length !== 6} onPress={() => void confirm()} />
        ) : (
          <Btn label="Send code on WhatsApp" busy={sending} onPress={() => void send()} />
        )
      }
    >
      <Text style={styles.sheetLead}>
        {reason} We’ll send a 6-digit code on WhatsApp to
        <Text style={styles.strong}> +91 {mobile}</Text>.
      </Text>
      {sent ? (
        <View style={styles.otp}>
          {note ? <Text style={styles.otpNote}>{note}</Text> : null}
          <OtpCodeBoxes
            value={code}
            onChange={setCode}
            onComplete={(entered) => void confirm(entered)}
            autoFocus
            disabled={checking}
            accent={c.primary}
          />
          <Pressable onPress={() => void send()} disabled={waiting || sending} hitSlop={8} style={styles.resend}>
            <Text style={[styles.copyText, (waiting || sending) && { color: c.faint }]}>
              {waiting ? `Resend in ${otpSendLabel(true, true, otp.secondsLeft)}` : 'Resend code'}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </Sheet>
  );
}

function EditBody({ o, section }: { o: ConsoleOverview; section: SectionKey }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const navigation = useNavigation();
  const { run, notify } = useMerchantConsole();
  const meta = LISTING_SECTIONS.find((item) => item.key === section) ?? LISTING_SECTIONS[0];
  const [form, setForm] = useState<ConsoleProfile>(() => ({ ...o.profile, timings: { ...(o.profile.timings || {}) } }));
  const [saving, setSaving] = useState(false);
  const [placeMenu, setPlaceMenu] = useState<'state' | 'city' | null>(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapLive, setMapLive] = useState(false);
  const [pinNote, setPinNote] = useState('');
  const [pinOk, setPinOk] = useState<boolean | null>(null);
  const [pinChecking, setPinChecking] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [ownerProof, setOwnerProof] = useState<{ mobile: string; token: string } | null>(null);
  const [ownerSheet, setOwnerSheet] = useState(false);
  const [whatsappProof, setWhatsappProof] = useState<{ mobile: string; token: string } | null>(null);
  const [whatsappSheet, setWhatsappSheet] = useState(false);
  const saved = useRef(false);
  const loginMobile = last10(o.business.loginMobile);
  const ownerMobileIsNew =
    validMobile(form.ownerMobile) &&
    form.ownerMobile !== o.profile.ownerMobile &&
    form.ownerMobile !== loginMobile;
  const ownerVerified = ownerProof?.mobile === form.ownerMobile;
  const whatsapp = last10(form.whatsappNumber);
  const whatsappIsNew =
    validMobile(whatsapp) &&
    ![last10(o.profile.whatsappNumber), last10(o.profile.ownerMobile), loginMobile].includes(whatsapp);
  const whatsappVerified = whatsappProof?.mobile === whatsapp;

  const set = <K extends keyof ConsoleProfile>(key: K, value: ConsoleProfile[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  };

  const fields = SECTION_FIELDS[section];
  const dirty = fields.some((key) => JSON.stringify(form[key]) !== JSON.stringify(o.profile[key]));
  const pin: MapPin | null = form.latitude && form.longitude ? { lat: form.latitude, lng: form.longitude } : null;
  const pinMoved = form.latitude !== o.profile.latitude || form.longitude !== o.profile.longitude;

  useEffect(() => {
    if (section !== 'location' || !pin || !pinMoved || !form.city || !form.state) {
      setPinChecking(false);
      setPinOk(pin && !pinMoved ? true : null);
      setPinNote('');
      return;
    }
    let cancel = false;
    setPinChecking(true);
    const timer = setTimeout(() => {
      void checkPinInsideCity(pin, form.city, form.state).then((result) => {
        if (cancel) return;
        setPinChecking(false);
        setPinOk(result.ok);
        setPinNote(result.message);
      });
    }, 400);
    return () => {
      cancel = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, form.latitude, form.longitude, form.city, form.state]);

  useEffect(
    () =>
      navigation.addListener('beforeRemove', (event) => {
        if (!dirty || saved.current) return;
        event.preventDefault();
        Alert.alert('Discard changes?', 'Your edits here haven’t been saved.', [
          { text: 'Keep editing', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => navigation.dispatch(event.data.action) },
        ]);
      }),
    [navigation, dirty],
  );

  const validate = (): Record<string, string> => {
    const out: Record<string, string> = {};
    if (section === 'basics') {
      if (!form.displayName.trim()) out.displayName = 'Customers need a name to find you.';
      if (wordCount(form.about) > o.limits.aboutMaxWords) out.about = `Keep it under ${o.limits.aboutMaxWords} words.`;
    }
    if (section === 'contact') {
      if (form.whatsappNumber && !validMobile(whatsapp)) out.whatsappNumber = 'Enter a 10-digit WhatsApp number.';
      else if (whatsappIsNew && !whatsappVerified) out.whatsappNumber = 'Verify this number on WhatsApp before saving.';
      if (form.ownerMobile && !validMobile(form.ownerMobile)) out.ownerMobile = 'Enter a 10-digit mobile number.';
      else if (ownerMobileIsNew && !ownerVerified) out.ownerMobile = 'Verify this number on WhatsApp before saving.';
      if (!form.ownerName.trim()) out.ownerName = 'Add the owner’s name.';
    }
    if (section === 'location') {
      if (!form.businessAddress.trim()) out.businessAddress = 'Add your shop address.';
      if (!form.state) out.state = 'Choose a state.';
      if (!form.city) out.city = 'Choose a city.';
      if (pin && pinMoved && pinOk === false) out.pin = pinNote || `Move the pin inside ${form.city}.`;
    }
    if (section === 'hours') {
      for (const day of DAYS) {
        const slot = form.timings[day];
        if (slot && !slot.isClosed && !slot.is24Hours && slot.open && slot.close && slot.open >= slot.close) {
          out.timings = `${day}: closing time must be after opening time.`;
          break;
        }
      }
    }
    if (section === 'offers') {
      const year = Number(form.yearsInBusiness) || 0;
      const now = new Date().getFullYear();
      if (year && (year < now - 500 || year > now)) out.yearsInBusiness = `Enter a year between ${now - 500} and ${now}.`;
    }
    return out;
  };

  const save = async () => {
    const problems = validate();
    if (Object.values(problems).some(Boolean)) {
      setErrors(problems);
      notify(Object.values(problems).find(Boolean) || 'Check the highlighted fields.', 'bad');
      return;
    }
    if (section === 'location' && pin && pinMoved && pinChecking) {
      notify('Checking the map pin — try again in a second.', 'info');
      return;
    }
    const patch: Record<string, unknown> = {};
    for (const key of fields) patch[key] = form[key];
    if (section === 'location') patch.country = form.country || 'India';
    if (section === 'contact' && ownerVerified) patch.ownerMobileVerificationToken = ownerProof?.token;
    if (section === 'contact' && whatsappVerified) patch.whatsappVerificationToken = whatsappProof?.token;
    setSaving(true);
    const result = await run<ConsoleOverview>('saveProfile', { patch });
    setSaving(false);
    if (isFailure(result)) {
      notify(result.error, 'bad');
      return;
    }
    saved.current = true;
    notify(`${meta.title} saved`);
    router.back();
  };

  const services = servicesOf(form.serviceCategory);
  const aboutWords = wordCount(form.about);

  return (
    <ConsolePage
      form={section !== 'hours'}
      title={meta.title}
      subtitle="Edit listing"
      footer={<Btn label={dirty ? 'Save changes' : 'No changes yet'} busy={saving} disabled={!dirty} onPress={() => void save()} />}
    >
      {section === 'basics' ? (
        <>
          <Field
            label="Name customers see"
            value={form.displayName}
            onChangeText={(value) => set('displayName', value)}
            maxLength={80}
            error={errors.displayName}
            hint={`Your legal name (${o.business.legalName}) stays on record separately.`}
          />
          <Field
            label="About your business"
            multiline
            value={form.about}
            onChangeText={(value) => set('about', value)}
            placeholder="What you sell, what you’re known for, since when…"
            counter={`${aboutWords}/${o.limits.aboutMaxWords} words`}
            error={errors.about}
          />
          <TagInput
            label="Services you offer"
            hint="Shown as chips on your storefront. Separate several with commas."
            values={services}
            max={10}
            placeholder="e.g. Home delivery"
            onChange={(next) => set('serviceCategory', next.join(', '))}
          />
          <TagInput
            label="Search keywords"
            hint="Words customers might type to find you. Not shown publicly."
            values={form.keywords}
            max={o.limits.maxKeywords}
            placeholder="e.g. biryani"
            onChange={(next) => set('keywords', next)}
          />
        </>
      ) : null}

      {section === 'contact' ? (
        <>
          <PickField
            label="Public phone"
            value={loginMobile ? `+91 ${loginMobile}` : ''}
            placeholder="Add your login mobile"
            icon="lock-closed-outline"
            hint="Same as your login mobile. Customers tap this to call you. Change it under Login & security with an OTP."
            onPress={() => router.push('/business-console/account')}
          />
          <Field
            label="WhatsApp number"
            prefix="+91"
            keyboardType="phone-pad"
            value={form.whatsappNumber}
            onChangeText={(value) => set('whatsappNumber', mobileInputDigits(value, form.whatsappNumber))}
            maxLength={14}
            error={errors.whatsappNumber}
            hint={whatsappIsNew ? 'New number — confirm it with a WhatsApp code before saving.' : undefined}
          />
          {whatsappIsNew ? (
            whatsappVerified ? (
              <Tag label="Verified on WhatsApp" tone="success" />
            ) : (
              <Btn label="Verify on WhatsApp" tone="outline" onPress={() => setWhatsappSheet(true)} />
            )
          ) : (
            <Pressable
              onPress={() => set('whatsappNumber', loginMobile)}
              disabled={!loginMobile || whatsapp === loginMobile}
              style={styles.inlineLink}
            >
              <Text style={[styles.copyText, (!loginMobile || whatsapp === loginMobile) && { color: c.faint }]}>
                Same as login mobile
              </Text>
            </Pressable>
          )}
          <PhoneVerifySheet
            key={`wa-${whatsapp}`}
            mobile={whatsapp}
            title="Verify WhatsApp number"
            reason="Customers message you on this number, so we confirm it belongs to you."
            visible={whatsappSheet}
            onClose={() => setWhatsappSheet(false)}
            onVerified={(token) => {
              setWhatsappProof({ mobile: whatsapp, token });
              setErrors((current) => ({ ...current, whatsappNumber: '' }));
            }}
          />
          <Field
            label="Website"
            keyboardType="url"
            autoCapitalize="none"
            value={form.website}
            onChangeText={(value) => set('website', value)}
            placeholder="https://"
          />
          <Section title="Owner" style={styles.subSection}>
            <Field label="Owner name" value={form.ownerName} onChangeText={(value) => set('ownerName', value)} error={errors.ownerName} />
            <Field
              label="Owner mobile"
              prefix="+91"
              keyboardType="phone-pad"
              value={form.ownerMobile}
              onChangeText={(value) => set('ownerMobile', mobileInputDigits(value, form.ownerMobile))}
              maxLength={14}
              error={errors.ownerMobile}
              hint="Only FinderB sees this. Your login email and mobile are changed under Login & security."
            />
            {ownerMobileIsNew ? (
              ownerVerified ? (
                <Tag label="Verified on WhatsApp" tone="success" />
              ) : (
                <Btn label="Verify on WhatsApp" tone="outline" onPress={() => setOwnerSheet(true)} />
              )
            ) : null}
          </Section>
          <PhoneVerifySheet
            key={form.ownerMobile}
            mobile={form.ownerMobile}
            title="Verify owner mobile"
            reason="Owner mobile can be used to log in with WhatsApp, so we confirm a new number first."
            visible={ownerSheet}
            onClose={() => setOwnerSheet(false)}
            onVerified={(token) => {
              setOwnerProof({ mobile: form.ownerMobile, token });
              setErrors((current) => ({ ...current, ownerMobile: '' }));
            }}
          />
        </>
      ) : null}

      {section === 'location' ? (
        <>
          <Field
            label="Shop address"
            multiline
            value={form.businessAddress}
            onChangeText={(value) => set('businessAddress', value)}
            placeholder="Shop no., building, street, area, landmark"
            error={errors.businessAddress}
          />
          <View style={styles.pair}>
            <View style={styles.flex}>
              <PickField label="State" value={form.state} placeholder="Choose" onPress={() => setPlaceMenu('state')} />
              {errors.state ? <Text style={styles.error}>{errors.state}</Text> : null}
            </View>
            <View style={[styles.flex, !form.state && styles.dim]}>
              <PickField label="City" value={form.city} placeholder="Choose" onPress={() => form.state && setPlaceMenu('city')} />
              {errors.city ? <Text style={styles.error}>{errors.city}</Text> : null}
            </View>
          </View>
          <Panel style={styles.pinPanel}>
            <View style={[styles.pinIcon, pin ? styles.pinIconOn : null]}>
              <Ionicons name={pin ? 'location' : 'location-outline'} size={20} color={pin ? c.success : c.muted} />
            </View>
            <View style={styles.flex}>
              <Text style={styles.pinTitle}>{pin ? 'Pinned on the map' : 'No map pin yet'}</Text>
              <Text style={[styles.hint, errors.pin ? { color: c.danger } : pinOk && pinMoved ? { color: c.success } : null]}>
                {errors.pin ||
                  (pinChecking
                    ? 'Checking the pin…'
                    : pinMoved && pinNote
                      ? pinNote
                      : pin
                        ? `${pin.lat.toFixed(5)}, ${pin.lng.toFixed(5)}`
                        : 'Lets customers get directions straight to your door.')}
              </Text>
            </View>
            <Btn small tone="outline" label={pin ? 'Move' : 'Add pin'} onPress={() => setMapOpen(true)} disabled={!form.city} />
          </Panel>
          {placeMenu ? (
            <PlaceSheet
              key={placeMenu}
              visible
              title={placeMenu === 'state' ? 'Choose state' : `City in ${form.state}`}
              options={placeMenu === 'state' ? INDIAN_STATES : citiesInState(form.state)}
              onClose={() => setPlaceMenu(null)}
              onPick={(value) => {
                if (placeMenu === 'state') {
                  if (value !== form.state) setForm((current) => ({ ...current, state: value, city: '' }));
                } else {
                  set('city', value);
                }
                setPlaceMenu(null);
              }}
            />
          ) : null}
          <Modal
            visible={mapOpen}
            animationType="slide"
            onShow={() => setMapLive(true)}
            onRequestClose={() => {
              setMapOpen(false);
              setMapLive(false);
            }}
          >
            <SafeAreaView style={styles.mapScreen} edges={['top', 'bottom']}>
              <View style={styles.mapBar}>
                <View style={styles.flex}>
                  <Text style={styles.mapTitle}>Pin your shop</Text>
                  <Text style={styles.hint}>The pin has to sit inside {form.city}.</Text>
                </View>
                <Btn
                  small
                  label="Done"
                  onPress={() => {
                    setMapOpen(false);
                    setMapLive(false);
                  }}
                />
              </View>
              {mapLive ? (
                <ShopMapPicker
                  fill
                  city={form.city}
                  state={form.state}
                  pin={pin}
                  note={pinNote}
                  noteOk={pinOk}
                  checking={pinChecking}
                  onPin={(next) => {
                    setForm((current) => ({ ...current, latitude: next?.lat ?? 0, longitude: next?.lng ?? 0 }));
                    setErrors((current) => ({ ...current, pin: '' }));
                  }}
                />
              ) : (
                <ActivityIndicator style={styles.mapWait} color={c.primary} />
              )}
            </SafeAreaView>
          </Modal>
        </>
      ) : null}

      {section === 'hours' ? (
        <>
          {errors.timings ? <Text style={styles.error}>{errors.timings}</Text> : null}
          <HoursEditor timings={form.timings} onChange={(next) => set('timings', next)} />
        </>
      ) : null}

      {section === 'offers' ? (
        <>
          <Section title="Payment modes">
            <View style={styles.chipWrap}>
              {PAYMENT_MODES.map((mode) => {
                const active = form.paymentModes.includes(mode);
                return (
                  <Chip
                    key={mode}
                    label={mode}
                    icon={active ? 'checkmark' : undefined}
                    active={active}
                    onPress={() =>
                      set('paymentModes', active ? form.paymentModes.filter((item) => item !== mode) : [...form.paymentModes, mode])
                    }
                  />
                );
              })}
            </View>
          </Section>
          <Section title="Running offer">
            <View style={styles.chipWrap}>
              {DISCOUNT_OPTIONS.map((option) => (
                <Chip
                  key={option}
                  label={option}
                  active={(form.discountRange || 'No Discount') === option}
                  onPress={() => set('discountRange', option)}
                />
              ))}
            </View>
          </Section>
          <Field
            label="Year you started"
            keyboardType="number-pad"
            maxLength={4}
            value={form.yearsInBusiness ? String(form.yearsInBusiness) : ''}
            onChangeText={(value) => set('yearsInBusiness', Number(value.replace(/\D/g, '')) || 0)}
            placeholder="e.g. 2012"
            error={errors.yearsInBusiness}
          />
        </>
      ) : null}

      {section === 'social' ? (
        <>
          <Field
            label="Instagram"
            autoCapitalize="none"
            keyboardType="url"
            value={form.instagramUrl}
            onChangeText={(value) => set('instagramUrl', value)}
            placeholder="instagram.com/yourshop"
          />
          <Field
            label="Facebook"
            autoCapitalize="none"
            keyboardType="url"
            value={form.facebookUrl}
            onChangeText={(value) => set('facebookUrl', value)}
            placeholder="facebook.com/yourshop"
          />
          <Field
            label="YouTube"
            autoCapitalize="none"
            keyboardType="url"
            value={form.youtubeUrl}
            onChangeText={(value) => set('youtubeUrl', value)}
            placeholder="youtube.com/@yourshop"
            hint="Each link must point to that site. Leave a box empty to remove it."
          />
        </>
      ) : null}
    </ConsolePage>
  );
}

function isSection(value: unknown): value is SectionKey {
  return LISTING_SECTIONS.some((section) => section.key === value);
}

export default function EditListingScreen() {
  const params = useLocalSearchParams<{ section?: string }>();
  const section: SectionKey = isSection(params.section) ? params.section : 'basics';
  return <ConsoleGate>{(overview) => <EditBody o={overview} section={section} />}</ConsoleGate>;
}

const useStyles = createConsoleStyles((c) => ({
  flex: { flex: 1, minWidth: 0 },
  hint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: c.muted },
  error: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: c.danger },
  dim: { opacity: 0.45 },
  subSection: { gap: 24, marginTop: 4 },
  tagInput: { gap: 8 },
  tagTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  tagLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  tagCount: { fontFamily: fonts.regular, fontSize: 12, color: c.faint },
  tagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 12,
    paddingRight: 9,
    height: 32,
    borderRadius: 16,
    backgroundColor: c.primarySoft,
  },
  tagPillText: { fontFamily: fonts.regular, fontSize: 13.5, color: c.ink },
  tagAddRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: c.lineStrong },
  tagField: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 8,
    paddingHorizontal: 0,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: c.ink,
  },
  tagAdd: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  option: { paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: c.line },
  optionPressed: { backgroundColor: c.sunken },
  optionText: { fontFamily: fonts.regular, fontSize: 15.5, color: c.ink },
  inlineLink: { alignSelf: 'flex-start', marginTop: -12 },
  sheetLead: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.body },
  strong: { fontFamily: fonts.semiBold, color: c.ink },
  otp: { gap: 14, alignItems: 'stretch' },
  otpNote: { fontFamily: fonts.regular, fontSize: 13, color: c.success, textAlign: 'center' },
  resend: { alignSelf: 'center', paddingVertical: 4 },
  copyText: { fontFamily: fonts.semiBold, fontSize: 13, color: c.accent },
  pair: { flexDirection: 'row', gap: 16 },
  pinPanel: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.sunken, borderWidth: 0 },
  pinIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c.card },
  pinIconOn: { backgroundColor: c.successSoft },
  pinTitle: { fontFamily: fonts.semiBold, fontSize: 14.5, color: c.ink, marginBottom: 2 },
  mapScreen: { flex: 1, backgroundColor: c.page },
  mapBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: c.card,
    borderBottomWidth: 0.5,
    borderBottomColor: c.line,
  },
  mapTitle: { fontFamily: fonts.semiBold, fontSize: 18, color: c.ink },
  mapWait: { marginTop: 60 },
  day: { gap: 12, padding: 14 },
  dayHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  dayName: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  daySummary: { fontFamily: fonts.regular, fontSize: 12.5, color: c.muted },
  modeRow: { flexDirection: 'row', gap: 8 },
  timeRow: { flexDirection: 'row', gap: 16 },
  time: {
    flex: 1,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: c.lineStrong,
  },
  timeEdge: { fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  timeValue: { marginTop: 2, fontFamily: fonts.regular, fontSize: 16, color: c.ink },
  copy: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
}));

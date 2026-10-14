import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthAlert, AuthField, PasswordToggle } from '../../components/AuthField';
import { bizColors, useBizColors } from '../../constants/businessColors';
import { fonts } from '../../constants/typography';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { otpSendLabel, useOtpCooldown } from '../../hooks/useOtpCooldown';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { fetchAllCategories, type HomeCategory } from '../../lib/api';
import {
  checkBusinessTaken,
  EMAIL_TAKEN,
  MOBILE_TAKEN,
  requestBusinessEmailOtp,
  requestBusinessPhoneOtp,
  submitBusinessRegistration,
  verifyBusinessEmailOtp,
  verifyBusinessPhoneOtp,
  type BusinessTaken,
} from '../../lib/businessRegister';
import { citiesInState, INDIAN_STATES } from '../../lib/indianPlaces';
import { checkPinInsideCity, type MapPin } from '../../lib/mapPlace';
import { mobileInputDigits, PHONE_INPUT_MAX_LENGTH } from '../../lib/phoneInput';
import { ShopMapPicker } from '../../components/ShopMapPicker';
import { OtpCodeBoxes } from '../../components/OtpCodeBoxes';
import { useAuth } from '../../context/AuthContext';

const UI = fonts.medium;
const METER_LABEL = ['', 'Risky', 'Fair', 'Good', 'Strong'];

type Country = { iso: string; name: string; dial: string };

const COUNTRIES: Country[] = [
  { iso: 'IN', name: 'India', dial: '91' },
  { iso: 'AE', name: 'United Arab Emirates', dial: '971' },
  { iso: 'US', name: 'United States', dial: '1' },
  { iso: 'GB', name: 'United Kingdom', dial: '44' },
  { iso: 'SG', name: 'Singapore', dial: '65' },
  { iso: 'AU', name: 'Australia', dial: '61' },
  { iso: 'CA', name: 'Canada', dial: '1' },
  { iso: 'NP', name: 'Nepal', dial: '977' },
  { iso: 'BD', name: 'Bangladesh', dial: '880' },
  { iso: 'LK', name: 'Sri Lanka', dial: '94' },
  { iso: 'SA', name: 'Saudi Arabia', dial: '966' },
  { iso: 'QA', name: 'Qatar', dial: '974' },
  { iso: 'MY', name: 'Malaysia', dial: '60' },
  { iso: 'DE', name: 'Germany', dial: '49' },
  { iso: 'FR', name: 'France', dial: '33' },
  { iso: 'NZ', name: 'New Zealand', dial: '64' },
];

function flagEmoji(iso: string) {
  return iso
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

function passwordMeter(password: string) {
  const rules = [
    { ok: password.length >= 8, label: '8 characters', tip: 'Use at least 8 characters' },
    { ok: /[a-z]/.test(password), label: 'A small letter', tip: 'Add a small letter' },
    { ok: /[A-Z]/.test(password), label: 'A capital letter', tip: 'Add a capital letter' },
    { ok: /\d/.test(password), label: 'A number', tip: 'Add a number' },
    { ok: /[^A-Za-z0-9]/.test(password), label: 'A symbol', tip: 'Add a symbol, like ! or @' },
    { ok: password.length >= 12, label: '12 characters', tip: 'Make it 12 characters or longer' },
  ];
  const met = rules.filter((rule) => rule.ok).length;
  const level =
    password.length === 0 ? 0 : met <= 2 ? 1 : met <= 4 ? 2 : met === 5 ? 3 : 4;
  return {
    rules,
    level,
    label: METER_LABEL[level],
    ready: password.length >= 8,
    tips: rules.filter((rule) => !rule.ok).map((rule) => rule.tip),
  };
}

export default function BusinessRegisterScreen() {
  const styles = useStyles();
  const biz = useBizColors();
  const { user: signedInUser, signOut } = useAuth();
  const meterColors = [biz.meterOff, biz.danger, biz.warn, biz.successBright, biz.success];
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [reached, setReached] = useState<1 | 2 | 3>(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [catalogState, setCatalogState] = useState<{ categories: HomeCategory[]; error?: string } | null>(null);
  const [parent, setParent] = useState<HomeCategory | null>(null);
  const [sub, setSub] = useState<HomeCategory | null>(null);
  const [leaf, setLeaf] = useState<HomeCategory | null>(null);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [placeMenu, setPlaceMenu] = useState<null | 'state' | 'city'>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const [mapLive, setMapLive] = useState(false);
  const mapCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pin, setPin] = useState<MapPin | null>(null);
  const [pinNote, setPinNote] = useState('');
  const [pinOk, setPinOk] = useState<boolean | null>(null);
  const [pinChecking, setPinChecking] = useState(false);
  const [declared, setDeclared] = useState(false);
  const [declareError, setDeclareError] = useState(false);
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [countryQuery, setCountryQuery] = useState('');
  const [emailCode, setEmailCode] = useState('');
  const [emailProof, setEmailProof] = useState('');
  const [emailProofFor, setEmailProofFor] = useState('');
  const [reuseApproved, setReuseApproved] = useState<string[]>([]);
  const [emailOtpSending, setEmailOtpSending] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpHint, setEmailOtpHint] = useState('');
  const emailOtp = useOtpCooldown();
  const [mobileCode, setMobileCode] = useState('');
  const [mobileProof, setMobileProof] = useState('');
  const [mobileProofFor, setMobileProofFor] = useState('');
  const [mobileOtpSending, setMobileOtpSending] = useState(false);
  const [mobileOtpVerifying, setMobileOtpVerifying] = useState(false);
  const mobileOtp = useOtpCooldown();
  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    building: '',
    street: '',
    landmark: '',
    pin: '',
    city: '',
    state: '',
    publicPhone: '',
  });

  useEffect(
    () => () => {
      if (mapCloseTimer.current) clearTimeout(mapCloseTimer.current);
    },
    [],
  );

  const openMap = () => {
    if (!form.city) return;
    if (mapCloseTimer.current) clearTimeout(mapCloseTimer.current);
    setMapOpen(true);
  };

  // Android crashes if the map WebView is torn down while the Modal window is animating
  // away, so the WebView unmounts first and the Modal closes a moment later.
  const closeMap = () => {
    setMapLive(false);
    if (mapCloseTimer.current) clearTimeout(mapCloseTimer.current);
    mapCloseTimer.current = setTimeout(() => setMapOpen(false), 120);
  };

  const set = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError('');
  };

  useEffect(() => {
    let live = true;
    void fetchAllCategories().then((res) => {
      if (live) setCatalogState(res);
    });
    return () => {
      live = false;
    };
  }, []);

  const retryCatalog = () => {
    setCatalogState(null);
    void fetchAllCategories(true).then(setCatalogState);
  };

  const catalog = useMemo(() => catalogState?.categories ?? [], [catalogState]);
  const catalogFailed = Boolean(catalogState && catalog.length === 0);
  const categoryById = useMemo(() => new Map(catalog.map((item) => [item.id, item])), [catalog]);
  const childrenOf = useMemo(() => {
    const map = new Map<string, HomeCategory[]>();
    for (const item of catalog) {
      if (!item.parentId) continue;
      const list = map.get(item.parentId) ?? [];
      list.push(item);
      map.set(item.parentId, list);
    }
    return map;
  }, [catalog]);
  const parents = useMemo(() => catalog.filter((item) => !item.parentId), [catalog]);
  const subs = parent ? (childrenOf.get(parent.id) ?? []) : [];
  const leaves = sub ? (childrenOf.get(sub.id) ?? []) : [];

  const chooseCategory = (item: HomeCategory) => {
    const chain: HomeCategory[] = [item];
    let cursor = item.parentId ? categoryById.get(item.parentId) : undefined;
    while (cursor && chain.length < 4) {
      chain.unshift(cursor);
      cursor = cursor.parentId ? categoryById.get(cursor.parentId) : undefined;
    }
    setParent(chain[0]);
    setSub(chain[1] ?? null);
    setLeaf(chain[2] ?? null);
    setCategoryQuery(item.name);
    setError('');
  };

  const chooseSub = (item: HomeCategory) => {
    setSub(item);
    setLeaf(null);
    setError('');
  };

  const meter = passwordMeter(form.password.trim());
  const countryMatches = useMemo(() => {
    const q = countryQuery.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.dial.includes(q) ||
        item.iso.toLowerCase().includes(q),
    );
  }, [countryQuery]);
  const mobileOk =
    country.iso === 'IN'
      ? /^[6-9]\d{9}$/.test(form.mobile)
      : form.mobile.length >= 6;
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const workEmail = form.email.trim().toLowerCase();
  const emailVerified = Boolean(emailProof) && emailProofFor === workEmail;
  const emailCodeOpen = emailOtp.isSentTo(workEmail);
  const emailCodeWaiting = emailOtp.isWaiting(workEmail);

  /** Resolves true when the value may be used: it is free, or its FinderB user account owner says yes. */
  const confirmReuse = async (kind: 'email' | 'mobile', value: string) => {
    const key = takenKey(kind, value);
    if (reuseApproved.includes(key)) return true;
    let state = takenCache.get(key);
    if (!state) {
      const res = await checkBusinessTaken(kind === 'email' ? { email: value } : { mobile: value });
      if (!res) return true;
      state = takenStateFor(kind, res);
      takenCache.set(key, state);
    }
    if (state !== 'user') return true;
    const label = kind === 'email' ? 'email' : 'mobile number';
    const shown = kind === 'email' ? value : `+91 ${value.slice(0, 5)} ${value.slice(5)}`;
    return new Promise<boolean>((resolve) => {
      Alert.alert(
        `This ${label} is already in use`,
        `${shown} is already used by a FinderB user account. Do you want to use the same ${label} for your business?\n\nOne ${label} can only have one FinderB account. Your user account will be converted into this business account, and its saved items will be removed. You will verify it with an OTP first.`,
        [
          {
            text: `Use a different ${label}`,
            style: 'cancel',
            onPress: () => {
              if (kind === 'email') set('email', '');
              else set('mobile', '');
              resolve(false);
            },
          },
          {
            text: 'Yes, use the same',
            onPress: () => {
              setReuseApproved((prev) => [...prev, key]);
              resolve(true);
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  };

  const sendWorkEmailCode = async () => {
    if (!emailOk || emailCodeWaiting || emailOtpSending) return;
    setError('');
    if (!(await confirmReuse('email', workEmail))) return;
    setEmailCode('');
    setEmailOtpHint('');
    setEmailOtpSending(true);
    const result = await requestBusinessEmailOtp(workEmail);
    setEmailOtpSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    emailOtp.markSent(workEmail);
    setEmailOtpHint(result.message);
  };

  const verifyEmailCode = async (value = emailCode) => {
    if (value.length !== 6 || emailOtpVerifying) return;
    setError('');
    setEmailOtpVerifying(true);
    const result = await verifyBusinessEmailOtp(workEmail, value);
    setEmailOtpVerifying(false);
    if (!result.success || !result.emailVerificationToken) {
      setEmailCode('');
      setError(result.success ? 'Could not verify that email.' : result.error);
      return;
    }
    setEmailProof(result.emailVerificationToken);
    setEmailProofFor(workEmail);
    setEmailCode('');
    setEmailOtpHint(result.message);
  };
  const mobileVerified = Boolean(mobileProof) && mobileProofFor === form.mobile;
  const mobileCodeOpen = mobileOtp.isSentTo(form.mobile);
  const mobileCodeWaiting = mobileOtp.isWaiting(form.mobile);

  const sendMobileCode = async () => {
    if (!mobileOk || country.iso !== 'IN' || mobileCodeWaiting || mobileOtpSending) return;
    setError('');
    if (!(await confirmReuse('mobile', form.mobile))) return;
    setMobileCode('');
    setMobileOtpSending(true);
    const result = await requestBusinessPhoneOtp(form.mobile);
    setMobileOtpSending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    mobileOtp.markSent(form.mobile);
  };

  const verifyMobileCode = async (value = mobileCode) => {
    if (value.length !== 6 || mobileOtpVerifying) return;
    setError('');
    setMobileOtpVerifying(true);
    const result = await verifyBusinessPhoneOtp(form.mobile, value);
    setMobileOtpVerifying(false);
    if (!result.success || !result.phoneVerificationToken) {
      setMobileCode('');
      setError(result.success ? 'Could not verify that number.' : result.error);
      return;
    }
    setMobileProof(result.phoneVerificationToken);
    setMobileProofFor(form.mobile);
    setMobileCode('');
  };
  const nameOk = form.fullName.trim().length >= 2;
  const [emailTaken, checkEmailTaken] = useTakenCheck('email', form.email, emailOk);
  const [mobileTaken, checkMobileTaken] = useTakenCheck(
    'mobile',
    form.mobile,
    mobileOk && country.iso === 'IN',
  );
  const toBusinessLogin = () => router.push('/(tabs)/business-login' as Href);
  // Same stored label as the website: the two deepest picked levels, and a group root is never stored.
  const categoryLabel = leaf && sub
    ? `${sub.name} › ${leaf.name}`
    : sub && parent
      ? parent.level === 0
        ? sub.name
        : `${parent.name} › ${sub.name}`
      : parent?.name || '';
  const categoryMatches = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return parents.slice(0, 12);
    const rank = (item: HomeCategory) => {
      const name = item.name.toLowerCase();
      return (name.startsWith(q) ? 0 : 2) + (item.parentId ? 1 : 0);
    };
    return catalog
      .filter((item) => item.name.toLowerCase().includes(q))
      .sort((a, b) => rank(a) - rank(b))
      .slice(0, 12);
  }, [catalog, categoryQuery, parents]);

  const cityChoices = useMemo(() => citiesInState(form.state), [form.state]);

  const placeOptions = useMemo(() => {
    const source = placeMenu === 'city' ? cityChoices : INDIAN_STATES;
    const q = placeQuery.trim().toLowerCase();
    if (!q) return source;
    return source.filter((name) => name.toLowerCase().includes(q));
  }, [cityChoices, placeMenu, placeQuery]);

  const clearPin = () => {
    setPin(null);
    setPinNote('');
    setPinOk(null);
    setPinChecking(false);
  };

  const placePin = (next: MapPin | null) => {
    setPin(next);
    setPinOk(null);
    setPinNote('');
    setPinChecking(Boolean(next));
  };

  const pickState = (name: string) => {
    set('state', name);
    set('city', '');
    setPlaceMenu(null);
    setPlaceQuery('');
    clearPin();
    setError('');
  };

  const pickCity = (name: string) => {
    set('city', name);
    setPlaceMenu(null);
    setPlaceQuery('');
    clearPin();
    setError('');
  };

  const openPlaceMenu = (which: 'state' | 'city') => {
    if (which === 'city' && !form.state) return;
    setPlaceQuery('');
    setPlaceMenu(which);
  };

  useEffect(() => {
    if (!pin || !form.city || !form.state) {
      setPinChecking(false);
      setPinOk(null);
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
  }, [form.city, form.state, pin]);

  const openStep = (next: 1 | 2 | 3) => {
    if (next > reached) return;
    setError('');
    setStep(next);
  };

  const visit = (next: 1 | 2 | 3) => {
    setReached((prev) => (next > prev ? next : prev));
    setError('');
    setStep(next);
  };

  const goBack = () => {
    setError('');
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
    else router.back();
  };

  const continueOwner = async () => {
    if (!nameOk) {
      setError('Enter the owner’s full name.');
      return;
    }
    if (country.iso !== 'IN') {
      setError('Choose India, then enter the owner’s mobile number.');
      return;
    }
    if (!mobileOk) {
      setError('Enter a 10-digit mobile starting with 6, 7, 8, or 9.');
      return;
    }
    if (!mobileVerified) {
      setError('Verify your mobile number with the WhatsApp OTP before continuing.');
      return;
    }
    if (!emailOk) {
      setError('Enter a valid work email.');
      return;
    }
    if (!emailVerified) {
      setError('Verify your work email with the 6-digit code before continuing.');
      return;
    }
    if (mobileTaken === 'taken') {
      setError(MOBILE_TAKEN);
      return;
    }
    if (emailTaken === 'taken') {
      setError(EMAIL_TAKEN);
      return;
    }
    if (!meter.ready) {
      setError('Password needs at least 8 characters.');
      return;
    }
    if (!form.confirmPassword.trim()) {
      setError('Confirm your password.');
      return;
    }
    if (form.confirmPassword.trim() !== form.password.trim()) {
      setError('Passwords do not match.');
      return;
    }
    const settled = (state: TakenState) => state === 'free' || state === 'user';
    if (!settled(mobileTaken) || !settled(emailTaken)) {
      setBusy(true);
      const taken = await checkBusinessTaken({ email: form.email, mobile: form.mobile });
      setBusy(false);
      if (taken) {
        takenCache.set(takenKey('mobile', form.mobile), takenStateFor('mobile', taken));
        takenCache.set(takenKey('email', form.email), takenStateFor('email', taken));
      }
      if (taken?.mobileTaken) {
        setError(MOBILE_TAKEN);
        return;
      }
      if (taken?.emailTaken) {
        setError(EMAIL_TAKEN);
        return;
      }
    }
    setError('');
    if (!form.publicPhone) set('publicPhone', form.mobile);
    visit(2);
  };

  const continueShop = () => {
    if (form.businessName.trim().length < 2) {
      setError('Enter the name on the signboard.');
      return;
    }
    if (!parent) {
      setError('Pick a category.');
      return;
    }
    if (subs.length > 0 && !sub) {
      setError('Pick a subcategory.');
      return;
    }
    setError('');
    visit(3);
  };

  const submit = async () => {
    const phone = form.mobile;
    const building = form.building.trim();
    const street = form.street.trim();
    const landmark = form.landmark.trim();
    const postalPin = form.pin.trim();
    const savedPin = pin && pinOk === true ? pin : null;
    if (building.length < 2) {
      setError('Enter the building number.');
      return;
    }
    if (street.length < 3) {
      setError('Enter the street and area.');
      return;
    }
    if (landmark.length < 2) {
      setError('Enter a nearby landmark.');
      return;
    }
    if (!/^[1-9]\d{5}$/.test(postalPin)) {
      setError('Enter a 6-digit PIN code.');
      return;
    }
    if (!form.state || !cityChoices.includes(form.city)) {
      setError('Pick a state, then choose a city from that state.');
      return;
    }
    if (pin && pinChecking) {
      setError(`Still checking that this pin is inside ${form.city}.`);
      return;
    }
    if (pin && pinOk !== true) {
      setError(pinNote || `Move the pin inside ${form.city}, or clear it.`);
      return;
    }
    if (country.iso !== 'IN' || !/^[6-9]\d{9}$/.test(phone)) {
      setError('Enter a valid Indian mobile number.');
      return;
    }
    if (!declared) {
      setDeclareError(true);
      setError('Confirm that these particulars are accurate before registering.');
      return;
    }
    setError('');
    setBusy(true);
    const result = await submitBusinessRegistration({
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      emailVerificationToken: emailProof,
      phoneVerificationToken: mobileVerified ? mobileProof : '',
      password: form.password.trim(),
      mobile: form.mobile,
      businessName: form.businessName.trim(),
      displayName: form.businessName.trim(),
      category: categoryLabel,
      city: form.city.trim(),
      state: form.state,
      country: 'India',
      publicPhone: phone,
      addressLine1: `${building}, ${street}`,
      addressLine2: `${landmark}, ${postalPin}`,
      ...(savedPin ? { latitude: savedPin.lat, longitude: savedPin.lng } : {}),
      selectedPlan: 'free',
      billingCycle: 'monthly',
    });
    setBusy(false);
    if (!result.success) {
      if (result.taken) {
        takenCache.set(takenKey(result.taken, result.taken === 'email' ? form.email : form.mobile), 'taken');
        setStep(1);
      } else if (/whatsapp otp|mobile verification/i.test(result.error || '')) {
        setMobileProof('');
        setStep(1);
      }
      setError(result.error || 'Registration failed.');
      return;
    }
    // The server removes a user account that shares these details, so drop its session too.
    const sameEmail = signedInUser?.email?.trim().toLowerCase() === form.email.trim().toLowerCase();
    const samePhone = (signedInUser?.phone || '').replace(/\D/g, '').slice(-10) === form.mobile.replace(/\D/g, '').slice(-10);
    if (signedInUser && !signedInUser.isBusinessAccount && (sameEmail || samePhone)) {
      await signOut();
    }
    setStep(4);
  };

  const bottomPad = useTabScrollPadding(16);
  const steps = [
    {
      key: 'You',
      title: 'Who runs this business?',
      line: 'Your name and mobile, so FinderB can reach the owner. The password stays private.',
    },
    {
      key: 'Business',
      title: 'Name the business',
      line: 'People search this name and category.',
    },
    {
      key: 'Place',
      title: 'Where is it?',
      line: 'Choose the state and city from the lists. A map pin is optional.',
    },
  ];
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topBar}>
            <Pressable onPress={goBack} hitSlop={10} style={styles.back}>
              <Ionicons name="chevron-back" size={22} color={biz.ink} />
            </Pressable>
            <View style={styles.brand}>
              <Image
                source={require('../../assets/fb-mark-240.png')}
                style={styles.mark}
                contentFit="contain"
              />
              <Text style={styles.brandText}>Business</Text>
            </View>
          </View>

          {step < 4 ? (
            <>
              <View style={styles.stepper}>
                <View style={styles.stepTrack} />
                {reached > 1 ? (
                  <View style={[styles.stepTrackOn, reached === 2 ? styles.stepTrackMid : styles.stepTrackFull]} />
                ) : null}
                {steps.map((item, index) => {
                  const n = (index + 1) as 1 | 2 | 3;
                  const current = step === n;
                  const done = n <= reached && !current;
                  return (
                    <Pressable
                      key={item.key}
                      style={styles.stepItem}
                      disabled={n > reached}
                      onPress={() => openStep(n)}
                    >
                      <View style={[styles.stepDot, (current || done) && styles.stepDotOn]}>
                        {done ? (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        ) : (
                          <Text style={[styles.stepNum, (current || done) && styles.stepNumOn]}>{n}</Text>
                        )}
                      </View>
                      <Text style={[styles.stepName, (current || done) && styles.stepNameOn]}>{item.key}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.title}>{steps[step - 1].title}</Text>
              <Text style={styles.lead}>{steps[step - 1].line}</Text>
            </>
          ) : null}

          {error ? (
            <View style={styles.alert}>
              <AuthAlert message={error} />
            </View>
          ) : null}

          {step === 1 ? (
            <>
              <AuthField fontFamily={UI}
                label="Your name"
                value={form.fullName}
                onChangeText={(v) => set('fullName', v)}
                placeholder="Owner name"
                autoComplete="name"
              />
              <Status ok={nameOk} show={form.fullName.length > 0} label="Name looks good" />
              <AuthField fontFamily={UI}
                label="Mobile"
                value={form.mobile}
                onChangeText={(v) => set('mobile', mobileInputDigits(v, form.mobile, country.dial))}
                placeholder="Mobile number"
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                maxLength={PHONE_INPUT_MAX_LENGTH}
                onBlur={checkMobileTaken}
                leftSlot={
                  <CountryCodeButton country={country} onPress={() => setCountryOpen(true)} />
                }
                rightSlot={
                  mobileVerified ? (
                    <Ionicons name="checkmark-circle" size={22} color={biz.success} />
                  ) : (
                    <Pressable
                      onPress={() => void sendMobileCode()}
                      disabled={mobileOtpSending || mobileCodeWaiting || !mobileOk || country.iso !== 'IN'}
                      style={[
                        styles.otpInline,
                        styles.otpInlineWhatsApp,
                        (mobileOtpSending || mobileCodeWaiting || !mobileOk || country.iso !== 'IN') &&
                          styles.disabled,
                      ]}
                    >
                      <Text style={styles.otpInlineText}>
                        {mobileOtpSending
                          ? '…'
                          : otpSendLabel(mobileCodeOpen, mobileCodeWaiting, mobileOtp.secondsLeft)}
                      </Text>
                    </Pressable>
                  )
                }
              />
              <Status
                ok={mobileOk && mobileTaken !== 'taken'}
                show={form.mobile.length > 0}
                pending={mobileOk && mobileTaken === 'checking'}
                label={
                  !mobileOk
                    ? 'Enter the mobile number'
                    : mobileTaken === 'taken'
                      ? 'This number is already registered.'
                      : mobileTaken === 'user'
                        ? 'This number is on a FinderB user account. Using it will convert that account into your business.'
                        : mobileTaken === 'checking'
                          ? 'Checking this number…'
                          : mobileTaken === 'free'
                            ? 'Mobile number is available'
                            : mobileTaken === 'unknown'
                              ? "We'll confirm this number when you continue"
                              : 'Mobile looks good'
                }
                action={mobileTaken === 'taken' ? { label: 'Log in', onPress: toBusinessLogin } : undefined}
              />
              {mobileVerified ? (
                <Text style={styles.otpHint}>Mobile verified on WhatsApp.</Text>
              ) : mobileCodeOpen ? (
                <View style={styles.otpBox}>
                  <Text style={styles.otpSentText}>
                    OTP has been sent to the WhatsApp account linked to{' '}
                    <Text style={styles.otpSentPhone}>
                      +91 {form.mobile.slice(0, 5)} {form.mobile.slice(5)}
                    </Text>
                  </Text>
                  <OtpCodeBoxes
                    value={mobileCode}
                    onChange={(value) => {
                      setMobileCode(value);
                      setError('');
                    }}
                    onComplete={(value) => void verifyMobileCode(value)}
                    disabled={mobileOtpVerifying}
                    autoFocus
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.otpWhatsAppBtn,
                      pressed && styles.pressed,
                      (mobileOtpVerifying || mobileCode.length !== 6) && styles.disabled,
                    ]}
                    disabled={mobileOtpVerifying || mobileCode.length !== 6}
                    onPress={() => void verifyMobileCode()}
                  >
                    {mobileOtpVerifying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.otpWhatsAppBtnText}>Verify mobile</Text>
                    )}
                  </Pressable>
                </View>
              ) : mobileOk && country.iso === 'IN' ? (
                <Text style={styles.otpLead}>Tap Send OTP to get a 6-digit code on this number’s WhatsApp.</Text>
              ) : null}
              <AuthField fontFamily={UI}
                label="Work email"
                value={form.email}
                onChangeText={(v) => {
                  const nextKey = v.trim().toLowerCase();
                  if (nextKey !== workEmail) {
                    setEmailCode('');
                    setEmailProof('');
                    setEmailProofFor('');
                  }
                  set('email', v);
                  setEmailOtpHint('');
                }}
                rightSlot={
                  emailVerified ? undefined : (
                    <Pressable
                      onPress={() => void sendWorkEmailCode()}
                      disabled={emailOtpSending || emailCodeWaiting || !emailOk}
                      style={[
                        styles.otpInline,
                        (emailOtpSending || emailCodeWaiting || !emailOk) && styles.disabled,
                      ]}
                    >
                      <Text style={styles.otpInlineText}>
                        {emailOtpSending
                          ? '…'
                          : otpSendLabel(emailCodeOpen, emailCodeWaiting, emailOtp.secondsLeft)}
                      </Text>
                    </Pressable>
                  )
                }
                onEndEditing={(event) => set('email', event.nativeEvent.text.trim().toLowerCase())}
                onBlur={checkEmailTaken}
                placeholder="you@business.com"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoComplete="email"
              />
              <Status
                ok={emailOk && emailTaken !== 'taken'}
                show={form.email.length > 0}
                pending={emailOk && emailTaken === 'checking'}
                label={
                  !emailOk
                    ? 'Use a full email address'
                    : emailTaken === 'taken'
                      ? 'This email is already registered.'
                      : emailTaken === 'user'
                        ? 'This email is on a FinderB user account. Using it will convert that account into your business.'
                        : emailTaken === 'checking'
                          ? 'Checking this email…'
                          : emailTaken === 'free'
                            ? 'Email is available'
                            : emailTaken === 'unknown'
                              ? "We'll confirm this email when you continue"
                              : 'Email looks good'
                }
                action={emailTaken === 'taken' ? { label: 'Log in', onPress: toBusinessLogin } : undefined}
              />
              {emailVerified ? (
                <Text style={styles.otpHint}>Work email verified. You can continue.</Text>
              ) : emailCodeOpen ? (
                <View style={styles.otpBox}>
                  <Text style={styles.otpSentText}>
                    Enter the 6-digit code sent to <Text style={styles.otpSentPhone}>{workEmail}</Text>
                  </Text>
                  <OtpCodeBoxes
                    value={emailCode}
                    onChange={(value) => {
                      setEmailCode(value);
                      setError('');
                    }}
                    onComplete={(value) => void verifyEmailCode(value)}
                    disabled={emailOtpVerifying}
                    autoFocus
                  />
                  <Pressable
                    style={({ pressed }) => [
                      styles.otpBtnPrimary,
                      pressed && styles.pressed,
                      (emailOtpVerifying || emailCode.length !== 6) && styles.disabled,
                    ]}
                    disabled={emailOtpVerifying || emailCode.length !== 6}
                    onPress={() => void verifyEmailCode()}
                  >
                    {emailOtpVerifying ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={styles.otpBtnPrimaryText}>Verify email</Text>
                    )}
                  </Pressable>
                  {emailOtpHint ? <Text style={styles.otpHint}>{emailOtpHint}</Text> : null}
                </View>
              ) : emailOtpHint ? (
                <Text style={styles.otpHint}>{emailOtpHint}</Text>
              ) : null}
              <AuthField fontFamily={UI}
                label="Create password"
                value={form.password}
                onChangeText={(v) => set('password', v)}
                onEndEditing={(event) => set('password', event.nativeEvent.text.trim())}
                placeholder="Create a password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                rightSlot={
                  <PasswordToggle
                    visible={showPassword}
                    onToggle={() => setShowPassword((v) => !v)}
                  />
                }
                footer={
                  <>
                <View style={styles.strengthHead}>
                  <Text style={styles.strengthTitle}>Strength</Text>
                  <View style={styles.meterRow}>
                    {[0, 1, 2, 3].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.meterBar,
                          { backgroundColor: index < meter.level ? meterColors[meter.level] : biz.line },
                        ]}
                      />
                    ))}
                  </View>
                  <Text style={[styles.meterLabel, { color: meter.level ? meterColors[meter.level] : biz.slateSoft }]}>
                    {meter.label}
                  </Text>
                </View>
                <View style={styles.rules}>
                  {meter.rules.map((rule) => (
                    <View key={rule.label} style={[styles.rule, rule.ok && (meter.level === 4 ? styles.ruleStrong : styles.ruleOn)]}>
                      <Ionicons
                        name={rule.ok ? 'checkmark' : 'ellipse-outline'}
                        size={11}
                        color={rule.ok ? (meter.level === 4 ? biz.success : biz.blue) : biz.slateSoft}
                      />
                      <Text style={[styles.ruleText, rule.ok && (meter.level === 4 ? styles.ruleTextStrong : styles.ruleTextOn)]}>{rule.label}</Text>
                    </View>
                  ))}
                </View>
                {meter.tips.length > 0 ? (
                  <View style={styles.tips}>
                    <Text style={styles.tipsTitle}>
                      {form.password.length === 0 ? 'A stronger password' : 'To make it stronger'}
                    </Text>
                    {meter.tips.map((tip) => (
                      <Text key={tip} style={styles.tip}>
                        {tip}
                      </Text>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.tipDone}>Nothing else. This password is strong.</Text>
                )}
                  </>
                }
              />
              <AuthField fontFamily={UI}
                label="Confirm password"
                value={form.confirmPassword}
                onChangeText={(v) => set('confirmPassword', v)}
                onEndEditing={(event) => set('confirmPassword', event.nativeEvent.text.trim())}
                placeholder="Re-enter your password"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password-new"
                rightSlot={
                  form.confirmPassword && form.confirmPassword.trim() === form.password.trim() ? (
                    <Ionicons name="checkmark-circle" size={20} color={biz.success} />
                  ) : undefined
                }
                footer={
                  form.confirmPassword && form.confirmPassword.trim() !== form.password.trim() ? (
                    <Text style={styles.passwordMismatch}>Passwords do not match.</Text>
                  ) : undefined
                }
              />
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, busy && styles.disabled]}
                onPress={() => void continueOwner()}
                disabled={busy}
              >
                {busy ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <View style={styles.btnRow}>
                    <Text style={styles.primaryText}>Continue</Text>
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
              <Text style={styles.nextHint}>Next: the name on your signboard.</Text>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <AuthField fontFamily={UI}
                label="Business name"
                value={form.businessName}
                onChangeText={(v) => set('businessName', v)}
                placeholder="Name on the signboard"
              />
              <AuthField
                fontFamily={UI}
                label="Category"
                value={categoryQuery}
                onChangeText={(text) => {
                  setCategoryQuery(text);
                  if (parent) {
                    setParent(null);
                    setSub(null);
                    setLeaf(null);
                  }
                }}
                placeholder="Search, like gym or salon"
              />
              <View style={styles.chipWrap}>
                {!catalogState ? <ActivityIndicator color={biz.blue} /> : null}
                {categoryMatches.map((item) => {
                  const on = item.id === parent?.id || item.id === sub?.id || item.id === leaf?.id;
                  const above = item.parentId ? categoryById.get(item.parentId)?.name : undefined;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => chooseCategory(item)}
                      style={[styles.chip, on && styles.chipOn]}
                    >
                      <Text style={[styles.chipText, on && styles.chipTextOn]}>
                        {item.name}
                        {above ? (
                          <Text style={[styles.chipContext, on && styles.chipTextOn]}>{`  ·  ${above}`}</Text>
                        ) : null}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {catalogFailed ? (
                <Pressable onPress={retryCatalog} hitSlop={8}>
                  <Text style={styles.quiet}>Could not load categories. Tap to try again.</Text>
                </Pressable>
              ) : categoryQuery.trim() && categoryMatches.length === 0 ? (
                <Text style={styles.quiet}>Nothing named that. Try a shorter word.</Text>
              ) : !categoryQuery.trim() && parents.length > categoryMatches.length ? (
                <Text style={styles.searchHint}>Type to search all {catalog.length} categories and subcategories.</Text>
              ) : null}
              {subs.length > 0 ? (
                <>
                  <Text style={styles.fieldLabel}>Which kind?</Text>
                  <View style={styles.chipWrap}>
                    {subs.map((item) => {
                      const on = sub?.id === item.id;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => chooseSub(item)}
                          style={[styles.chip, on && styles.chipTeal]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}
              {leaves.length > 0 ? (
                <>
                  <Text style={styles.fieldLabel}>More specific (optional)</Text>
                  <View style={styles.chipWrap}>
                    {leaves.map((item) => {
                      const on = leaf?.id === item.id;
                      return (
                        <Pressable
                          key={item.id}
                          onPress={() => setLeaf(on ? null : item)}
                          style={[styles.chip, on && styles.chipTeal]}
                        >
                          <Text style={[styles.chipText, on && styles.chipTextOn]}>{item.name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={continueShop}
              >
                <Text style={styles.primaryText}>Continue</Text>
              </Pressable>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <PlaceSelect
                label="State"
                value={form.state}
                placeholder="Select state"
                onPress={() => openPlaceMenu('state')}
              />
              <PlaceSelect
                label="City"
                value={form.city}
                placeholder={form.state ? 'Select city' : 'Select a state first'}
                disabled={!form.state}
                onPress={() => openPlaceMenu('city')}
              />
              <AuthField fontFamily={UI}
                label="Building"
                value={form.building}
                onChangeText={(v) => set('building', v)}
                placeholder="Building 12, 2nd floor"
              />
              <AuthField fontFamily={UI}
                label="Street and area"
                value={form.street}
                onChangeText={(v) => set('street', v)}
                placeholder="MG Road, Indiranagar"
              />
              <AuthField fontFamily={UI}
                label="Landmark"
                value={form.landmark}
                onChangeText={(v) => set('landmark', v)}
                placeholder="Near Metro station"
              />
              <AuthField fontFamily={UI}
                label="PIN code"
                value={form.pin}
                onChangeText={(v) => set('pin', v.replace(/\D/g, '').slice(0, 6))}
                placeholder="560038"
                keyboardType="number-pad"
                maxLength={6}
              />
              <Pressable
                style={[styles.mapLaunch, !form.city && styles.mapLaunchOff]}
                onPress={openMap}
                disabled={!form.city}
              >
                <Ionicons name="map-outline" size={22} color={form.city ? biz.blue : biz.faint} />
                <View style={styles.mapLaunchCopy}>
                  <Text style={styles.mapLaunchTitle}>Set location on map</Text>
                  <Text style={styles.mapLaunchSub}>
                    {!form.city
                      ? 'Select a city first. This step is optional.'
                      : pin && pinOk === true
                        ? `Pin set in ${form.city}. Tap to change.`
                        : pin
                          ? pinNote || 'Pin needs to sit inside the city, or clear it.'
                          : 'Search Google Maps, paste a Maps link, or drop a pin.'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={biz.faint} />
              </Pressable>
              <AuthField fontFamily={UI}
                label="Display phone number"
                value={`+91 ${form.mobile}`}
                editable={false}
                dimmed
                footer={
                  <Text style={styles.toggleText}>
                    Customers will see the mobile number you verified in the previous step.
                  </Text>
                }
              />
              <Pressable
                style={styles.declare}
                onPress={() => {
                  setDeclared((on) => !on);
                  setDeclareError(false);
                }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: declared }}
              >
                <Ionicons
                  name={declared ? 'checkbox' : 'square-outline'}
                  size={22}
                  color={declared ? biz.blue : declareError ? biz.danger : biz.faint}
                />
                <Text style={styles.declareText}>
                  I confirm that the business particulars submitted here are true, complete, and not misleading. I accept responsibility for their accuracy, and I agree that FinderB may suspend or remove this listing if any particular is found to be false, incomplete, or misleading.
                </Text>
              </Pressable>
              {declareError && !declared ? (
                <Text style={styles.declareHint}>Tick this confirmation before registering.</Text>
              ) : null}
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, busy && styles.disabled]}
                onPress={() => void submit()}
                disabled={busy}
              >
                {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryText}>Register business</Text>}
              </Pressable>
            </>
          ) : null}

          {step === 4 ? (
            <View style={styles.done}>
              <View style={styles.doneIcon}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
              </View>
              <Text style={styles.doneTitle}>You’re listed.</Text>
              <Text style={styles.doneBody}>
                {form.businessName} is registered. Open the in-app dashboard to manage the listing, photos, and leads.
              </Text>
              <View style={styles.doneNote}>
                <Ionicons name="time-outline" size={18} color={biz.blueDeep} />
                <Text style={styles.doneNoteText}>
                  Your storefront will not be visible until the FinderB team verifies your business. Please wait up to
                  24 hours.
                </Text>
              </View>
              <Pressable
                style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
                onPress={() => router.replace('/business-console' as Href)}
              >
                <Text style={styles.primaryText}>Open dashboard</Text>
              </Pressable>
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        visible={placeMenu !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPlaceMenu(null)}
      >
        <Pressable style={styles.countryBackdrop} onPress={() => setPlaceMenu(null)} />
        <View style={styles.placeSheet}>
          <Text style={styles.countryTitle}>{placeMenu === 'city' ? 'City' : 'State'}</Text>
          <TextInput
            value={placeQuery}
            onChangeText={setPlaceQuery}
            placeholder={placeMenu === 'city' ? 'Search city' : 'Search state'}
            placeholderTextColor={biz.faint}
            style={styles.countrySearch}
          />
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.placeList}>
            {placeOptions.map((name) => {
              const selected = placeMenu === 'city' ? form.city === name : form.state === name;
              return (
                <Pressable
                  key={name}
                  style={styles.placeRow}
                  onPress={() => (placeMenu === 'city' ? pickCity(name) : pickState(name))}
                >
                  <Text style={styles.placeRowText}>{name}</Text>
                  {selected ? <Ionicons name="checkmark" size={18} color={biz.blue} /> : null}
                </Pressable>
              );
            })}
            {placeOptions.length === 0 ? (
              <Text style={styles.quiet}>Nothing matches that.</Text>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
      <Modal
        visible={mapOpen}
        animationType="slide"
        onShow={() => setMapLive(true)}
        onRequestClose={closeMap}
      >
        <SafeAreaView style={styles.mapScreen} edges={['top', 'bottom']}>
          <View style={styles.mapBar}>
            <Pressable onPress={closeMap} hitSlop={10} accessibilityLabel="Close map">
              <Ionicons name="close" size={24} color={biz.ink} />
            </Pressable>
            <View style={styles.mapBarCopy}>
              <Text style={styles.mapBarTitle}>Location on map</Text>
              <Text style={styles.mapBarSub}>Optional. A pin has to sit inside {form.city}.</Text>
            </View>
            <Pressable onPress={closeMap} hitSlop={10}>
              <Text style={styles.mapDone}>Done</Text>
            </Pressable>
          </View>
          {form.city && mapLive ? (
            <ShopMapPicker
              fill
              city={form.city}
              state={form.state}
              pin={pin}
              note={pinNote}
              noteOk={pinOk}
              checking={pinChecking}
              onPin={placePin}
            />
          ) : (
            <View style={styles.mapPending}>
              <ActivityIndicator color={biz.blue} />
            </View>
          )}
        </SafeAreaView>
      </Modal>
      <Modal
        visible={countryOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCountryOpen(false)}
      >
        <Pressable style={styles.countryBackdrop} onPress={() => setCountryOpen(false)} />
        <View style={styles.countrySheet}>
          <Text style={styles.countryTitle}>Country</Text>
          <TextInput
            value={countryQuery}
            onChangeText={setCountryQuery}
            placeholder="Search country"
            placeholderTextColor={biz.faint}
            style={styles.countrySearch}
          />
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.countryList}>
            {countryMatches.map((item) => {
              const selected = item.iso === country.iso;
              return (
                <Pressable
                  key={item.iso}
                  style={styles.countryRow}
                  onPress={() => {
                    setCountry(item);
                    setCountryOpen(false);
                    setCountryQuery('');
                  }}
                >
                  <Text style={styles.countryFlag}>{flagEmoji(item.iso)}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDial}>+{item.dial}</Text>
                  {selected ? <Ionicons name="checkmark" size={18} color={biz.blue} /> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function PlaceSelect({
  label,
  value,
  placeholder,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const biz = useBizColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[styles.placeSelect, disabled && styles.placeSelectOff]}
      accessibilityRole="button"
    >
      <View style={styles.placeSelectCopy}>
        <Text style={styles.placeSelectLabel}>{label}</Text>
        <Text
          style={value ? styles.placeSelectValue : styles.placeSelectPlaceholder}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
      </View>
      <Ionicons name="chevron-down" size={18} color={disabled ? biz.faint : biz.body} />
    </Pressable>
  );
}

function CountryCodeButton({ country, onPress }: { country: Country; onPress: () => void }) {
  const biz = useBizColors();
  return (
    <Pressable onPress={onPress} style={dialStyles.btn} hitSlop={6}>
      <Text style={dialStyles.flag}>{flagEmoji(country.iso)}</Text>
      <Text style={[dialStyles.code, { color: biz.ink }]}>+{country.dial}</Text>
      <Ionicons name="chevron-down" size={14} color={biz.body} />
    </Pressable>
  );
}

const dialStyles = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag: { fontSize: 18 },
  code: { fontFamily: fonts.medium, fontSize: 14 },
});

/**
 * `idle`: not checked yet. `user`: a FinderB user account uses the value; the owner may reuse it.
 * `unknown`: the lookup could not run.
 */
type TakenState = 'idle' | 'checking' | 'free' | 'taken' | 'user' | 'unknown';

const takenCache = new Map<string, Exclude<TakenState, 'idle' | 'checking' | 'unknown'>>();

function takenKey(kind: 'email' | 'mobile', value: string) {
  return `${kind}:${value.trim().toLowerCase()}`;
}

function takenStateFor(kind: 'email' | 'mobile', result: BusinessTaken) {
  const taken = kind === 'mobile' ? result.mobileTaken : result.emailTaken;
  const onUserAccount = kind === 'mobile' ? result.mobileOnUserAccount : result.emailOnUserAccount;
  return taken ? 'taken' : onUserAccount ? 'user' : 'free';
}

/**
 * "Already registered?" lookup for one field. Runs only when `check` is called (the field
 * loses focus), so typing never triggers a request; editing the value clears the result.
 */
function useTakenCheck(
  kind: 'email' | 'mobile',
  value: string,
  valid: boolean,
): [TakenState, () => void] {
  const key = takenKey(kind, value);
  const [result, setResult] = useState<{ key: string; state: TakenState }>({ key: '', state: 'idle' });

  const check = useCallback(() => {
    if (!valid || takenCache.has(key)) return;
    setResult({ key, state: 'checking' });
    void checkBusinessTaken(kind === 'email' ? { email: value } : { mobile: value }).then((res) => {
      if (res) takenCache.set(key, takenStateFor(kind, res));
      setResult({ key, state: res ? takenStateFor(kind, res) : 'unknown' });
    });
  }, [key, kind, valid, value]);

  if (!valid) return ['idle', check];
  const state = takenCache.get(key) ?? (result.key === key ? result.state : 'idle');
  return [state, check];
}

function Status({
  ok,
  show,
  label,
  pending,
  action,
}: {
  ok: boolean;
  show: boolean;
  label: string;
  pending?: boolean;
  action?: { label: string; onPress: () => void };
}) {
  const styles = useStyles();
  const biz = useBizColors();
  if (!show) return null;
  return (
    <View style={styles.status}>
      {pending ? (
        <ActivityIndicator size="small" color={biz.slate} style={styles.statusSpinner} />
      ) : (
        <Ionicons
          name={ok ? 'checkmark-circle' : 'alert-circle'}
          size={14}
          color={ok ? biz.blue : biz.danger}
        />
      )}
      <Text style={[styles.statusText, ok && styles.statusOk, pending && styles.statusPending]}>
        {label}
        {action ? (
          <Text style={styles.statusAction} onPress={action.onPress}>
            {`  ${action.label}`}
          </Text>
        ) : null}
      </Text>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => {
  const b = bizColors(colors);
  return {
  safe: { flex: 1, backgroundColor: b.page },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingTop: 4 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 18,
  },
  back: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mark: { width: 26, height: 26 },
  brandText: {
    fontFamily: UI,
    fontSize: 15,
    color: b.blue,
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 22,
    paddingHorizontal: 6,
  },
  stepTrack: {
    position: 'absolute',
    left: 28,
    right: 28,
    top: 13,
    height: 2,
    backgroundColor: b.line,
  },
  stepTrackOn: {
    position: 'absolute',
    left: 28,
    top: 13,
    height: 2,
    backgroundColor: b.blueFill,
  },
  stepTrackMid: { width: '34%' },
  stepTrackFull: { right: 28 },
  stepItem: { alignItems: 'center', width: 72 },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.card,
    borderWidth: 1.5,
    borderColor: b.lineStrong,
  },
  stepDotOn: {
    backgroundColor: b.blueFill,
    borderColor: b.blue,
  },
  stepNum: {
    fontFamily: UI,
    fontSize: 13,
    color: b.slate,
  },
  stepNumOn: { color: b.onFill },
  stepName: {
    marginTop: 6,
    fontFamily: UI,
    fontSize: 12,
    color: b.slateSoft,
  },
  stepNameOn: { color: b.blue },
  title: {
    fontFamily: UI,
    fontSize: 30,
    letterSpacing: -0.5,
    color: colors.heading,
  },
  lead: {
    marginTop: 8,
    marginBottom: 18,
    fontFamily: UI,
    fontSize: 15,
    lineHeight: 22,
    color: b.body,
  },
  strengthHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  strengthTitle: {
    fontFamily: UI,
    fontSize: 12,
    color: colors.heading,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nextHint: {
    marginTop: 10,
    textAlign: 'center',
    fontFamily: UI,
    fontSize: 13,
    color: b.slate,
  },
  alert: { marginBottom: 8 },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -4,
    marginBottom: 10,
  },
  statusText: {
    fontFamily: UI,
    fontSize: 12,
    color: b.danger,
  },
  statusOk: { color: b.blue },
  statusPending: { color: b.slate },
  statusSpinner: { transform: [{ scale: 0.7 }], width: 14, height: 14 },
  statusAction: {
    fontFamily: fonts.semiBold,
    color: b.blue,
    textDecorationLine: 'underline',
  },
  meterRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  meterBar: {
    flex: 1,
    height: 4,
    borderRadius: 4,
  },
  meterLabel: {
    width: 72,
    textAlign: 'right',
    fontFamily: UI,
    fontSize: 12,
  },
  rules: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 8,
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 7,
    paddingVertical: 2,
    backgroundColor: b.card,
    borderWidth: 1,
    borderColor: b.line,
  },
  ruleOn: {
    backgroundColor: b.blueSoft,
    borderColor: b.blueLine,
  },
  ruleStrong: {
    backgroundColor: b.successSoft,
    borderColor: b.success,
  },
  ruleText: {
    fontFamily: UI,
    fontSize: 11,
    color: b.slate,
  },
  ruleTextOn: { color: b.blue },
  ruleTextStrong: { color: b.success },
  tips: {
    marginTop: 6,
    gap: 1,
  },
  tipsTitle: {
    fontFamily: UI,
    fontSize: 11,
    color: b.body,
  },
  tip: {
    fontFamily: UI,
    fontSize: 12,
    lineHeight: 16,
    color: b.blueDeep,
  },
  tipDone: {
    marginTop: 6,
    fontFamily: UI,
    fontSize: 12,
    color: b.success,
  },
  passwordMismatch: {
    fontFamily: UI,
    fontSize: 12,
    color: b.danger,
  },
  fieldLabel: {
    marginTop: 4,
    marginBottom: 8,
    fontFamily: UI,
    fontSize: 13,
    color: colors.heading,
  },
  search: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: b.line,
    backgroundColor: b.card,
    paddingHorizontal: 14,
    fontFamily: UI,
    fontSize: 15,
    color: colors.heading,
    marginBottom: 10,
  },
  searchDisabled: {
    backgroundColor: b.cardMuted,
    color: b.faint,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: b.line,
    backgroundColor: b.card,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipOn: { backgroundColor: b.blueFill, borderColor: b.blue },
  chipTeal: { backgroundColor: b.blueFill, borderColor: b.blue },
  chipText: { fontFamily: UI, fontSize: 13, color: b.ink },
  chipTextOn: { color: b.onFill },
  chipContext: { fontFamily: UI, fontSize: 12, color: b.faint },
  searchHint: {
    marginTop: -4,
    marginBottom: 12,
    fontFamily: UI,
    fontSize: 12,
    color: b.faint,
  },
  quiet: {
    marginBottom: 10,
    fontFamily: UI,
    fontSize: 13,
    color: b.danger,
  },
  placeSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 52,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1.5,
    borderBottomColor: b.lineStrong,
  },
  placeSelectOff: { opacity: 0.45 },
  placeSelectCopy: { flex: 1, paddingVertical: 7 },
  placeSelectLabel: {
    fontFamily: UI,
    fontSize: 11,
    color: colors.textSoft,
    marginBottom: 1,
  },
  placeSelectValue: {
    fontFamily: UI,
    fontSize: 15,
    color: colors.ink,
  },
  placeSelectPlaceholder: {
    fontFamily: UI,
    fontSize: 15,
    color: colors.textSoft,
  },
  placeSheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 72,
    bottom: 72,
    borderRadius: 16,
    backgroundColor: b.card,
    padding: 14,
  },
  placeList: { flex: 1 },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: b.line,
  },
  placeRowText: {
    flex: 1,
    fontFamily: UI,
    fontSize: 15,
    color: colors.heading,
  },
  mapLaunch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
    marginBottom: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: b.line,
    backgroundColor: b.card,
  },
  mapLaunchOff: { opacity: 0.55 },
  mapLaunchCopy: { flex: 1 },
  mapLaunchTitle: {
    fontFamily: UI,
    fontSize: 15,
    color: colors.heading,
  },
  mapLaunchSub: {
    marginTop: 2,
    fontFamily: UI,
    fontSize: 12,
    lineHeight: 16,
    color: b.slate,
  },
  mapScreen: { flex: 1, backgroundColor: b.page },
  mapBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  mapBarCopy: { flex: 1 },
  mapBarTitle: {
    fontFamily: UI,
    fontSize: 16,
    color: colors.heading,
  },
  mapBarSub: {
    marginTop: 2,
    fontFamily: UI,
    fontSize: 12,
    lineHeight: 16,
    color: b.slate,
  },
  mapDone: {
    fontFamily: UI,
    fontSize: 16,
    color: b.blue,
  },
  mapPending: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  mapWait: {
    marginTop: -2,
    marginBottom: 12,
    fontFamily: UI,
    fontSize: 13,
    lineHeight: 18,
    color: b.slate,
  },
  stateList: {
    marginTop: 2,
    marginBottom: 8,
  },
  stateRow: {
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: b.cardMuted,
  },
  stateRowText: {
    fontFamily: UI,
    fontSize: 15,
    color: colors.heading,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  toggleText: {
    flex: 1,
    fontFamily: UI,
    fontSize: 14,
    color: colors.heading,
  },
  declare: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    paddingVertical: 4,
  },
  declareText: {
    flex: 1,
    fontFamily: UI,
    fontSize: 12,
    lineHeight: 17,
    color: b.body,
  },
  declareHint: {
    marginTop: 2,
    marginLeft: 32,
    fontFamily: UI,
    fontSize: 12,
    lineHeight: 16,
    color: b.danger,
  },
  otpBox: {
    marginTop: 8,
    marginBottom: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: b.line,
    backgroundColor: b.card,
    padding: 12,
  },
  otpLead: {
    marginTop: 4,
    marginBottom: 8,
    fontFamily: UI,
    fontSize: 12,
    lineHeight: 17,
    color: b.slateSoft,
  },
  otpInline: {
    marginLeft: 8,
    minWidth: 76,
    height: 34,
    borderRadius: 8,
    backgroundColor: b.blue,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  otpInlineText: {
    fontFamily: UI,
    fontSize: 12,
    color: '#FFFFFF',
  },
  otpInlineWhatsApp: { backgroundColor: '#128C7E' },
  otpSentText: {
    fontFamily: UI,
    fontSize: 13,
    lineHeight: 19,
    color: b.body,
    textAlign: 'center',
    marginBottom: 6,
  },
  otpSentPhone: { color: b.ink },
  otpWhatsAppBtn: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#128C7E',
  },
  otpWhatsAppBtnText: {
    fontFamily: UI,
    fontSize: 14,
    color: '#FFFFFF',
  },
  otpActions: {
    flexDirection: 'row',
    gap: 8,
  },
  otpBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: b.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.page,
  },
  otpBtnText: {
    fontFamily: UI,
    fontSize: 14,
    color: b.blue,
  },
  otpBtnPrimary: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.blueFill,
  },
  otpBtnPrimaryText: {
    fontFamily: UI,
    fontSize: 14,
    color: b.onFill,
  },
  otpHint: {
    marginTop: 8,
    fontFamily: UI,
    fontSize: 12,
    lineHeight: 16,
    color: b.success,
  },
  primaryBtn: {
    marginTop: 12,
    minHeight: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.blueFill,
  },
  primaryText: {
    fontFamily: UI,
    fontSize: 16,
    color: b.onFill,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.7 },
  done: { paddingTop: 12 },
  doneIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.blueFill,
    marginBottom: 16,
  },
  doneTitle: {
    fontFamily: UI,
    fontSize: 28,
    letterSpacing: -0.5,
    color: colors.heading,
  },
  countryBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: b.scrim,
  },
  countrySheet: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 120,
    maxHeight: 420,
    borderRadius: 16,
    backgroundColor: b.card,
    padding: 14,
  },
  countryTitle: {
    fontFamily: UI,
    fontSize: 16,
    color: colors.heading,
    marginBottom: 10,
  },
  countrySearch: {
    minHeight: 44,
    borderBottomWidth: 1.5,
    borderBottomColor: b.lineStrong,
    fontFamily: UI,
    fontSize: 15,
    color: colors.heading,
    marginBottom: 8,
  },
  countryList: { flexGrow: 0 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  countryFlag: { fontSize: 20, width: 28 },
  countryName: { flex: 1, fontFamily: UI, fontSize: 15, color: colors.heading },
  countryDial: { fontFamily: UI, fontSize: 14, color: b.body },
  doneBody: {
    marginTop: 8,
    marginBottom: 8,
    fontFamily: UI,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  doneNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 8,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: b.blueLine,
    backgroundColor: b.blueSoft,
  },
  doneNoteText: {
    flex: 1,
    fontFamily: UI,
    fontSize: 14,
    lineHeight: 20,
    color: b.blueDeep,
  },
};
});

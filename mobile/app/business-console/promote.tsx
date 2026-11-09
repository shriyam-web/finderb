import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, AppState, Easing, Linking, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as Location from 'expo-location';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { queuePermissionRequest, requestLocationPermission } from '../../lib/permissionGate';
import { getStoredToken } from '../../lib/session';
import { SITE_URL } from '../../lib/supabase';
import { Btn, Chip, ConsolePage, Field, Panel, PickField, Sheet, createConsoleStyles, useTabBack } from '../../components/console/kit';
import { citiesInState, INDIAN_STATES } from '../../lib/indianPlaces';
import { mobileInputDigits } from '../../lib/phoneInput';
import { LAUNCH_PACKAGES, peekPromotionDesk, storePromotionDesk } from '../../lib/promotionDeskCache';
import { RazorpayCheckout } from '../../components/console/RazorpayCheckout';
import { ProgressPie } from '../../components/console/ProgressPie';
import { adProgress } from '../../lib/adProgress';
import type { CheckoutStart } from '../../lib/merchantConsoleApi';

const COVERAGE_PRESETS = ['5–8 KM around the shop', '15–20 KM / City', 'District / Regional'] as const;
const AD_TARGETS = [
  'More views',
  'More calls',
  'More shop visits',
  'More messages',
  'Informative',
  'Awareness',
] as const;
const DAY_PRESETS = [5, 7, 10, 15, 30];
const COVERAGE_OTHER = 'Other';

type CustomErrors = Partial<Record<'budget' | 'days' | 'coverage' | 'state' | 'city' | 'area' | 'pin' | 'goal' | 'phone', string>>;

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
      <Field boxed label="Search" value={query} onChangeText={setQuery} placeholder="Type to search" autoFocus />
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
        {!list.length ? <Text style={styles.photoHint}>Nothing matches that.</Text> : null}
      </View>
    </Sheet>
  );
}

function BoxedPick({
  label,
  value,
  placeholder,
  error,
  disabled,
  onPress,
}: {
  label: string;
  value: string;
  placeholder: string;
  error?: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  return (
    <View style={[styles.boxedPick, disabled && styles.boxedPickOff]}>
      <Text style={styles.boxedPickLabel}>{label}</Text>
      <Pressable
        onPress={disabled ? undefined : onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label}${value ? `, ${value}` : ''}`}
        style={styles.boxedPickBtn}
      >
        <Text style={[styles.boxedPickValue, !value && { color: c.isDark ? '#9A938C' : '#C9C9D1' }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={c.muted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

type PackageCard = {
  id: string;
  name: string;
  durationDays: number;
  coverage: string;
  priceInr: number;
  referenceInr: number;
  discountPercent: number;
  reach: string;
  views?: string;
  visits?: string;
  popular: boolean;
  estimateNote: string;
};

type PromotionOrder = {
  id: string;
  packageId: string;
  packageName: string;
  priceInr: number;
  paymentStatus: string;
  campaignStatus: string;
  campaignLabel: string;
  adReviewStatus?: 'none' | 'pending' | 'approved' | 'denied';
  adReviewReason?: string;
  targetPincode: string;
  targetArea: string;
  audience?: string;
  content?: string;
  videoReady: boolean;
  createdAt: string | null;
};

type Desk = {
  success: true;
  verification: {
    status: string;
    rejectionReason: string | null;
    submittedAt?: string | null;
    reviewedAt?: string | null;
    documentType?: string | null;
  };
  packages: PackageCard[];
  orders?: PromotionOrder[];
  customRequest?: {
    id: string;
    status: string;
    budgetInr: number;
    durationDays: number;
    createdAt: string | null;
  } | null;
};

const DECLARATION =
  'I confirm this shop is real and the services I list are the ones I actually offer. Any payment or advance a customer gives me is my own responsibility. FinderB only helps people discover my business and does not take part in those payments.';

type ShopShot = { uri: string; name: string; type: string; file?: File };
type PickedPhoto = { shot: ShopShot | null; problem: 'unopened' | 'lost' | null };

function requestCameraAccess(): Promise<boolean> {
  return queuePermissionRequest(() => new Promise<boolean>((resolve) => {
    let done = false;
    let leftApp = false;
    const finish = (granted: boolean) => {
      if (done) return;
      done = true;
      clearTimeout(unopened);
      clearInterval(poll);
      sub.remove();
      resolve(granted);
    };
    const unopened = setTimeout(() => {
      if (!leftApp) finish(false);
    }, 20000);
    const poll = setInterval(() => {
      void ImagePicker.getCameraPermissionsAsync()
        .then((res) => {
          if (res.granted) finish(true);
        })
        .catch(() => undefined);
    }, 1000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        leftApp = true;
        return;
      }
      if (!leftApp || Platform.OS === 'web') return;
      setTimeout(() => {
        void ImagePicker.getCameraPermissionsAsync()
          .then((res) => finish(res.granted))
          .catch(() => finish(false));
      }, 700);
    });
    void ImagePicker.getCameraPermissionsAsync()
      .then((current) => {
        if (current.granted) {
          finish(true);
          return;
        }
        if (current.canAskAgain === false) {
          finish(false);
          return;
        }
        return ImagePicker.requestCameraPermissionsAsync().then(
          (res) => finish(res.granted),
          () => ImagePicker.getCameraPermissionsAsync().then((res) => finish(res.granted)).catch(() => finish(false)),
        );
      })
      .catch(() => finish(false));
  }));
}

/** Camera and gallery promises can stay pending after the system screen closes. Give up only then. */
function shotFromAsset(asset: ImagePicker.ImagePickerAsset, name: string): ShopShot {
  const type = asset.mimeType && /^image\/(jpeg|png|webp)$/i.test(asset.mimeType) ? asset.mimeType : 'image/jpeg';
  return { uri: asset.uri, name, type };
}

function awaitPicker(open: () => Promise<ImagePicker.ImagePickerResult>, name: string): Promise<PickedPhoto> {
  if (Platform.OS === 'web') {
    return open()
      .then((shot) => {
        const asset = shot.canceled ? null : shot.assets?.[0];
        return { shot: asset ? shotFromAsset(asset, name) : null, problem: null };
      })
      .catch(() => ({ shot: null, problem: 'unopened' as const }));
  }
  return new Promise((resolve) => {
    let settled = false;
    let uiOpened = false;
    let giveUp: ReturnType<typeof setTimeout> | null = null;
    const finish = (shot: ShopShot | null, problem: PickedPhoto['problem']) => {
      if (settled) return;
      settled = true;
      clearTimeout(unopened);
      if (giveUp) clearTimeout(giveUp);
      sub.remove();
      resolve({ shot, problem });
    };
    const unopened = setTimeout(() => {
      if (!uiOpened) finish(null, 'unopened');
    }, 15000);
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        uiOpened = true;
        if (giveUp) clearTimeout(giveUp);
        giveUp = null;
        return;
      }
      if (!uiOpened) return;
      if (giveUp) clearTimeout(giveUp);
      giveUp = setTimeout(() => {
        void ImagePicker.getPendingResultAsync()
          .then((pending) => {
            if (settled) return;
            const asset = pending && 'canceled' in pending && !pending.canceled ? pending.assets?.[0] : null;
            if (asset) {
              finish(shotFromAsset(asset, name), null);
              return;
            }
            finish(null, 'lost');
          })
          .catch(() => finish(null, 'lost'));
      }, 8000);
    });
    open()
      .then((shot) => {
        const asset = shot.canceled ? null : shot.assets?.[0];
        finish(asset ? shotFromAsset(asset, name) : null, null);
      })
      .catch(() => finish(null, 'unopened'));
  });
}

function takeLivePhoto(name: string, facing: 'front' | 'back'): Promise<PickedPhoto> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', facing === 'front' ? 'user' : 'environment');
      input.style.display = 'none';
      let settled = false;
      const finish = (shot: ShopShot | null) => {
        if (settled) return;
        settled = true;
        window.removeEventListener('focus', onFocus);
        input.remove();
        resolve({ shot, problem: null });
      };
      const openedAt = Date.now();
      const onFocus = () => {
        window.setTimeout(() => {
          if (Date.now() - openedAt < 800) return;
          if (!input.files?.length) finish(null);
        }, 400);
      };
      input.addEventListener('cancel', () => finish(null));
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return finish(null);
        finish({
          uri: URL.createObjectURL(file),
          name: file.name || name,
          type: file.type || 'image/jpeg',
          file,
        });
      });
      window.addEventListener('focus', onFocus);
      document.body.appendChild(input);
      input.click();
    });
  }
  return awaitPicker(
    () => ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      cameraType: facing === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
    }),
    name,
  );
}

async function asJpeg(uri: string, name: string): Promise<ShopShot> {
  const rendered = await ImageManipulator.manipulate(uri).resize({ width: 1600 }).renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.72 });
  return { uri: saved.uri, name, type: 'image/jpeg' };
}

function within<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

async function confirmShopLocation(): Promise<Location.LocationObject | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;
  const fresh = await within(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
    12000,
  );
  if (fresh) return fresh;
  const coarse = await within(
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
    8000,
  );
  if (coarse) return coarse;
  const last = await Location.getLastKnownPositionAsync({ maxAge: 2 * 60 * 1000 }).catch(() => null);
  return last;
}

function uploadForm(path: string, form: FormData): Promise<{ success?: boolean; error?: string }> {
  return getStoredToken().then((token) => new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${SITE_URL}${path}`);
    xhr.timeout = 90000;
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.onload = () => {
      try { resolve(JSON.parse(xhr.responseText) as { success?: boolean; error?: string }); }
      catch { resolve({ success: false, error: 'Verification could not be sent. Try again.' }); }
    };
    xhr.onerror = () => resolve({ success: false, error: 'The upload was interrupted. Try again.' });
    xhr.ontimeout = () => resolve({ success: false, error: 'The upload took too long. Try again.' });
    xhr.send(form);
  }));
}

const VIDEO_HINT = 'Choose an MP4 or MOV that is already vertical (about 9:16), between 15 and 45 seconds, and under 60 MB.';

function uploadPercent(loaded: number, total: number) {
  if (!Number.isFinite(loaded) || !Number.isFinite(total) || total <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((loaded / total) * 100)));
}

function videoProblem(asset: ImagePicker.ImagePickerAsset) {
  const bytes = asset.fileSize || 0;
  if (bytes > 60 * 1024 * 1024) return `This video is larger than 60 MB. ${VIDEO_HINT}`;
  const raw = asset.duration || 0;
  const seconds = raw > 200 ? raw / 1000 : raw;
  if (seconds && (seconds < 15 || seconds > 45)) {
    return `This video is ${Math.round(seconds)} seconds. It must be between 15 and 45 seconds.`;
  }
  if (asset.width && asset.height && asset.height / asset.width < 1.5) {
    return 'This video is not vertical. Choose one that is about 9:16.';
  }
  const mime = asset.mimeType || '';
  if (mime && !/^video\/(mp4|quicktime)$/i.test(mime)) return `This file is not an MP4 or MOV. ${VIDEO_HINT}`;
  return null;
}

function whenStamp(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Kolkata',
  });
}

function appendShot(form: FormData, field: string, shot: ShopShot) {
  const file = shot.file;
  if (file) {
    form.append(field, file);
    return;
  }
  form.append(field, { uri: shot.uri, name: shot.name, type: shot.type } as unknown as Blob);
}

export default function PromoteScreen() {
  const styles = useStyles();
  const c = useConsoleColors();
  const placeholderTint = c.isDark ? '#9A938C' : '#C9C9D1';
  const router = useRouter();
  const back = useTabBack();
  const { run, notify } = useMerchantConsole();
  const [desk, setDesk] = useState<Desk | null>(() => peekPromotionDesk());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [packageId, setPackageId] = useState('');
  const [catalogId, setCatalogId] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [adTargets, setAdTargets] = useState<string[]>([]);
  const [targetNote, setTargetNote] = useState('');
  const [adContent, setAdContent] = useState('');
  const [targetOpen, setTargetOpen] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [checkout, setCheckout] = useState<CheckoutStart | null>(null);
  const [step, setStep] = useState<'offer' | 'verify' | 'track' | 'appPlan' | 'area' | 'video' | 'review' | 'pay' | 'done' | 'custom'>('offer');
  const [inApplication, setInApplication] = useState(false);
  const [newAd, setNewAd] = useState(false);
  const newAdRef = useRef(false);
  const fromComposer = useRef(false);
  const [budget, setBudget] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [coverage, setCoverage] = useState('');
  const [coverageOther, setCoverageOther] = useState(false);
  const [customState, setCustomState] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [placeMenu, setPlaceMenu] = useState<'state' | 'city' | null>(null);
  const [customPin, setCustomPin] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [goal, setGoal] = useState('');
  const [phone, setPhone] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [customSent, setCustomSent] = useState('');
  const [customErrors, setCustomErrors] = useState<CustomErrors>({});
  const [pickError, setPickError] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [documentType, setDocumentType] = useState('gst');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [phase, setPhase] = useState<'' | 'certificate' | 'selfie' | 'location' | 'upload'>('');
  const [opening, setOpening] = useState(true);
  const [pulling, setPulling] = useState(false);
  const [anotherAsk, setAnotherAsk] = useState(false);
  const [draftAsk, setDraftAsk] = useState(false);
  const [adReview, setAdReview] = useState<'none' | 'pending' | 'approved' | 'denied'>('none');
  const [adReviewReason, setAdReviewReason] = useState('');
  const resumed = useRef(false);

  const resumeFrom = (result: Desk) => {
    const status = result.verification.status;
    if (status === 'submitted' || status === 'under_review') return;
    if (status === 'rejected' || status === 'resubmission_required') {
      setStep('verify');
    }
  };

  const load = async (initial = false) => {
    const result = await run<Desk>('promotions');
    if (!result.success) {
      setError(result.error);
      return null;
    }
    storePromotionDesk(result);
    setDesk(result);
    if (initial && !resumed.current) {
      resumed.current = true;
      resumeFrom(result);
    }
    return result;
  };

  useEffect(() => {
    let live = true;
    void load(true).finally(() => {
      if (live) setOpening(false);
    });
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const status = desk?.verification.status;
    if (status !== 'submitted' && status !== 'under_review') return;
    const timer = setInterval(() => { void load(false); }, 15000);
    return () => clearInterval(timer);
  }, [desk?.verification.status]);

  const verify = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setPhase('certificate');
    try {
      if (Platform.OS !== 'web') {
        const granted = await requestCameraAccess();
        if (!granted) {
          setError('Allow the camera so FinderB can photograph the certificate and your face.');
          return;
        }
      }
      const certificate = await takeLivePhoto('certificate.jpg', 'back');
      if (!certificate.shot) {
        if (certificate.problem === 'unopened') setError('The camera did not open. Allow the camera and try again.');
        else if (certificate.problem === 'lost') setError('The certificate photo did not come back. Hold the document steady and try again.');
        else setError('Photograph the certificate with the live camera.');
        return;
      }
      if (Platform.OS === 'android') await new Promise((resolve) => setTimeout(resolve, 400));
      setPhase('selfie');
      const selfie = await takeLivePhoto('selfie.jpg', 'front');
      if (!selfie.shot) {
        if (selfie.problem === 'unopened') setError('The front camera did not open. Allow the camera and try again.');
        else if (selfie.problem === 'lost') setError('The selfie did not come back. Try again.');
        else setError('Take a selfie with the live camera.');
        return;
      }
      setPhase('location');
      const position = await confirmShopLocation();
      if (!position) {
        setError('Turn on location so FinderB can confirm you are at the shop.');
        return;
      }
      setPhase('upload');
      const face = selfie.shot.file && /^image\/(jpeg|png|webp)$/i.test(selfie.shot.type)
        ? selfie.shot
        : await asJpeg(selfie.shot.uri, 'selfie.jpg');
      const proof = certificate.shot.file && /^image\/(jpeg|png|webp)$/i.test(certificate.shot.type)
        ? certificate.shot
        : await asJpeg(certificate.shot.uri, 'certificate.jpg');
      const form = new FormData();
      appendShot(form, 'shopPhoto', face);
      appendShot(form, 'documents', proof);
      form.append('documentType', documentType);
      form.append('latitude', String(position.coords.latitude));
      form.append('longitude', String(position.coords.longitude));
      form.append('accuracy', String(position.coords.accuracy || ''));
      form.append('declaration', agreed ? 'yes' : '');
      const body = await uploadForm('/api/business/promotions/verification', form);
      if (!body.success) {
        const message = body.error || 'Verification could not be sent.';
        setError(/CLOUDINARY|API_SECRET|API_KEY/i.test(message) ? 'Verification could not be sent. Try again.' : message);
        return;
      }
      notify('Verification sent for review');
      await load();
      setStep('track');
    } catch {
      setError('Verification could not be sent. Try again.');
    } finally {
      setBusy(false);
      setPhase('');
    }
  };

  const create = async () => {
    setError('');
    if (!adTargets.length || adTargets.length > 3 || adTargets.some((item) => !(AD_TARGETS as readonly string[]).includes(item))) {
      setError(adTargets.length > 3 ? 'Choose up to 3 targets.' : 'Choose the target of this ad.');
      return;
    }
    if (adContent.trim().length < 8) {
      setError('Write what the ad should say.');
      return;
    }
    if (area.trim().length < 2) {
      setError('Enter the shop locality.');
      return;
    }
    if (!/^[1-9][0-9]{5}$/.test(pincode.trim())) {
      setError('Enter a 6-digit pincode.');
      return;
    }
    setBusy(true);
    const result = await run<{ success: true; orderId: string }>('createPromotion', {
      packageId,
      pincode,
      area,
      audience: adTargets.join(', '),
      content: adContent.trim(),
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    newAdRef.current = false;
    fromComposer.current = true;
    setNewAd(false);
    setOrderId(result.orderId);
    setVideoReady(false);
    setStep('video');
    void load(false);
  };

  const video = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], videoMaxDuration: 45 });
    if (picked.canceled || !picked.assets[0]) return;
    const asset = picked.assets[0];
    const local = videoProblem(asset);
    if (local) {
      setError(local);
      setUploadProgress(0);
      return;
    }
    setBusy(true);
    setError('');
    setUploadProgress(0);
    const ticket = await run<{
      success: true;
      mode?: 'signed' | 'preset';
      cloudName?: string;
      uploadPreset?: string;
      apiKey?: string;
      timestamp?: string;
      signature?: string;
      folder?: string;
    }>('promotionVideoTicket', { orderId });
    const preset = ticket.success && (ticket.mode === 'preset' || Boolean(ticket.uploadPreset));
    const signed = ticket.success && ticket.mode !== 'preset' && ticket.apiKey && ticket.timestamp && ticket.signature && ticket.folder;
    if (!ticket.success || !ticket.cloudName || (!preset && !signed)) {
      setBusy(false);
      setError(ticket.success ? `The video could not be uploaded. ${VIDEO_HINT}` : ticket.error);
      return;
    }
    const mime = asset.mimeType && /^video\/(mp4|quicktime)$/i.test(asset.mimeType) ? asset.mimeType : 'video/mp4';
    const form = new FormData();
    form.append('file', {
      uri: asset.uri,
      name: mime === 'video/quicktime' ? 'promo.mov' : 'promo.mp4',
      type: mime,
    } as unknown as Blob);
    if (preset && ticket.uploadPreset) form.append('upload_preset', ticket.uploadPreset);
    else {
      form.append('api_key', ticket.apiKey || '');
      form.append('timestamp', ticket.timestamp || '');
      form.append('signature', ticket.signature || '');
      form.append('folder', ticket.folder || '');
      form.append('type', 'authenticated');
    }
    const uploaded = await new Promise<{
      public_id?: string;
      format?: string;
      duration?: number;
      width?: number;
      height?: number;
      bytes?: number;
      error?: { message?: string };
    } | null>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${ticket.cloudName}/video/upload`);
      xhr.upload.onprogress = (event) => setUploadProgress(uploadPercent(event.loaded, event.total));
      xhr.onerror = () => resolve(null);
      xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { resolve(null); }
      };
      xhr.send(form);
    });
    if (!uploaded?.public_id) {
      setBusy(false);
      setUploadProgress(0);
      setError(uploaded?.error?.message || `The video could not be uploaded. ${VIDEO_HINT}`);
      return;
    }
    setUploadProgress(100);
    const saved = await run<{ success: true }>('commitPromotionVideo', {
      orderId,
      publicId: uploaded.public_id,
      format: uploaded.format || (mime === 'video/quicktime' ? 'mov' : 'mp4'),
    });
    setBusy(false);
    if (!saved.success) {
      setUploadProgress(0);
      setError(saved.error || `The video could not be uploaded. ${VIDEO_HINT}`);
      return;
    }
    setVideoReady(true);
    setAdReview('pending');
    setAdReviewReason('');
    notify('Sent to FinderB');
    setStep('review');
  };

  const pay = async () => {
    setBusy(true);
    const result = await run<CheckoutStart>('startPromotionPay', { orderId });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCheckout(result);
  };

  const approved = desk?.verification.status === 'approved';
  const packages = desk?.packages?.length ? desk.packages : LAUNCH_PACKAGES;
  const selected = packages.find((item) => item.id === packageId);
  const catalog = packages.find((item) => item.id === catalogId);
  const waiting = desk?.verification.status === 'submitted' || desk?.verification.status === 'under_review';
  const adKind = (order: PromotionOrder): { key: 'draft' | 'review' | 'running' | 'expired' | 'closed'; label: string; percent: number; color: string } => {
    const progress = adProgress(order);
    if (progress.canContinue) return { key: 'draft', label: progress.step, percent: progress.percent, color: c.brand };
    if (order.campaignStatus === 'under_review') return { key: 'review', label: progress.step, percent: progress.percent, color: c.brand };
    if (order.campaignStatus === 'completed') return { key: 'expired', label: progress.step, percent: progress.percent, color: c.muted };
    if (['payment_successful', 'editing', 'video_ready', 'ad_active'].includes(order.campaignStatus)) {
      return { key: 'running', label: progress.step, percent: progress.percent, color: c.success };
    }
    return { key: 'closed', label: progress.step, percent: progress.percent, color: c.muted };
  };
  const ads = [...(desk?.orders || [])].sort((a, b) => {
    const rank = { draft: 0, review: 1, running: 2, expired: 3, closed: 4 };
    return rank[adKind(a).key] - rank[adKind(b).key];
  });
  const showMyAds = waiting || approved || ads.length > 0;
  const openOrder = (order: PromotionOrder) => {
    setError('');
    setPickError(false);
    newAdRef.current = false;
    setNewAd(false);
    setInApplication(true);
    setOrderId(order.id);
    setPackageId(order.packageId);
    setPincode(order.targetPincode);
    setArea(order.targetArea);
    setAdTargets((order.audience || '').split(',').map((item) => item.trim()).filter(Boolean));
    setAdContent(order.content || '');
    setVideoReady(order.videoReady);
    const review = order.adReviewStatus || (order.videoReady ? 'pending' : 'none');
    setAdReview(review);
    setAdReviewReason(order.adReviewReason || '');
    fromComposer.current = false;
    setStep(!order.videoReady ? 'video' : review === 'approved' ? 'pay' : 'review');
  };
  const openApplication = () => {
    setError('');
    setPickError(false);
    newAdRef.current = false;
    setNewAd(false);
    setInApplication(true);
    setOrderId('');
    setPackageId('');
    setPincode('');
    setArea('');
    setAdTargets([]);
    setAdContent('');
    setVideoReady(false);
    setStep('track');
  };
  const continueApplication = () => {
    setError('');
    if (orderId) {
      setStep(!videoReady ? 'video' : adReview === 'approved' ? 'pay' : 'review');
      return;
    }
    setStep('appPlan');
  };
  const goBack = () => {
    if (step === 'custom' || step === 'done') setStep('offer');
    else if (step === 'appPlan') setStep('track');
    else if (step === 'track') {
      setInApplication(false);
      setStep('offer');
    } else if (step === 'pay') setStep('review');
    else if (step === 'review') setStep('video');
    else if (step === 'video') setStep(fromComposer.current ? 'area' : 'offer');
    else if (step === 'area') setStep(newAd ? 'offer' : inApplication ? (orderId ? 'track' : 'appPlan') : approved ? 'offer' : 'verify');
    else if (step === 'verify') setStep('offer');
    else back();
  };
  const clearCustomError = (key: keyof CustomErrors) => {
    setCustomErrors((current) => (current[key] ? { ...current, [key]: undefined } : current));
  };
  const validateCustom = (): CustomErrors => {
    const next: CustomErrors = {};
    const budgetInr = Number(budget.replace(/,/g, ''));
    const days = Number(customDays);
    if (!budget.trim()) next.budget = 'Enter a budget.';
    else if (!Number.isFinite(budgetInr) || budgetInr < 100 || budgetInr > 5000000) {
      next.budget = 'Enter a budget between ₹100 and ₹50,00,000.';
    }
    if (!customDays.trim()) next.days = 'Enter how many days.';
    else if (!Number.isFinite(days) || days < 1 || days > 90) next.days = 'Enter 1 to 90 days.';
    if (coverage.trim().length < 2) next.coverage = 'Choose how far the ads should go.';
    if (!customState) next.state = 'Choose a state.';
    if (!customCity) next.city = 'Choose a city.';
    if (customArea.trim().length < 2) next.area = 'Enter the locality.';
    if (!/^[1-9][0-9]{5}$/.test(customPin.trim())) next.pin = 'Enter a 6-digit pincode.';
    if (goal.trim().length < 8) next.goal = 'Tell FinderB what the ad should promote.';
    if (!/^[6-9]\d{9}$/.test(phone)) next.phone = 'Enter a 10-digit mobile number.';
    return next;
  };
  const sendCustom = async () => {
    const issues = validateCustom();
    setCustomErrors(issues);
    if (Object.keys(issues).length) {
      setError('Fill the highlighted fields.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await run<{ success: true; requestId: string }>('requestCustomPromotion', {
      budgetInr: Number(budget.replace(/,/g, '')),
      durationDays: Number(customDays),
      coverage,
      pincode: customPin.trim(),
      area: [customArea.trim(), customCity, customState].filter(Boolean).join(', '),
      goal,
      phone,
      note: customNote,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setCustomSent(result.requestId);
    notify('Custom plan sent');
    await load();
  };
  const startNewAd = () => {
    if (!catalog) return;
    setDraftAsk(false);
    setInApplication(false);
    newAdRef.current = true;
    setNewAd(true);
    setOrderId('');
    setPackageId(catalog.id);
    setVideoReady(false);
    setAdReview('none');
    setAdReviewReason('');
    setPincode('');
    setArea('');
    setAdTargets([]);
    setAdContent('');
    setStep('area');
  };
  const proceed = () => {
    if (!catalog) {
      setPickError(true);
      return;
    }
    setPickError(false);
    setError('');
    if (waiting) {
      setAnotherAsk(true);
      return;
    }
    if (approved) {
      const drafts = (desk?.orders || []).filter((order) => adKind(order).key === 'draft');
      if (drafts.length) {
        setDraftAsk(true);
        return;
      }
      startNewAd();
      return;
    }
    setPackageId(catalog.id);
    setStep('verify');
  };

  if (opening) {
    return (
      <ConsolePage title="Promote online" subtitle="Checking your application" onBack={back} docked refreshing={pulling} onRefresh={() => { setPulling(true); void load(false).finally(() => setPulling(false)); }}>
        <View style={styles.opening}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      </ConsolePage>
    );
  }

  return (
    <ConsolePage title="Promote online" subtitle={step === 'offer' ? 'Choose a package' : step === 'custom' ? 'Custom plan' : step === 'verify' ? 'Certificate and selfie' : step === 'track' ? 'Application status' : step === 'appPlan' ? 'This application' : step === 'area' ? (newAd || !orderId ? 'About this ad' : 'Where the ads run') : step === 'video' ? 'Promotional video' : step === 'review' ? 'Ad check' : step === 'pay' ? 'Pay for this package' : 'Payment received'} scrollToken={step} onBack={goBack} docked refreshing={pulling} onRefresh={() => { setPulling(true); void load(false).finally(() => setPulling(false)); }}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {step === 'offer' ? (
        <>
          {showMyAds ? (
            <View style={styles.myAds}>
              <Text style={styles.myAdsTitle}>My Ads</Text>
              {waiting ? (
                <Pressable
                  onPress={() => setStep('track')}
                  accessibilityRole="button"
                  accessibilityLabel="Active application. FinderB is checking."
                  style={({ pressed }) => [styles.appBanner, pressed && styles.appBannerPressed]}
                >
                  <Ionicons name="time" size={16} color={c.brand} />
                  <View style={styles.appBannerCopy}>
                    <Text style={styles.appBannerTitle}>Active application</Text>
                    <Text style={styles.appBannerMeta} numberOfLines={2}>
                      {`FinderB is checking · ${expectedBy(desk?.verification.submittedAt)}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.muted} />
                </Pressable>
              ) : null}
              {approved && ads.length === 0 ? (
                <Pressable
                  onPress={openApplication}
                  accessibilityRole="button"
                  accessibilityLabel="Business Verified. Open this application."
                  style={({ pressed }) => [styles.appBanner, pressed && styles.appBannerPressed]}
                >
                  <Ionicons name="checkmark-circle" size={16} color={c.success} />
                  <View style={styles.appBannerCopy}>
                    <Text style={styles.appBannerTitle}>Business Verified</Text>
                    <Text style={styles.appBannerMeta} numberOfLines={2}>Open it to finish this application</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={c.muted} />
                </Pressable>
              ) : null}
              {ads.map((order) => {
                const kind = adKind(order);
                return (
                  <Pressable
                    key={order.id}
                    onPress={() => kind.key === 'draft' ? openOrder(order) : router.push(`/business-console/promotion/${order.id}` as Href)}
                    accessibilityRole="button"
                    accessibilityLabel={`${order.packageName}. ${kind.label}. ${kind.percent}% completed.${kind.key === 'draft' ? ' Tap to continue.' : ''}`}
                    style={({ pressed }) => [styles.appBanner, pressed && styles.appBannerPressed]}
                  >
                    <ProgressPie percent={kind.percent} color={kind.color} />
                    <View style={styles.appBannerCopy}>
                      <Text style={styles.appBannerTitle}>{order.packageName}</Text>
                      <Text style={styles.appBannerMeta} numberOfLines={2}>
                        {kind.key === 'draft' ? `${kind.label} · Tap to continue` : kind.label}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={c.muted} />
                  </Pressable>
                );
              })}
              <View style={styles.myAdsRule} />
            </View>
          ) : null}
          <View style={styles.intro}>
            <Text style={styles.introKicker}>Facebook and Instagram. We run the ads.</Text>
            <Text style={styles.introTitle}>They live around this shop. They still don't know it.</Text>
            <Text style={styles.introBody}>
              A person two kilometres away will not walk in if they have never seen you. They are already scrolling. You pick the area and the days. FinderB makes the ad, puts it in front of them, and brings the reach, views, and visits back here.
            </Text>
          </View>
          <View style={styles.planStack}>
            {packages.map((item) => (
              <PlanCard key={item.id} item={item} selected={item.id === catalogId} onPress={() => { setCatalogId(item.id); setPickError(false); }} />
            ))}
          </View>
          <Text style={styles.planFine}>Package reach is an estimate, not a promise. Ads start after the shop is verified, FinderB approves the ad, and payment is confirmed.</Text>
          {pickError ? <Text style={styles.error}>Select a plan to continue.</Text> : null}
          <Pressable
            onPress={proceed}
            accessibilityRole="button"
            style={({ pressed }) => [styles.continueBtn, pressed && styles.continuePressed]}
          >
            <Text style={styles.continueText}>{catalog ? `Continue with ${catalog.name}` : 'Continue'}</Text>
          </Pressable>
          {desk?.customRequest && ['received', 'in_review'].includes(desk.customRequest.status) ? (
            <Panel>
              <Text style={styles.h}>Custom plan sent</Text>
              <Text style={styles.p}>Request {desk.customRequest.id}. It will take up to 24 hours. FinderB will come back with a price for your shop.</Text>
            </Panel>
          ) : (
            <Btn tone="outline" label="Ask for a custom plan" onPress={() => { setError(''); setStep('custom'); }} />
          )}
          <Text style={styles.sectionTitle}>What you get</Text>
          <WhyPromote />
        </>
      ) : null}
      {step === 'custom' ? (
        <Panel>
          {customSent ? (
            <>
              <Text style={styles.h}>Custom plan sent</Text>
              <Text style={styles.p}>Request {customSent}. It will take up to 24 hours. FinderB will come back with a price for your shop.</Text>
              <Btn label="Back to packages" onPress={() => setStep('offer')} />
            </>
          ) : (
            <>
              <Text style={styles.h}>Tell FinderB what you need</Text>
              <Text style={styles.p}>This is not a payment. FinderB reads it and replies within 24 hours.</Text>
              <View style={styles.customForm}>
                <Field
                  boxed
                  label="Budget you can spend"
                  prefix="₹"
                  value={budget}
                  onChangeText={(value) => {
                    setBudget(value.replace(/[^\d]/g, '').slice(0, 7));
                    clearCustomError('budget');
                  }}
                  keyboardType="number-pad"
                  placeholder="5,000"
                  placeholderTextColor={placeholderTint}
                  error={customErrors.budget}
                />
                <View style={styles.fieldBlock}>
                  <Text style={styles.coverLabel}>How many days</Text>
                  <View style={styles.chipRow}>
                    {DAY_PRESETS.map((day) => (
                      <Chip
                        key={day}
                        small
                        label={`${day}`}
                        active={customDays === String(day)}
                        onPress={() => {
                          setCustomDays(String(day));
                          clearCustomError('days');
                        }}
                      />
                    ))}
                  </View>
                  <Field
                    boxed
                    label="Or type a number"
                    value={customDays}
                    onChangeText={(value) => {
                      setCustomDays(value.replace(/[^\d]/g, '').slice(0, 2));
                      clearCustomError('days');
                    }}
                    keyboardType="number-pad"
                    placeholder="7"
                    placeholderTextColor={placeholderTint}
                    error={customErrors.days}
                  />
                </View>
                <View style={styles.fieldBlock}>
                  <Text style={styles.coverLabel}>How far the ads should go</Text>
                  <View style={styles.chipRow}>
                    {COVERAGE_PRESETS.map((item) => (
                      <Chip
                        key={item}
                        small
                        label={item}
                        active={!coverageOther && coverage === item}
                        onPress={() => {
                          setCoverageOther(false);
                          setCoverage(item);
                          clearCustomError('coverage');
                        }}
                      />
                    ))}
                    <Chip
                      small
                      label={COVERAGE_OTHER}
                      active={coverageOther}
                      onPress={() => {
                        setCoverageOther(true);
                        setCoverage('');
                        clearCustomError('coverage');
                      }}
                    />
                  </View>
                  {coverageOther ? (
                    <Field
                      boxed
                      label="Describe the area"
                      value={coverage}
                      onChangeText={(value) => {
                        setCoverage(value);
                        clearCustomError('coverage');
                      }}
                      placeholder="20 km around the shop, or two neighbouring cities"
                      placeholderTextColor={placeholderTint}
                      error={customErrors.coverage}
                    />
                  ) : customErrors.coverage ? (
                    <Text style={styles.error}>{customErrors.coverage}</Text>
                  ) : null}
                </View>
                <View style={styles.pickRow}>
                  <View style={styles.pickCol}>
                    <BoxedPick
                      label="State"
                      value={customState}
                      placeholder="Choose state"
                      error={customErrors.state}
                      onPress={() => setPlaceMenu('state')}
                    />
                  </View>
                  <View style={styles.pickCol}>
                    <BoxedPick
                      label="City"
                      value={customCity}
                      placeholder={customState ? 'Choose city' : 'State first'}
                      error={customErrors.city}
                      disabled={!customState}
                      onPress={() => customState && setPlaceMenu('city')}
                    />
                  </View>
                </View>
                <Field
                  boxed
                  label="Locality"
                  value={customArea}
                  onChangeText={(value) => {
                    setCustomArea(value);
                    clearCustomError('area');
                  }}
                  placeholder="Andheri West"
                  placeholderTextColor={placeholderTint}
                  error={customErrors.area}
                />
                <Field
                  boxed
                  label="Pincode"
                  value={customPin}
                  onChangeText={(value) => {
                    setCustomPin(value.replace(/[^\d]/g, '').slice(0, 6));
                    clearCustomError('pin');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholder="400001"
                  placeholderTextColor={placeholderTint}
                  error={customErrors.pin}
                />
                <Field
                  boxed
                  multiline
                  label="What should the ad promote"
                  value={goal}
                  onChangeText={(value) => {
                    setGoal(value);
                    clearCustomError('goal');
                  }}
                  placeholder="Monsoon sale on cotton kurtas"
                  placeholderTextColor={placeholderTint}
                  error={customErrors.goal}
                />
                <Field
                  boxed
                  label="Mobile number on the ad"
                  prefix="+91"
                  value={phone}
                  onChangeText={(value) => {
                    setPhone(mobileInputDigits(value, phone));
                    clearCustomError('phone');
                  }}
                  keyboardType="phone-pad"
                  placeholder="98XXXXXXXX"
                  placeholderTextColor={placeholderTint}
                  error={customErrors.phone}
                />
                <Field
                  boxed
                  multiline
                  label="Anything else"
                  value={customNote}
                  onChangeText={setCustomNote}
                  placeholder="Optional — timings, offer, or anything FinderB should know"
                  placeholderTextColor={placeholderTint}
                />
                <Btn label="Send to FinderB" busy={busy} onPress={() => void sendCustom()} style={styles.sendBtn} />
              </View>
              {placeMenu ? (
                <PlaceSheet
                  key={placeMenu}
                  visible
                  title={placeMenu === 'state' ? 'Choose state' : `City in ${customState}`}
                  options={placeMenu === 'state' ? INDIAN_STATES : citiesInState(customState)}
                  onClose={() => setPlaceMenu(null)}
                  onPick={(value) => {
                    if (placeMenu === 'state') {
                      if (value !== customState) {
                        setCustomState(value);
                        setCustomCity('');
                      }
                      clearCustomError('state');
                    } else {
                      setCustomCity(value);
                      clearCustomError('city');
                    }
                    setPlaceMenu(null);
                  }}
                />
              ) : null}
            </>
          )}
        </Panel>
      ) : null}
      {step === 'verify' ? (
        <View style={styles.verify}>
          <View style={styles.verifyHero}>
            <Image source={require('../../assets/console/verify.png')} style={styles.verifyArt} contentFit="contain" />
            <View style={styles.whyCopy}>
              <Text style={styles.h}>Two live photos</Text>
              <Text style={styles.p}>First photograph the certificate so the name and number are readable. Then the front camera opens for a selfie. Both stay on the live camera. A saved gallery photo is not used.</Text>
              <View style={styles.statusPill}>
                <Ionicons name="shield-checkmark-outline" size={14} color={c.primary} />
                <Text style={styles.statusText}>{statusLabel(desk?.verification.status)}</Text>
              </View>
            </View>
          </View>
          {desk?.verification.rejectionReason ? <Text style={styles.error}>{desk.verification.rejectionReason}</Text> : null}
          {selected ? <Text style={styles.p}>{selected.name} · ₹{selected.priceInr.toLocaleString('en-IN')} stays selected.</Text> : null}
          {waiting ? (
            <Btn label="See application status" onPress={() => setStep('track')} />
          ) : approved ? (
            <Btn label="Open this application" onPress={openApplication} />
          ) : (
            <>
              <Text style={styles.stepLabel}>1. Certificate, then 2. selfie</Text>
              <View style={styles.docGrid}>
                {PROOFS.map((item) => {
                  const on = documentType === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setDocumentType(item.id)}
                      style={[styles.doc, on && styles.docOn]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: on }}
                    >
                      <View style={styles.docHead}>
                        <Ionicons name={on ? 'radio-button-on' : 'radio-button-off'} size={16} color={on ? c.primary : c.muted} />
                        <Text style={[styles.docTitle, on && styles.docTitleOn]}>{item.label}</Text>
                      </View>
                      <Text style={styles.docHint}>{item.hint}</Text>
                    </Pressable>
                  );
                })}
              </View>
              <Pressable onPress={() => setAgreed((value) => !value)} style={[styles.declare, agreed && styles.declareOn]}>
                <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={18} color={agreed ? c.primary : c.muted} />
                <Text style={styles.declareText}>{DECLARATION}</Text>
              </Pressable>
              <Btn
                small
                busy={busy}
                label={
                  phase === 'certificate' ? 'Photograph the certificate…'
                  : phase === 'selfie' ? 'Take the selfie…'
                  : phase === 'location' ? 'Confirming location…'
                  : phase === 'upload' ? 'Sending…'
                  : 'Open the camera'
                }
                disabled={!agreed || busy}
                onPress={() => void verify()}
              />
              <Text style={styles.photoHint}>The back camera opens for the certificate. The front camera then opens for your face. Do not pick a photo from the gallery.</Text>
            </>
          )}
        </View>
      ) : null}
      {step === 'track' ? (
        <View style={styles.trackWrap}>
          <Panel>
            <ApplicationTrack
              status={desk?.verification.status}
              sentAt={desk?.verification.submittedAt}
              reviewedAt={desk?.verification.reviewedAt}
              reason={desk?.verification.rejectionReason}
              videoReady={videoReady}
              paid={(desk?.orders || []).some((item) => item.paymentStatus === 'paid')}
              campaign={(desk?.orders || []).find((item) => item.paymentStatus === 'paid')?.campaignStatus}
            />
            {desk?.verification.status === 'rejected' || desk?.verification.status === 'resubmission_required' ? (
              <Btn label="Send the photos again" onPress={() => setStep('verify')} />
            ) : null}
            {approved ? (
              <Btn
                label={orderId ? (videoReady ? 'Continue to payment' : 'Continue to video') : 'Choose the package'}
                onPress={continueApplication}
              />
            ) : null}
          </Panel>
          <Text style={styles.trackLeave}>
            {waiting ? 'You can leave this screen. Opening Promote your business online brings this status back.\n' : ''}
            For any issues or doubt, write to{' '}
            <Text style={styles.trackMail} onPress={() => void Linking.openURL('mailto:support@finderb.com')}>
              support@finderb.com
            </Text>
          </Text>
        </View>
      ) : null}
      {step === 'appPlan' ? (
        <>
          <Text style={styles.h}>Package for this application</Text>
          <Text style={styles.p}>This choice stays with the application FinderB approved. The packages on the previous screen start a new ad.</Text>
          <View style={styles.planStack}>
            {packages.map((item) => (
              <PlanCard key={item.id} item={item} selected={item.id === packageId} onPress={() => { setPackageId(item.id); setPickError(false); }} />
            ))}
          </View>
          {pickError ? <Text style={styles.error}>Select a plan to continue this application.</Text> : null}
          <Pressable
            onPress={() => {
              if (!selected) {
                setPickError(true);
                return;
              }
              setPickError(false);
              setStep('area');
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.continueBtn, pressed && styles.continuePressed]}
          >
            <Text style={styles.continueText}>{selected ? `Continue with ${selected.name}` : 'Continue'}</Text>
          </Pressable>
        </>
      ) : null}
      {step === 'area' && selected ? (
        <Panel>
          <Text style={styles.h}>{selected.name}</Text>
          <Text style={styles.p}>₹{selected.priceInr.toLocaleString('en-IN')} · {selected.durationDays} days · {selected.coverage}</Text>
          {!newAd && orderId ? <Text style={styles.p}>Order {orderId}</Text> : null}
          {newAd || !orderId ? (
            <View style={styles.composer}>
              <Text style={styles.p}>Tell FinderB the target of this ad, what it should say, and where the shop is.</Text>
              <PickField label="Target of the ad" value={adTargets.join(', ')} placeholder="Choose up to 3" onPress={() => { setTargetNote(''); setTargetOpen(true); }} />
              <Field
                boxed
                multiline
                label="Ad content"
                value={adContent}
                onChangeText={setAdContent}
                placeholder="What should people read in the ad"
                maxLength={400}
              />
              <Field boxed label="Shop locality" value={area} onChangeText={setArea} placeholder="Sector, colony, or market" maxLength={120} />
              <Field boxed label="Pincode" value={pincode} onChangeText={setPincode} placeholder="6-digit pincode" keyboardType="number-pad" maxLength={6} />
            </View>
          ) : (
            <>
              {adTargets.length ? <Text style={styles.p}>{adTargets.join(', ')}</Text> : null}
              {adContent ? <Text style={styles.p}>{adContent}</Text> : null}
              <Text style={styles.p}>{[area, pincode].filter(Boolean).join(', ')}</Text>
            </>
          )}
          <Btn
            label="Continue"
            busy={busy}
            onPress={() => {
              if (newAdRef.current || newAd || !orderId) void create();
              else setStep(!videoReady ? 'video' : adReview === 'approved' ? 'pay' : 'review');
            }}
          />
        </Panel>
      ) : null}
      {step === 'video' ? (
        <Panel>
          <Text style={styles.h}>Promotional video</Text>
          {orderId ? <Text style={styles.p}>Order {orderId}</Text> : null}
          <View style={styles.videoRules}>
            {[
              'Choose the video from your gallery.',
              'MP4 or MOV.',
              'Vertical, about 9:16.',
              '15 to 45 seconds.',
              '60 MB or smaller.',
            ].map((rule, index) => (
              <View key={rule} style={styles.videoRule}>
                <View style={styles.videoIndex}>
                  <Text style={styles.videoIndexText}>{index + 1}</Text>
                </View>
                <Text style={styles.videoRuleText}>{rule}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.p}>After this video is saved, FinderB checks the ad before payment.</Text>
          {uploadProgress > 0 && uploadProgress < 100 ? <Text style={styles.p}>Uploading {uploadProgress}%</Text> : null}
          <Btn
            label={busy ? `Uploading ${uploadProgress}%` : 'Choose from gallery'}
            busy={busy}
            onPress={() => void video()}
            style={styles.videoBtn}
          />
        </Panel>
      ) : null}
      {step === 'review' ? (
        <Panel>
          <Text style={styles.h}>{adReview === 'denied' ? 'This ad needs a change' : adReview === 'approved' ? 'This ad is approved' : 'This ad is with FinderB'}</Text>
          {orderId ? <Text style={styles.p}>Order {orderId}</Text> : null}
          {adReview === 'denied' ? (
            <Text style={styles.p}>{adReviewReason || 'FinderB needs a different video or a clearer ad before payment.'}</Text>
          ) : adReview === 'approved' ? (
            <Text style={styles.p}>Payment is open for this package.</Text>
          ) : (
            <Text style={styles.p}>Payment opens after the ad and the video are approved.</Text>
          )}
          {adReview === 'approved' ? (
            <Btn label="Continue to payment" onPress={() => setStep('pay')} />
          ) : (
            <Btn label="Choose another video" onPress={() => setStep('video')} />
          )}
        </Panel>
      ) : null}
      {step === 'pay' && selected ? (
        <Panel>
          <Text style={styles.h}>{selected.name}</Text>
          <Text style={styles.p}>₹{selected.priceInr.toLocaleString('en-IN')} · {selected.durationDays} days · {selected.coverage}</Text>
          <Text style={styles.p}>Order {orderId}</Text>
          <Text style={styles.p}>{[adTargets.join(', '), area, pincode].filter(Boolean).join(' · ')}</Text>
          {adContent ? <Text style={styles.p}>{adContent}</Text> : null}
          <Btn label="Continue" busy={busy} onPress={() => void pay()} />
        </Panel>
      ) : null}
      {step === 'done' && selected ? (
        <Panel>
          <Text style={styles.h}>Payment received</Text>
          <Text style={styles.p}>{selected.name} · ₹{selected.priceInr.toLocaleString('en-IN')} · order {orderId}</Text>
          <Text style={styles.p}>FinderB has the payment. We emailed you and the FinderB team.</Text>
          <Btn label="Open this promotion" onPress={() => router.push(`/business-console/promotion/${orderId}` as Href)} />
        </Panel>
      ) : null}
      {(desk?.orders?.length || 0) > 0 ? <Btn tone="outline" label="My promotions" onPress={() => router.push('/business-console/promotions' as Href)} /> : null}
      <Sheet visible={targetOpen} title="Target of the ad" onClose={() => setTargetOpen(false)}>
        <Text style={styles.p}>Choose up to 3.</Text>
        {AD_TARGETS.map((item) => {
          const on = adTargets.includes(item);
          return (
            <Pressable
              key={item}
              onPress={() => {
                setError('');
                setAdTargets((current) => {
                  if (current.includes(item)) {
                    setTargetNote('');
                    return current.filter((value) => value !== item);
                  }
                  if (current.length >= 3) {
                    setTargetNote('You can choose up to 3.');
                    return current;
                  }
                  setTargetNote('');
                  return [...current, item];
                });
              }}
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: on }}
            >
              <Text style={styles.optionText}>{on ? '✓  ' : ''}{item}</Text>
            </Pressable>
          );
        })}
        {targetNote ? <Text style={styles.error}>{targetNote}</Text> : null}
        <Btn label="Done" onPress={() => setTargetOpen(false)} />
      </Sheet>
      <Sheet visible={draftAsk} title="You have ads in draft" onClose={() => setDraftAsk(false)}>
        <Text style={styles.p}>
          {ads.filter((order) => adKind(order).key === 'draft').length === 1
            ? 'You have 1 ad in draft. Do you still want to create a new one?'
            : `You have ${ads.filter((order) => adKind(order).key === 'draft').length} ads in draft. Do you still want to create a new one?`}
        </Text>
        <Btn label="Create new" onPress={startNewAd} />
        <Btn tone="outline" label="Not now" onPress={() => setDraftAsk(false)} />
      </Sheet>
      <Sheet visible={anotherAsk} title="You have an active application" onClose={() => setAnotherAsk(false)}>
        <Text style={styles.p}>Do you want to create another?</Text>
        <Btn label="Yes" onPress={() => { setAnotherAsk(false); setStep('verify'); }} />
        <Btn tone="outline" label="No" onPress={() => setAnotherAsk(false)} />
      </Sheet>
      <RazorpayCheckout
        start={checkout}
        description="Promote your business online"
        onClose={() => setCheckout(null)}
        onFailed={(message) => {
          setCheckout(null);
          setError(message);
        }}
        onSuccess={(paid) => {
          setCheckout(null);
          void run<{ success: true }>('confirmPromotionPay', {
            orderId,
            razorpayOrderId: paid.razorpay_order_id || checkout?.order?.id || '',
            paymentId: paid.razorpay_payment_id,
            signature: paid.razorpay_signature,
          }).then((result) => {
            if (!result.success) setError(result.error);
            else {
              notify('Payment received');
              setStep('done');
            }
          });
        }}
      />
    </ConsolePage>
  );
}

const PROOFS = [
  { id: 'gst', label: 'GST', hint: 'Certificate' },
  { id: 'udyam', label: 'Udyam', hint: 'Certificate' },
  { id: 'shop_license', label: 'Shop license', hint: 'Municipal proof' },
  { id: 'aadhaar_pan_bill', label: 'Aadhaar or PAN', hint: 'With an electricity bill' },
] as const;

function planMark(item: PackageCard): { icon: keyof typeof Ionicons.glyphMap; tint: string; soft: string; premium: boolean } {
  const key = `${item.id} ${item.name}`.toLowerCase();
  if (key.includes('mega')) return { icon: 'diamond', tint: '#F6D58A', soft: 'rgba(246,213,138,0.16)', premium: true };
  if (key.includes('growth')) return { icon: 'trending-up', tint: '#D97706', soft: 'rgba(217,119,6,0.18)', premium: false };
  return { icon: 'flash', tint: '#0284C7', soft: 'rgba(2,132,199,0.16)', premium: false };
}

function planPitch(item: PackageCard) {
  const key = `${item.id} ${item.name}`.toLowerCase();
  if (key.includes('mega')) return 'The district, for two weeks. The widest map on this page.';
  if (key.includes('growth')) return 'Your city. Ten days in front of people already scrolling.';
  return 'A short burst for the streets around the shop.';
}

function planLines(item: PackageCard) {
  const lines: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
    { icon: 'calendar-outline', text: `${item.durationDays} days of Facebook and Instagram ads` },
    { icon: 'navigate-outline', text: /city|district|regional/i.test(item.coverage) ? item.coverage : `${item.coverage} around the shop` },
  ];
  if (item.reach) lines.push({ icon: 'people-outline', text: `About ${item.reach.replace(/people$/i, '').trim()} people can see it` });
  if (item.views) lines.push({ icon: 'eye-outline', text: `${item.views.replace(/views$/i, '').trim()} video views` });
  if (item.visits) lines.push({ icon: 'storefront-outline', text: `${item.visits.replace(/profile visits$/i, '').trim()} people opening the shop` });
  return lines;
}

function PlanCard({ item, selected, onPress }: { item: PackageCard; selected: boolean; onPress: () => void }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const mark = planMark(item);
  const premium = mark.premium;
  const ink = premium ? '#F8F1DE' : c.ink;
  const rupee = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const lines = planLines(item);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={[styles.plan, premium && styles.planPremium, selected && (premium ? styles.planPremiumOn : styles.planOn)]}
    >
      {premium ? (
        <View style={styles.planCrownBar}>
          <Ionicons name="diamond" size={11} color="#1A1430" />
          <Text style={styles.planCrownText}>Premium</Text>
        </View>
      ) : null}
      {item.popular ? (
        <View style={styles.planRibbon}>
          <Ionicons name="star" size={11} color="#7C4A03" />
          <Text style={styles.planRibbonText}>Most popular</Text>
        </View>
      ) : null}
      <View style={styles.planBody}>
      <View style={styles.planHead}>
        <View style={[styles.planMark, premium && styles.planMarkPremium, { backgroundColor: mark.soft }]}>
          <Ionicons name={mark.icon} size={premium ? 22 : 20} color={mark.tint} />
        </View>
        <View style={styles.planTitles}>
          <Text style={[styles.planName, premium && styles.planNameLight]}>{item.name}</Text>
          <Text style={[styles.planMeta, premium && styles.planMetaLight]}>{planPitch(item)}</Text>
        </View>
        <Ionicons name={selected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={selected ? (premium ? '#F6D58A' : c.brand) : (premium ? 'rgba(248,241,222,0.35)' : c.faint)} />
      </View>
      <View style={styles.planPriceRow}>
        <Text style={[styles.planPrice, premium && styles.planPriceLight]}>{rupee(item.priceInr)}</Text>
        {item.referenceInr > item.priceInr ? <Text style={[styles.planWas, premium && styles.planWasLight]}>{rupee(item.referenceInr)}</Text> : null}
        {item.discountPercent > 0 ? (
          <View style={[styles.planOff, premium && styles.planOffLight]}>
            <Text style={[styles.planOffText, premium && styles.planOffTextLight]}>{item.discountPercent}% off</Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.planLines, premium && styles.planLinesPremium]}>
        {lines.map((line) => (
          <View key={line.text} style={styles.planLine}>
            <Ionicons name={line.icon} size={16} color={premium ? '#F6D58A' : mark.tint} />
            <Text style={[styles.planLineText, { color: ink }]}>{line.text}</Text>
          </View>
        ))}
      </View>
      </View>
    </Pressable>
  );
}

type TrackState = 'done' | 'current' | 'upcoming' | 'alert';

function expectedBy(sentAt?: string | null) {
  if (!sentAt) return 'Expected within 24 hours';
  const due = new Date(new Date(sentAt).getTime() + 24 * 60 * 60 * 1000);
  if (Number.isNaN(due.getTime())) return 'Expected within 24 hours';
  const label = whenStamp(due.toISOString());
  if (due.getTime() < Date.now()) return `Expected by ${label}. This is taking a little longer.`;
  return `Expected by ${label}`;
}

function applicationSteps(
  status: string | undefined,
  sentAt?: string | null,
  reviewedAt?: string | null,
  reason?: string | null,
  videoReady = false,
  paid = false,
  campaign?: string,
) {
  const change = status === 'rejected' || status === 'resubmission_required';
  const approved = status === 'approved';
  const waiting = !approved && !change;
  const stage = !approved ? -1 : !videoReady ? 0 : !paid ? 1 : 2;
  const after = (index: number): TrackState => {
    if (!approved) return 'upcoming';
    if (index < stage) return 'done';
    if (index === stage) return 'current';
    return 'upcoming';
  };
  const making: TrackState = !paid ? after(2) : campaign === 'ad_active' || campaign === 'completed' ? 'done' : 'current';
  const live: TrackState = campaign === 'completed' ? 'done' : campaign === 'ad_active' ? 'current' : 'upcoming';
  const steps: { title: string; body: string; meta: string; state: TrackState }[] = [
    {
      title: 'Application sent',
      body: 'The certificate and the selfie are with FinderB.',
      meta: sentAt ? whenStamp(sentAt) : '',
      state: 'done',
    },
    {
      title: 'FinderB verifies your business',
      body: change
        ? `The uploaded selfie, certificate, and shop location are reviewed. ${reason || 'Photograph the certificate and selfie again.'}`
        : approved
          ? 'The uploaded selfie, certificate, and shop location are reviewed. Your shop is approved, and the steps below are open.'
          : 'The uploaded selfie, certificate, and shop location are reviewed. These next steps open once FinderB approves your shop.',
      meta: waiting ? expectedBy(sentAt) : (reviewedAt ? whenStamp(reviewedAt) : ''),
      state: waiting ? 'current' : change ? 'alert' : 'done',
    },
    {
      title: 'Upload your video',
      body: 'Choose a vertical shop video from your gallery, about 9:16.',
      meta: '',
      state: after(0),
    },
    {
      title: 'Pay for the package',
      body: 'One payment covers the ads for the days you chose.',
      meta: '',
      state: after(1),
    },
    {
      title: 'FinderB designs your ad',
      body: 'Keyword research and audience targeting. Creatives in every resolution Meta serves: 1:1, 4:5, and 9:16 for Feed, Stories, and Reels. In Ads Manager we set the objective, location, placements, primary text, headline, and call to action.',
      meta: '',
      state: making,
    },
    {
      title: 'Your ads go live',
      body: 'People nearby start seeing your shop.',
      meta: '',
      state: live,
    },
  ];
  return steps;
}

function ApplicationTrack({
  status,
  sentAt,
  reviewedAt,
  reason,
  videoReady,
  paid,
  campaign,
}: {
  status?: string;
  sentAt?: string | null;
  reviewedAt?: string | null;
  reason?: string | null;
  videoReady?: boolean;
  paid?: boolean;
  campaign?: string;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  const steps = applicationSteps(status, sentAt, reviewedAt, reason, videoReady, paid, campaign);
  const arriveRef = useRef<Animated.Value[]>([]);
  if (arriveRef.current.length !== steps.length) {
    arriveRef.current = steps.map(() => new Animated.Value(0));
  }
  const arrive = arriveRef.current;
  const fill = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    arrive.forEach((value) => value.setValue(0));
    fill.setValue(0);
    const entrance = Animated.stagger(160, arrive.map((value) => (
      Animated.timing(value, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true })
    )));
    const line = Animated.timing(fill, { toValue: 1, duration: 720, delay: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false });
    Animated.parallel([entrance, line]).start();
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    beat.start();
    return () => beat.stop();
  }, [arrive, fill, pulse, status]);

  return (
    <View style={styles.track}>
      <Text style={styles.h}>Your application</Text>
      <View style={styles.trackList}>
        {steps.map((item, index) => {
          const motion = arrive[index];
          const next = steps[index + 1];
          const railColor = !next || next.state === 'upcoming' ? c.line : next.state === 'alert' ? c.danger : c.success;
          return (
            <Animated.View
              key={item.title}
              style={{
                opacity: motion,
                transform: [{ translateY: motion.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
              }}
            >
              <View style={styles.trackRow}>
                <View style={styles.trackRailCol}>
                  <TrackDot state={item.state} pulse={pulse} />
                  {next ? (
                    <View style={styles.trackRail}>
                      <Animated.View
                        style={[
                          styles.trackRailFill,
                          {
                            backgroundColor: railColor,
                            height: fill.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                          },
                        ]}
                      />
                    </View>
                  ) : null}
                </View>
                <View style={[styles.trackCopy, !next && styles.trackCopyLast]}>
                  <View style={styles.trackTitleRow}>
                    <Text style={[styles.trackTitle, item.state === 'upcoming' && styles.trackTitleWait, item.state === 'alert' && { color: c.danger }]}>{item.title}</Text>
                    {item.title === 'Your ads go live' ? <StepConfetti /> : null}
                  </View>
                  <Text style={styles.trackBody}>{item.body}</Text>
                  {item.meta ? <Text style={styles.trackMeta}>{item.meta}</Text> : null}
                </View>
              </View>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

function TrackDot({ state, pulse }: { state: TrackState; pulse: Animated.Value }) {
  const c = useConsoleColors();
  const filled = state !== 'upcoming';
  const color = state === 'done' ? c.success : state === 'alert' ? c.danger : state === 'current' ? c.brand : c.lineStrong;
  const icon = state === 'done' ? 'checkmark' : state === 'alert' ? 'warning' : 'time';
  const ring = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.7] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0] });
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
      {state === 'current' ? (
        <Animated.View
          style={{
            position: 'absolute',
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: c.brand,
            opacity: ringOpacity,
            transform: [{ scale: ring }],
          }}
        />
      ) : null}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: filled ? color : c.sunken,
          borderWidth: filled ? 0 : 1.5,
          borderColor: c.lineStrong,
        }}
      >
        {filled ? <Ionicons name={icon} size={15} color={c.isDark ? '#1C1917' : '#FFFFFF'} /> : null}
      </View>
    </View>
  );
}

const CONFETTI = [
  { left: 0, color: '#F5A623', w: 7, h: 10, drift: 6, spin: '70deg' },
  { left: 12, color: '#E11D48', w: 6, h: 6, drift: -4, spin: '-80deg' },
  { left: 22, color: '#0284C7', w: 8, h: 5, drift: 8, spin: '110deg' },
  { left: 34, color: '#16A34A', w: 5, h: 9, drift: -8, spin: '-50deg' },
  { left: 44, color: '#7C3AED', w: 6, h: 6, drift: 3, spin: '90deg' },
  { left: 54, color: '#FB7185', w: 5, h: 8, drift: 10, spin: '140deg' },
  { left: 64, color: '#FBBF24', w: 7, h: 4, drift: -2, spin: '-30deg' },
  { left: 18, color: '#F97316', w: 4, h: 8, drift: 12, spin: '60deg' },
  { left: 40, color: '#38BDF8', w: 5, h: 5, drift: -12, spin: '-110deg' },
  { left: 8, color: '#A3E635', w: 6, h: 4, drift: 5, spin: '40deg' },
];

function StepConfetti() {
  const pieces = useRef(CONFETTI.map(() => new Animated.Value(0))).current;
  useEffect(() => {
    const loops = pieces.map((value, index) => {
      const burst = Animated.loop(
        Animated.sequence([
          Animated.delay(index * 90),
          Animated.timing(value, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(value, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );
      burst.start();
      return burst;
    });
    return () => loops.forEach((burst) => burst.stop());
  }, [pieces]);
  return (
    <View pointerEvents="none" style={{ width: 78, height: 18, overflow: 'visible' }}>
      {CONFETTI.map((bit, index) => {
        const value = pieces[index];
        return (
          <Animated.View
            key={`${bit.color}-${bit.left}`}
            style={{
              position: 'absolute',
              left: bit.left,
              bottom: 0,
              width: bit.w,
              height: bit.h,
              borderRadius: 1,
              backgroundColor: bit.color,
              opacity: value.interpolate({ inputRange: [0, 0.08, 0.7, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: value.interpolate({ inputRange: [0, 1], outputRange: [2, -12] }) },
                { translateX: value.interpolate({ inputRange: [0, 1], outputRange: [0, bit.drift] }) },
                { rotate: value.interpolate({ inputRange: [0, 1], outputRange: ['0deg', bit.spin] }) },
              ],
            }}
          />
        );
      })}
    </View>
  );
}

function statusLabel(status?: string) {
  switch (status) {
    case 'submitted':
      return 'Sent to FinderB';
    case 'under_review':
      return 'FinderB is checking';
    case 'rejected':
      return 'Needs a change';
    case 'resubmission_required':
      return 'Send it again';
    case 'approved':
      return 'Approved';
    default:
      return 'Not sent yet';
  }
}

const WHY = [
  {
    image: require('../../assets/console/promo-run.png'),
    title: 'FinderB runs it for you',
    body: 'You skip Ads Manager. Choose the days and how far the ads go. FinderB makes the ad, runs it, and brings the recorded reach, views, and visits back here.',
  },
  {
    image: require('../../assets/console/promo-area.png'),
    title: 'You choose how far',
    body: 'A few kilometres around the shop, or the wider city. You name the area. You do not build an audience yourself.',
  },
  {
    image: require('../../assets/console/promo-price.png'),
    title: 'One price, nothing to top up',
    body: 'You pay the package price, GST included. There is no ads account to keep adding money to.',
  },
  {
    image: require('../../assets/console/promo-video.png'),
    title: 'The shop video is prepared',
    body: 'You send a short video of the shop. FinderB edits it and marks it ready before the ad goes out.',
  },
  {
    image: require('../../assets/console/promo-scroll.png'),
    title: 'They find your shop while scrolling',
    body: 'People nearby are already on Facebook and Instagram. Your ad appears there, in the area you choose.',
    channels: true,
  },
  {
    image: require('../../assets/console/leads.png'),
    title: 'Then the phone starts ringing',
    body: 'A clear ad turns that scroll into a call, a message, or a visit to your counter.',
  },
  {
    image: require('../../assets/console/promo-report.png'),
    title: 'You see what it actually did',
    body: 'When it ends, the reach, views, and visits we recorded show in FinderB. Package numbers before that are only a guide.',
  },
];

function WhyPromote() {
  const styles = useStyles();
  return (
    <View style={styles.why}>
      {WHY.map((story) => (
        <View key={story.title} style={styles.whyCard}>
          <Image source={story.image} style={styles.whyArt} contentFit="contain" />
          <View style={styles.whyCopy}>
            <Text style={styles.h}>{story.title}</Text>
            {'channels' in story ? (
              <View style={styles.channels}>
                <Ionicons name="logo-facebook" size={15} color="#1877F2" />
                <Ionicons name="logo-instagram" size={15} color="#E1306C" />
              </View>
            ) : null}
            <Text style={styles.p}>{story.body}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  h: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  p: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body, flexShrink: 1 },
  note: { marginTop: 8, fontFamily: fonts.regular, fontSize: 12, lineHeight: 17, color: c.muted },
  why: { gap: 10 },
  whyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
  },
  whyArt: { width: 92, height: 92 },
  whyCopy: { flex: 1, minWidth: 0 },
  channels: { flexDirection: 'row', gap: 8, marginTop: 6 },
  sectionTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink, marginTop: 6 },
  verify: {
    gap: 10,
    padding: 14,
    borderRadius: 16,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
  },
  verifyHero: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifyArt: { width: 92, height: 92 },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: c.sunken,
  },
  statusText: { fontFamily: fonts.semiBold, fontSize: 12, color: c.ink },
  stepLabel: { fontFamily: fonts.semiBold, fontSize: 15, color: c.ink },
  docGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  doc: {
    width: '48%',
    flexGrow: 1,
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.page,
  },
  docOn: { borderColor: c.ink, backgroundColor: c.sunken },
  docHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docTitle: { fontFamily: fonts.semiBold, fontSize: 14, color: c.ink },
  docTitleOn: { color: c.primary },
  docHint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.muted },
  declare: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: c.line,
    backgroundColor: c.page,
  },
  declareOn: { borderColor: c.ink, backgroundColor: c.sunken },
  declareText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body },
  photoHint: { fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.muted },
  composer: { gap: 12, marginTop: 8 },
  myAds: { gap: 10 },
  myAdsTitle: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  myAdsRule: { height: 1, backgroundColor: c.lineStrong, marginTop: 4 },
  appBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: c.brandSoft,
    borderWidth: 1,
    borderColor: c.line,
  },
  appBannerPressed: { opacity: 0.86 },
  appBannerCopy: { flex: 1, minWidth: 0 },
  appBannerTitle: { fontFamily: fonts.semiBold, fontSize: 14, lineHeight: 18, color: c.ink },
  appBannerMeta: { marginTop: 1, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.body },
  trackWrap: { gap: 8 },
  trackLeave: { paddingHorizontal: 4, fontFamily: fonts.regular, fontSize: 12, lineHeight: 16, color: c.muted },
  track: { gap: 4 },
  trackList: { marginTop: 16 },
  trackRow: { flexDirection: 'row', gap: 12 },
  trackRailCol: { width: 28, alignItems: 'center' },
  trackRail: { width: 2, flex: 1, minHeight: 28, marginTop: 4, borderRadius: 1, backgroundColor: c.line, overflow: 'hidden' },
  trackRailFill: { width: 2, borderRadius: 1 },
  trackCopy: { flex: 1, minWidth: 0, paddingBottom: 18 },
  trackCopyLast: { paddingBottom: 4 },
  trackTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, overflow: 'visible' },
  trackTitle: { fontFamily: fonts.semiBold, fontSize: 15, lineHeight: 20, color: c.ink },
  trackTitleWait: { color: c.muted },
  trackBody: { marginTop: 2, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body },
  trackMeta: { marginTop: 3, fontFamily: fonts.medium, fontSize: 12, lineHeight: 16, color: c.muted },
  trackMail: { fontFamily: fonts.medium, color: c.ink, textDecorationLine: 'underline' },
  opening: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  videoRules: { gap: 10, marginTop: 12, marginBottom: 18 },
  videoRule: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  videoIndex: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primary,
  },
  videoIndexText: { fontFamily: fonts.semiBold, fontSize: 12, color: c.primaryInk },
  videoRuleText: { flex: 1, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, color: c.ink },
  videoBtn: { marginTop: 6 },
  error: { fontFamily: fonts.regular, fontSize: 13, color: c.danger },
  intro: { gap: 6, paddingHorizontal: 2, paddingBottom: 4 },
  introKicker: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  introTitle: { fontFamily: fonts.regular, fontSize: 22, lineHeight: 28, color: c.ink },
  introBody: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: c.body },
  continueBtn: {
    minHeight: 48,
    borderRadius: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C2410C',
  },
  continuePressed: { opacity: 0.88 },
  continueText: { fontFamily: fonts.regular, fontSize: 15, color: '#FFFFFF' },
  planStack: { gap: 12 },
  plan: {
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: c.line,
    backgroundColor: c.card,
    overflow: 'hidden',
  },
  planOn: { borderColor: c.brand, backgroundColor: c.brandSoft },
  planPremium: { backgroundColor: '#1A1430', borderColor: '#6B5424' },
  planPremiumOn: { borderColor: '#F6D58A' },
  planCrownBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    backgroundColor: '#F6D58A',
  },
  planCrownText: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.8, color: '#1A1430' },
  planNameLight: { color: '#F8F1DE' },
  planMetaLight: { color: 'rgba(248,241,222,0.68)' },
  planMarkPremium: { borderWidth: 1, borderColor: 'rgba(246,213,138,0.45)' },
  planPriceLight: { color: '#FFFFFF' },
  planWasLight: { color: 'rgba(248,241,222,0.55)' },
  planOffLight: { backgroundColor: '#F6D58A' },
  planOffTextLight: { color: '#1A1430' },
  planFactLight: { backgroundColor: 'rgba(255,255,255,0.08)' },
  planBody: { gap: 12, padding: 14 },
  planRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    backgroundColor: '#FBBF24',
  },
  planRibbonText: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.3, color: '#7C4A03' },
  planHead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  planMark: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  planTitles: { flex: 1, minWidth: 0 },
  planName: { fontFamily: fonts.bold, fontSize: 17, color: c.ink },
  planMeta: { marginTop: 2, fontFamily: fonts.medium, fontSize: 12, color: c.muted },
  planPriceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  planPrice: { fontFamily: fonts.extraBold, fontSize: 28, letterSpacing: -0.6, color: c.ink },
  planWas: { fontFamily: fonts.medium, fontSize: 16, color: c.muted, textDecorationLine: 'line-through' },
  planOff: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: c.successSoft },
  planOffText: { fontFamily: fonts.semiBold, fontSize: 12, color: c.success },
  planLines: { gap: 8, padding: 10, borderRadius: 12, backgroundColor: c.sunken },
  planLinesPremium: { backgroundColor: 'rgba(255,255,255,0.08)' },
  planLine: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  planLineText: { flex: 1, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  planFine: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: c.muted },
  input: { marginTop: 8, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 10, color: c.ink, fontFamily: fonts.regular },
  customForm: { gap: 14, marginTop: 8 },
  fieldBlock: { gap: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  coverLabel: { fontFamily: fonts.medium, fontSize: 13, color: c.ink },
  pickRow: { flexDirection: 'row', gap: 10 },
  pickCol: { flex: 1, minWidth: 0 },
  boxedPick: {
    borderWidth: 1,
    borderColor: c.lineStrong,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: c.page,
    gap: 2,
  },
  boxedPickOff: { opacity: 0.45 },
  boxedPickLabel: { fontFamily: fonts.regular, fontSize: 13, color: c.muted },
  boxedPickBtn: { flexDirection: 'row', alignItems: 'center', minHeight: 36, gap: 8 },
  boxedPickValue: { flex: 1, fontFamily: fonts.regular, fontSize: 16, color: c.ink },
  sendBtn: { marginTop: 8 },
  option: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.line },
  optionPressed: { opacity: 0.7 },
  optionText: { fontFamily: fonts.regular, fontSize: 16, color: c.ink },
}));

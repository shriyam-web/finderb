import { useEffect, useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { getStoredToken } from '../../lib/session';
import { SITE_URL } from '../../lib/supabase';
import { Btn, ConsolePage, Panel, createConsoleStyles, useTabBack } from '../../components/console/kit';
import { RazorpayCheckout } from '../../components/console/RazorpayCheckout';
import type { CheckoutStart } from '../../lib/merchantConsoleApi';

type PackageCard = {
  id: string;
  name: string;
  durationDays: number;
  coverage: string;
  priceInr: number;
  referenceInr: number;
  discountPercent: number;
  reach: string;
  popular: boolean;
  estimateNote: string;
};

type Desk = {
  success: true;
  verification: { status: string; rejectionReason: string | null };
  packages: PackageCard[];
};

const DECLARATION =
  'I confirm this shop is real and the services I list are the ones I actually offer. Any payment or advance a customer gives me is my own responsibility. FinderB only helps people discover my business and does not take part in those payments.';

type ShopShot = { uri: string; name: string; type: string; file?: File };

function takeShopPhoto(): Promise<ShopShot | null> {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.setAttribute('capture', 'environment');
      input.style.display = 'none';
      const done = (shot: ShopShot | null) => {
        input.remove();
        resolve(shot);
      };
      let settled = false;
      const finish = (shot: ShopShot | null) => {
        if (settled) return;
        settled = true;
        done(shot);
      };
      input.addEventListener('cancel', () => finish(null));
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (!file) return finish(null);
        finish({ uri: URL.createObjectURL(file), name: file.name || 'shop.jpg', type: file.type || 'image/jpeg', file });
      });
      window.addEventListener('focus', () => {
        window.setTimeout(() => {
          if (!input.files?.length) finish(null);
        }, 400);
      }, { once: true });
      document.body.appendChild(input);
      input.click();
    });
  }
  return ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 }).then((shot) => {
    const asset = shot.canceled ? null : shot.assets?.[0];
    if (!asset) return null;
    return { uri: asset.uri, name: 'shop.jpg', type: asset.mimeType || 'image/jpeg' };
  });
}

async function uploadForm(path: string, form: FormData) {
  const token = await getStoredToken();
  const response = await fetch(`${SITE_URL}${path}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });
  return (await response.json()) as { success?: boolean; error?: string };
}

export default function PromoteScreen() {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const back = useTabBack();
  const { run, notify } = useMerchantConsole();
  const [desk, setDesk] = useState<Desk | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [packageId, setPackageId] = useState('growth');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [orderId, setOrderId] = useState('');
  const [checkout, setCheckout] = useState<CheckoutStart | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [documentType, setDocumentType] = useState('gst');
  const [uploadProgress, setUploadProgress] = useState(0);

  const load = async () => {
    const result = await run<Desk>('promotions');
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDesk(result);
  };

  useEffect(() => {
    void load();
  }, []);

  const verify = async () => {
    setBusy(true);
    setError('');
    if (Platform.OS !== 'web') {
      const camera = await ImagePicker.getCameraPermissionsAsync();
      if (!camera.granted) await ImagePicker.requestCameraPermissionsAsync();
    }
    const shot = await takeShopPhoto();
    if (!shot) {
      setBusy(false);
      return;
    }
    const place = await Location.requestForegroundPermissionsAsync();
    if (!place.granted) {
      setBusy(false);
      setError('Turn on location so FinderB can confirm this shop.');
      return;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const docs = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (docs.canceled || !docs.assets[0]) {
      setBusy(false);
      setError('Choose the GST, Udyam, shop license, or identity document.');
      return;
    }
    const form = new FormData();
    form.append('shopPhoto', shot.file || ({ uri: shot.uri, name: shot.name, type: shot.type } as unknown as Blob));
    form.append('documents', { uri: docs.assets[0].uri, name: 'document.jpg', type: 'image/jpeg' } as unknown as Blob);
    form.append('documentType', documentType);
    form.append('latitude', String(position.coords.latitude));
    form.append('longitude', String(position.coords.longitude));
    form.append('accuracy', String(position.coords.accuracy || ''));
    form.append('declaration', agreed ? 'yes' : '');
    const body = await uploadForm('/api/business/promotions/verification', form);
    setBusy(false);
    if (!body.success) {
      const message = body.error || 'Verification could not be sent.';
      setError(/CLOUDINARY|API_SECRET|API_KEY/i.test(message) ? 'Verification could not be sent. Try again.' : message);
      return;
    }
    notify('Verification sent for review');
    await load();
  };

  const create = async () => {
    setBusy(true);
    setError('');
    const result = await run<{ success: true; orderId: string }>('createPromotion', { packageId, pincode, area });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOrderId(result.orderId);
  };

  const video = async () => {
    const picked = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['videos'], videoMaxDuration: 45 });
    if (picked.canceled || !picked.assets[0]) return;
    setBusy(true);
    setUploadProgress(0);
    const token = await getStoredToken();
    const form = new FormData();
    form.append('orderId', orderId);
    form.append('video', { uri: picked.assets[0].uri, name: 'promo.mp4', type: 'video/mp4' } as unknown as Blob);
    const body = await new Promise<{ success?: boolean; error?: string }>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${SITE_URL}/api/business/promotions/video`);
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
      };
      xhr.onerror = () => resolve({ success: false, error: 'The video upload was interrupted.' });
      xhr.onload = () => {
        try { resolve(JSON.parse(xhr.responseText)); }
        catch { resolve({ success: false, error: 'The video could not be uploaded.' }); }
      };
      xhr.send(form);
    });
    setBusy(false);
    if (!body.success) setError(body.error || 'The video could not be uploaded.');
    else notify('Video received');
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

  return (
    <ConsolePage title="Promote online" subtitle="Ads that bring people to your shop" onBack={back} docked>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!approved ? (
        <View style={styles.verify}>
          <View style={styles.verifyHero}>
            <Image source={require('../../assets/console/verify.png')} style={styles.verifyArt} contentFit="contain" />
            <View style={styles.whyCopy}>
              <Text style={styles.h}>Verify the shop first</Text>
              <Text style={styles.p}>A live shop photo and one proof. Then FinderB can run the ads.</Text>
              <View style={styles.statusPill}>
                <Ionicons name="shield-checkmark-outline" size={14} color={c.primary} />
                <Text style={styles.statusText}>{statusLabel(desk?.verification.status)}</Text>
              </View>
            </View>
          </View>
          {desk?.verification.rejectionReason ? <Text style={styles.error}>{desk.verification.rejectionReason}</Text> : null}
          <Text style={styles.stepLabel}>Choose one proof</Text>
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
          <Btn small label={busy ? 'Working…' : 'Take Shop Photo'} disabled={!agreed || busy} onPress={() => void verify()} />
          <Text style={styles.photoHint}>Live camera only. A gallery photo is not accepted.</Text>
        </View>
      ) : (
        <>
          {(desk?.packages || []).map((item) => (
            <Pressable key={item.id} onPress={() => setPackageId(item.id)} style={[styles.pack, packageId === item.id && styles.packOn]}>
              <Text style={styles.h}>{item.name}{item.popular ? ' · Most popular' : ''}</Text>
              <Text style={styles.p}>₹{item.priceInr.toLocaleString('en-IN')} · was ₹{item.referenceInr.toLocaleString('en-IN')} · {item.discountPercent}% off</Text>
              <Text style={styles.p}>{item.durationDays} days · {item.coverage} · est. {item.reach}</Text>
              <Text style={styles.note}>{item.estimateNote}</Text>
            </Pressable>
          ))}
          <Panel>
            <Text style={styles.h}>Target area</Text>
            <TextInput value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" maxLength={6} style={styles.input} />
            <TextInput value={area} onChangeText={setArea} placeholder="Locality" style={styles.input} />
            <Btn label={orderId ? `Order ${orderId}` : 'Create order'} busy={busy} onPress={() => void create()} />
            {orderId ? (
              <>
                <Btn tone="outline" label={uploadProgress ? `Uploading ${uploadProgress}%` : 'Upload 9:16 video'} onPress={() => void video()} />
                <Btn label="Pay" onPress={() => void pay()} />
              </>
            ) : null}
          </Panel>
        </>
      )}
      <Text style={styles.sectionTitle}>What you get after that</Text>
      <WhyPromote />
      <Btn tone="outline" label="My promotions" onPress={() => router.push('/business-console/promotions' as Href)} />
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
          void run('confirmPromotionPay', {
            orderId,
            razorpayOrderId: paid.razorpay_order_id || checkout?.order?.id || '',
            paymentId: paid.razorpay_payment_id,
            signature: paid.razorpay_signature,
          }).then((result) => {
            if (!result.success) setError(result.error);
            else router.push(`/business-console/promotion/${orderId}` as Href);
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
    image: require('../../assets/console/profile.png'),
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
    image: require('../../assets/console/photos.png'),
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
    image: require('../../assets/console/growth.png'),
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
      <Text style={styles.note}>
        Package reach is an estimate, not a promise. Ads start only after your shop is verified and payment is confirmed.
      </Text>
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
  error: { fontFamily: fonts.regular, fontSize: 13, color: c.danger },
  pack: { borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, backgroundColor: c.card },
  packOn: { borderColor: c.primary },
  input: { marginTop: 8, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 10, color: c.ink, fontFamily: fonts.regular },
}));

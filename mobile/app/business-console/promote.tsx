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
import { LAUNCH_PACKAGES, peekPromotionDesk, storePromotionDesk } from '../../lib/promotionDeskCache';
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
  views?: string;
  visits?: string;
  popular: boolean;
  estimateNote: string;
};

type Desk = {
  success: true;
  verification: { status: string; rejectionReason: string | null };
  packages: PackageCard[];
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
  const [desk, setDesk] = useState<Desk | null>(() => peekPromotionDesk());
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [packageId, setPackageId] = useState('');
  const [pincode, setPincode] = useState('');
  const [area, setArea] = useState('');
  const [orderId, setOrderId] = useState('');
  const [checkout, setCheckout] = useState<CheckoutStart | null>(null);
  const [step, setStep] = useState<'offer' | 'verify' | 'pay' | 'done' | 'custom'>('offer');
  const [budget, setBudget] = useState('');
  const [customDays, setCustomDays] = useState('');
  const [coverage, setCoverage] = useState('');
  const [customPin, setCustomPin] = useState('');
  const [customArea, setCustomArea] = useState('');
  const [goal, setGoal] = useState('');
  const [phone, setPhone] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [customSent, setCustomSent] = useState('');
  const [videoReady, setVideoReady] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [documentType, setDocumentType] = useState('gst');
  const [uploadProgress, setUploadProgress] = useState(0);

  const load = async () => {
    const result = await run<Desk>('promotions');
    if (!result.success) {
      setError(result.error);
      return;
    }
    storePromotionDesk(result);
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
    else {
      setVideoReady(true);
      notify('Video received');
    }
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
  const waiting = desk?.verification.status === 'submitted' || desk?.verification.status === 'under_review';
  const goBack = () => {
    if (step === 'custom') setStep('offer');
    else if (step === 'done' || step === 'pay') setStep(approved ? 'offer' : 'verify');
    else if (step === 'verify') setStep('offer');
    else back();
  };
  const sendCustom = async () => {
    setBusy(true);
    setError('');
    const result = await run<{ success: true; requestId: string }>('requestCustomPromotion', {
      budgetInr: Number(budget.replace(/,/g, '')),
      durationDays: Number(customDays),
      coverage,
      pincode: customPin,
      area: customArea,
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
  const proceed = () => {
    if (!selected) {
      setError('Select a plan to continue.');
      return;
    }
    setError('');
    setStep(approved ? 'pay' : 'verify');
  };

  return (
    <ConsolePage title="Promote online" subtitle={step === 'offer' ? 'Choose a package' : step === 'custom' ? 'Custom plan' : step === 'verify' ? 'Verify the shop' : step === 'pay' ? 'Pay for this package' : 'Payment received'} onBack={goBack} docked>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {step === 'offer' ? (
        <>
          <View style={styles.intro}>
            <Text style={styles.introKicker}>Facebook and Instagram ads, run for you</Text>
            <Text style={styles.introTitle}>Pick how far, and how many days</Text>
            <Text style={styles.introBody}>
              Nearby people already scroll those apps. You choose a package. FinderB makes the ad, runs it in that area, and brings the recorded reach back here. This does not change your Live Leads plan.
            </Text>
          </View>
          <View style={styles.planStack}>
            {packages.map((item) => (
              <PlanCard key={item.id} item={item} selected={item.id === packageId} onPress={() => { setPackageId(item.id); setError(''); }} />
            ))}
          </View>
          <Text style={styles.planFine}>Package reach is an estimate, not a promise. Ads start only after your shop is verified and payment is confirmed.</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Btn label={selected ? `Continue with ${selected.name}` : 'Continue'} onPress={proceed} />
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
              <Text style={styles.fieldLabel}>Budget you can spend (₹)</Text>
              <TextInput value={budget} onChangeText={setBudget} keyboardType="number-pad" placeholder="5000" style={styles.input} />
              <Text style={styles.fieldLabel}>How many days</Text>
              <TextInput value={customDays} onChangeText={setCustomDays} keyboardType="number-pad" placeholder="7" style={styles.input} />
              <Text style={styles.fieldLabel}>How far the ads should go</Text>
              <TextInput value={coverage} onChangeText={setCoverage} placeholder="10 km around the shop" style={styles.input} />
              <Text style={styles.fieldLabel}>Pincode</Text>
              <TextInput value={customPin} onChangeText={setCustomPin} keyboardType="number-pad" maxLength={6} placeholder="400001" style={styles.input} />
              <Text style={styles.fieldLabel}>Locality</Text>
              <TextInput value={customArea} onChangeText={setCustomArea} placeholder="Andheri West" style={styles.input} />
              <Text style={styles.fieldLabel}>What should the ad promote</Text>
              <TextInput value={goal} onChangeText={setGoal} placeholder="Monsoon sale on cotton kurtas" multiline style={[styles.input, styles.inputTall]} />
              <Text style={styles.fieldLabel}>Mobile number on the ad</Text>
              <TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="98XXXXXXXX" style={styles.input} />
              <Text style={styles.fieldLabel}>Anything else</Text>
              <TextInput value={customNote} onChangeText={setCustomNote} placeholder="Optional" multiline style={[styles.input, styles.inputTall]} />
              <Btn label="Send to FinderB" busy={busy} onPress={() => void sendCustom()} />
            </>
          )}
        </Panel>
      ) : null}
      {step === 'verify' ? (
        <View style={styles.verify}>
          <View style={styles.verifyHero}>
            <Image source={require('../../assets/console/verify.png')} style={styles.verifyArt} contentFit="contain" />
            <View style={styles.whyCopy}>
              <Text style={styles.h}>Verify the shop first</Text>
              <Text style={styles.p}>A live shop photo and one proof. Payment for the package you chose opens after FinderB approves the shop.</Text>
              <View style={styles.statusPill}>
                <Ionicons name="shield-checkmark-outline" size={14} color={c.primary} />
                <Text style={styles.statusText}>{statusLabel(desk?.verification.status)}</Text>
              </View>
            </View>
          </View>
          {desk?.verification.rejectionReason ? <Text style={styles.error}>{desk.verification.rejectionReason}</Text> : null}
          {selected ? <Text style={styles.p}>{selected.name} · ₹{selected.priceInr.toLocaleString('en-IN')} stays selected.</Text> : null}
          {waiting ? (
            <Text style={styles.p}>FinderB is checking this shop. Payment for the package opens after it is approved.</Text>
          ) : approved ? (
            <Btn label="Continue to payment" onPress={() => setStep('pay')} />
          ) : (
            <>
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
            </>
          )}
        </View>
      ) : null}
      {step === 'pay' && selected ? (
        <Panel>
          <Text style={styles.h}>{selected.name}</Text>
          <Text style={styles.p}>₹{selected.priceInr.toLocaleString('en-IN')} · {selected.durationDays} days · {selected.coverage}</Text>
          <TextInput value={pincode} onChangeText={setPincode} placeholder="Pincode" keyboardType="number-pad" maxLength={6} style={styles.input} />
          <TextInput value={area} onChangeText={setArea} placeholder="Locality" style={styles.input} />
          <Btn label={orderId ? `Order ${orderId}` : 'Save this area'} busy={busy && !orderId} disabled={Boolean(orderId)} onPress={() => void create()} />
          {orderId ? (
            <>
              <Btn tone="outline" label={uploadProgress ? `Uploading ${uploadProgress}%` : videoReady ? 'Video received' : 'Upload 9:16 video'} onPress={() => void video()} />
              <Btn label="Pay with Razorpay" disabled={!videoReady} onPress={() => void pay()} />
            </>
          ) : null}
        </Panel>
      ) : null}
      {step === 'done' && selected ? (
        <Panel>
          <Text style={styles.h}>Payment received</Text>
          <Text style={styles.p}>{selected.name} · ₹{selected.priceInr.toLocaleString('en-IN')} · order {orderId}</Text>
          <Text style={styles.p}>FinderB has the payment. We emailed you and the FinderB team. The ads start after the shop video is checked.</Text>
          <Btn label="Open this promotion" onPress={() => router.push(`/business-console/promotion/${orderId}` as Href)} />
        </Panel>
      ) : null}
      {step !== 'offer' ? <Btn tone="outline" label="My promotions" onPress={() => router.push('/business-console/promotions' as Href)} /> : null}
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

function PlanCard({ item, selected, onPress }: { item: PackageCard; selected: boolean; onPress: () => void }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const mark = planMark(item);
  const premium = mark.premium;
  const ink = premium ? '#F8F1DE' : c.ink;
  const muted = premium ? 'rgba(248,241,222,0.68)' : c.muted;
  const rupee = (value: number) => `₹${value.toLocaleString('en-IN')}`;
  const facts = [
    item.reach ? { icon: 'people-outline' as const, label: 'Reach', value: item.reach } : null,
    item.views ? { icon: 'eye-outline' as const, label: 'Views', value: item.views } : null,
    item.visits ? { icon: 'walk-outline' as const, label: 'Visits', value: item.visits } : null,
  ].filter((fact): fact is { icon: 'people-outline' | 'eye-outline' | 'walk-outline'; label: string; value: string } => Boolean(fact));
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
          <Text style={[styles.planMeta, premium && styles.planMetaLight]}>{item.durationDays} days · {item.coverage}</Text>
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
      {facts.length ? (
        <View style={styles.planFacts}>
          {facts.map((fact) => (
            <View key={fact.label} style={[styles.planFact, premium && styles.planFactLight]}>
              <Ionicons name={fact.icon} size={14} color={premium ? '#F6D58A' : c.muted} />
              <Text style={[styles.planFactLabel, { color: muted }]}>{fact.label}</Text>
              <Text style={[styles.planFactValue, { color: ink }]} numberOfLines={2}>{fact.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      </View>
    </Pressable>
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
  intro: {
    gap: 6,
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#10283F',
  },
  introKicker: { fontFamily: fonts.semiBold, fontSize: 11, letterSpacing: 0.5, color: '#F3E6C8' },
  introTitle: { fontFamily: fonts.bold, fontSize: 20, lineHeight: 26, color: '#FFFFFF' },
  introBody: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, color: 'rgba(255,255,255,0.78)' },
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
  planFacts: { flexDirection: 'row', gap: 8 },
  planFact: { flex: 1, gap: 2, padding: 8, borderRadius: 12, backgroundColor: c.sunken },
  planFactLabel: { fontFamily: fonts.medium, fontSize: 11, color: c.muted },
  planFactValue: { fontFamily: fonts.semiBold, fontSize: 12, lineHeight: 16, color: c.ink },
  planFine: { fontFamily: fonts.regular, fontSize: 11, lineHeight: 15, color: c.muted },
  input: { marginTop: 8, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 10, color: c.ink, fontFamily: fonts.regular },
  inputTall: { minHeight: 72, textAlignVertical: 'top' },
  fieldLabel: { marginTop: 12, fontFamily: fonts.medium, fontSize: 13, color: c.ink },
}));

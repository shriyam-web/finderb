import { useEffect, useState } from 'react';
import { Pressable, Text, TextInput } from 'react-native';
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
  'I certify that my shop and services are genuine. I understand that I am personally and legally responsible for financial transactions or advance payments made with customers. FinderB is a business discovery platform.';

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
    const camera = await ImagePicker.requestCameraPermissionsAsync();
    if (!camera.granted) {
      setBusy(false);
      setError('Camera permission is required for the shop-front photograph.');
      return;
    }
    const place = await Location.requestForegroundPermissionsAsync();
    if (!place.granted) {
      setBusy(false);
      setError('Location permission is required so FinderB can confirm the shop.');
      return;
    }
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const shot = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (shot.canceled || !shot.assets[0]) {
      setBusy(false);
      return;
    }
    const docs = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] });
    if (docs.canceled || !docs.assets[0]) {
      setBusy(false);
      setError('Choose the GST, Udyam, shop license, or identity document.');
      return;
    }
    const form = new FormData();
    form.append('shopPhoto', { uri: shot.assets[0].uri, name: 'shop.jpg', type: 'image/jpeg' } as unknown as Blob);
    form.append('documents', { uri: docs.assets[0].uri, name: 'document.jpg', type: 'image/jpeg' } as unknown as Blob);
    form.append('documentType', documentType);
    form.append('latitude', String(position.coords.latitude));
    form.append('longitude', String(position.coords.longitude));
    form.append('accuracy', String(position.coords.accuracy || ''));
    form.append('declaration', agreed ? 'yes' : '');
    const body = await uploadForm('/api/business/promotions/verification', form);
    setBusy(false);
    if (!body.success) {
      setError(body.error || 'Verification could not be sent.');
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
    <ConsolePage title="Promote online" subtitle="Facebook and Instagram, run by FinderB" onBack={back}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!approved ? (
        <Panel>
          <Text style={styles.h}>Verify the shop first</Text>
          <Text style={styles.p}>Status: {(desk?.verification.status || 'not submitted').replaceAll('_', ' ')}</Text>
          {desk?.verification.rejectionReason ? <Text style={styles.error}>{desk.verification.rejectionReason}</Text> : null}
          {['gst', 'udyam', 'shop_license', 'aadhaar_pan_bill'].map((item) => (
            <Pressable key={item} onPress={() => setDocumentType(item)} style={styles.check}>
              <Ionicons name={documentType === item ? 'radio-button-on' : 'radio-button-off'} size={18} color={c.primary} />
              <Text style={styles.p}>{item.replaceAll('_', ' ')}</Text>
            </Pressable>
          ))}
          <Pressable onPress={() => setAgreed((value) => !value)} style={styles.check}>
            <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={18} color={c.primary} />
            <Text style={styles.p}>{DECLARATION}</Text>
          </Pressable>
          <Btn label={busy ? 'Working…' : 'Photograph shop and submit'} disabled={!agreed || busy} onPress={() => void verify()} />
        </Panel>
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

const useStyles = createConsoleStyles((c) => ({
  h: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  p: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body, flexShrink: 1 },
  note: { marginTop: 4, fontFamily: fonts.regular, fontSize: 12, color: c.muted },
  error: { fontFamily: fonts.regular, fontSize: 13, color: c.danger },
  pack: { borderWidth: 1, borderColor: c.line, borderRadius: 14, padding: 12, backgroundColor: c.card },
  packOn: { borderColor: c.primary },
  input: { marginTop: 8, borderWidth: 1, borderColor: c.line, borderRadius: 10, padding: 10, color: c.ink, fontFamily: fonts.regular },
  check: { marginTop: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
}));

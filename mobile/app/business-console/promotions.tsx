import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { ConsolePage, Panel, createConsoleStyles, useTabBack } from '../../components/console/kit';

type OrderCard = {
  id: string;
  packageName: string;
  durationDays: number;
  coverage: string;
  priceInr: number;
  paymentStatus: string;
  campaignStatus: string;
  campaignLabel: string;
  targetPincode: string;
  targetArea: string;
  videoReady: boolean;
  adReviewStatus?: 'none' | 'pending' | 'approved' | 'denied';
  adReviewReason?: string;
  createdAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  rejectionReason: string | null;
  report: { reach: number; views: number; visits: number } | null;
};

const PAST = new Set(['completed', 'rejected', 'cancelled', 'refund_pending', 'refunded']);

export default function PromotionsScreen() {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const back = useTabBack();
  const { run } = useMerchantConsole();
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [error, setError] = useState('');
  const [pulling, setPulling] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(() => run<{ success: true; orders: OrderCard[] }>('promotions').then((result) => {
    if (!result.success) setError(result.error);
    else {
      setError('');
      setOrders(result.orders || []);
    }
  }).finally(() => setReady(true)), [run]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ConsolePage
      title="My promotions"
      subtitle="Campaigns you have bought"
      onBack={back}
      docked
      refreshing={pulling}
      onRefresh={() => {
        setPulling(true);
        void load().finally(() => setPulling(false));
      }}
    >
      {!ready ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={c.primary} />
        </View>
      ) : (
        <>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {!orders.length && !error ? <Text style={styles.empty}>No promotions yet.</Text> : null}
          {orders.length ? (
            <>
              <PurchaseGroup title="Pending" orders={orders.filter((order) => order.paymentStatus !== 'paid' && !PAST.has(order.campaignStatus))} empty="No pending promotion." onOpen={() => router.push('/business-console/promote' as Href)} />
              <PurchaseGroup title="Active" orders={orders.filter((order) => order.paymentStatus === 'paid' && !PAST.has(order.campaignStatus))} empty="No active promotion." onOpen={(id) => router.push(`/business-console/promotion/${id}` as Href)} />
              <PurchaseGroup title="Past" orders={orders.filter((order) => PAST.has(order.campaignStatus))} empty="No past promotions." onOpen={(id) => router.push(`/business-console/promotion/${id}` as Href)} />
            </>
          ) : null}
        </>
      )}
    </ConsolePage>
  );
}

function when(value?: string | null) {
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

function statusLabel(order: OrderCard) {
  if (order.paymentStatus === 'paid') return order.campaignLabel;
  if (order.adReviewStatus === 'denied') return 'Needs a change';
  if (order.adReviewStatus === 'approved') return 'Approved · payment is open';
  if (order.adReviewStatus === 'pending' || order.videoReady) return 'With FinderB';
  return 'Draft · video still open';
}

function paymentLabel(status: string) {
  if (status === 'paid') return 'Paid';
  if (status === 'failed') return 'Payment failed';
  return 'Not paid yet';
}

function PurchaseGroup({
  title,
  orders,
  empty,
  onOpen,
}: {
  title: string;
  orders: OrderCard[];
  empty: string;
  onOpen: (id: string) => void;
}) {
  const styles = useStyles();
  return (
    <View style={styles.group}>
      <Text style={styles.section}>{title}</Text>
      {orders.length ? orders.map((order) => {
        const place = [order.targetArea, order.targetPincode].filter(Boolean).join(', ');
        const span = [
          order.durationDays ? `${order.durationDays} days` : '',
          order.coverage,
        ].filter(Boolean).join(' · ');
        return (
          <Pressable key={order.id} onPress={() => onOpen(order.id)}>
            <Panel>
              <Text style={styles.h}>{order.packageName}</Text>
              <Text style={styles.badge}>{statusLabel(order)}</Text>
              <Text style={styles.p}>Order {order.id}</Text>
              <Text style={styles.p}>₹{order.priceInr.toLocaleString('en-IN')}{span ? ` · ${span}` : ''}</Text>
              <Text style={styles.p}>{place || 'Area not set'}</Text>
              <Text style={styles.p}>{paymentLabel(order.paymentStatus)}</Text>
              <Text style={styles.p}>{order.videoReady ? 'Video received' : 'Video not sent yet'}</Text>
              {order.createdAt ? <Text style={styles.p}>Bought {when(order.createdAt)}</Text> : null}
              {order.startedAt ? <Text style={styles.p}>Ads started {when(order.startedAt)}</Text> : null}
              {order.endedAt ? <Text style={styles.p}>Ended {when(order.endedAt)}</Text> : null}
              {order.report ? (
                <Text style={styles.p}>
                  Reach {order.report.reach.toLocaleString('en-IN')} · Views {order.report.views.toLocaleString('en-IN')} · Visits {order.report.visits.toLocaleString('en-IN')}
                </Text>
              ) : null}
              {order.adReviewStatus === 'denied' && order.adReviewReason ? <Text style={styles.error}>{order.adReviewReason}</Text> : null}
              {order.rejectionReason && order.adReviewStatus !== 'denied' ? <Text style={styles.error}>{order.rejectionReason}</Text> : null}
            </Panel>
          </Pressable>
        );
      }) : <Text style={styles.empty}>{empty}</Text>}
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  group: { gap: 10 },
  section: { fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', color: c.muted },
  h: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  badge: { alignSelf: 'flex-start', marginTop: 6, fontFamily: fonts.semiBold, fontSize: 12, color: c.ink, backgroundColor: c.sunken, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  p: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body },
  empty: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  error: { marginTop: 6, fontFamily: fonts.regular, fontSize: 13, color: c.danger },
}));

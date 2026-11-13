import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { Btn, ConsolePage, Panel, Sheet, createConsoleStyles, useTabBack } from '../../components/console/kit';
import { ProgressPie } from '../../components/console/ProgressPie';
import { adProgress } from '../../lib/adProgress';
import { NextAction } from '../../components/console/NextAction';

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
  const { run, notify } = useMerchantConsole();
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [error, setError] = useState('');
  const [pulling, setPulling] = useState(false);
  const [ready, setReady] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<OrderCard | null>(null);
  const [busy, setBusy] = useState(false);

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

  const openCampaign = (id: string) => {
    const order = orders.find((item) => item.id === id);
    if (order && adProgress(order).canContinue) {
      router.push(`/business-console/promote?order=${encodeURIComponent(id)}` as Href);
      return;
    }
    router.push(`/business-console/promotion/${id}` as Href);
  };

  return (
    <ConsolePage
      title="Your ads"
      subtitle="Drafts, ads that are live, and ads that have ended"
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
          {!orders.length && !error ? <Text style={styles.empty}>No ads yet.</Text> : null}
          {orders.length ? (
            <>
              <PurchaseGroup title="Pending" orders={orders.filter((order) => order.paymentStatus !== 'paid' && !PAST.has(order.campaignStatus))} empty="No pending ads." onOpen={openCampaign} onDelete={setDeleteTarget} />
              <PurchaseGroup title="Active" orders={orders.filter((order) => order.paymentStatus === 'paid' && !PAST.has(order.campaignStatus))} empty="No live ads." onOpen={openCampaign} />
              <PurchaseGroup title="Past" orders={orders.filter((order) => PAST.has(order.campaignStatus))} empty="No finished ads." onOpen={openCampaign} />
            </>
          ) : null}
        </>
      )}
      <Sheet visible={deleteTarget != null} title="Delete this campaign?" onClose={() => { if (!busy) setDeleteTarget(null); }}>
        <Text style={styles.p}>{deleteTarget?.packageName} is still a draft. Deleting it stops this ad. A running or paid campaign stays.</Text>
        <Btn
          tone="danger"
          label="Delete campaign"
          busy={busy}
          onPress={() => {
            if (!deleteTarget) return;
            setBusy(true);
            setError('');
            void run<{ success: true }>('deletePromotion', { orderId: deleteTarget.id }).then(async (result) => {
              setBusy(false);
              if (!result.success) {
                setError(result.error);
                return;
              }
              setDeleteTarget(null);
              notify('Campaign deleted');
              await load();
            });
          }}
        />
        <Btn tone="outline" label="Keep it" onPress={() => setDeleteTarget(null)} />
      </Sheet>
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
  onDelete,
}: {
  title: string;
  orders: OrderCard[];
  empty: string;
  onOpen: (id: string) => void;
  onDelete?: (order: OrderCard) => void;
}) {
  const styles = useStyles();
  const c = useConsoleColors();
  return (
    <View style={styles.group}>
      <Text style={styles.section}>{title}</Text>
      {orders.length ? orders.map((order) => {
        const place = [order.targetArea, order.targetPincode].filter(Boolean).join(', ');
        const span = [
          order.durationDays ? `${order.durationDays} days` : '',
          order.coverage,
        ].filter(Boolean).join(' · ');
        const progress = adProgress(order);
        return (
          <Panel key={order.id}>
            <View style={styles.cardTop}>
              <Pressable
                onPress={() => onOpen(order.id)}
                accessibilityRole="button"
                accessibilityLabel={`${order.packageName}. ${progress.canContinue ? progress.next : progress.step}.`}
                style={styles.headMain}
              >
                <View style={styles.head}>
                  <ProgressPie percent={progress.percent} color={progress.canContinue ? (c.isDark ? '#38BDF8' : '#1D4ED8') : c.success} />
                  <View style={styles.headCopy}>
                    <Text style={styles.h}>{order.packageName}</Text>
                    {progress.canContinue ? <NextAction label={progress.next} /> : <Text style={styles.badge}>{progress.step}</Text>}
                  </View>
                </View>
                <Text style={styles.p}>Order {order.id}</Text>
                <Text style={styles.p}>₹{order.priceInr.toLocaleString('en-IN')}{span ? ` · ${span}` : ''}</Text>
                <Text style={styles.p}>Area · {place || 'Not set'}</Text>
                <Text style={styles.p}>Video · {order.videoReady ? 'Added' : 'Not added'}</Text>
                <Text style={styles.p}>Payment · {paymentLabel(order.paymentStatus)}</Text>
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
              </Pressable>
              {progress.canContinue && onDelete ? (
                <Pressable
                  onPress={() => onDelete(order)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${order.packageName}`}
                  hitSlop={8}
                  style={({ pressed }) => [styles.deleteIcon, pressed && { opacity: 0.7 }]}
                >
                  <Ionicons name="trash-outline" size={18} color={c.danger} />
                </Pressable>
              ) : null}
            </View>
            </Panel>
        );
      }) : <Text style={styles.empty}>{empty}</Text>}
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  loading: { minHeight: 220, alignItems: 'center', justifyContent: 'center' },
  group: { gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headMain: { flex: 1, minWidth: 0 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  headCopy: { flex: 1, minWidth: 0 },
  section: { fontFamily: fonts.semiBold, fontSize: 13, letterSpacing: 0.4, textTransform: 'uppercase', color: c.muted },
  h: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  badge: { alignSelf: 'flex-start', marginTop: 6, fontFamily: fonts.semiBold, fontSize: 12, color: c.ink, backgroundColor: c.sunken, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3, overflow: 'hidden' },
  p: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.body },
  empty: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18, color: c.muted },
  error: { marginTop: 6, fontFamily: fonts.regular, fontSize: 13, color: c.danger },
  deleteIcon: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
}));

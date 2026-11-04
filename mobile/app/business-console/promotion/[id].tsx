import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { fonts } from '../../../constants/typography';
import { useMerchantConsole } from '../../../context/MerchantConsoleContext';
import { ConsolePage, Panel, createConsoleStyles, useTabBack } from '../../../components/console/kit';

type OrderCard = {
  id: string;
  packageName: string;
  campaignLabel: string;
  campaignStatus: string;
  priceInr: number;
  targetArea: string;
  targetPincode: string;
  paymentStatus: string;
  rejectionReason: string | null;
  startedAt: string | null;
  endedAt: string | null;
  report: { reach: number; views: number; visits: number } | null;
};

const FLOW = ['payment_successful', 'under_review', 'video_ready', 'ad_active', 'completed'];

export default function PromotionDetailScreen() {
  const styles = useStyles();
  const back = useTabBack();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { run } = useMerchantConsole();
  const [order, setOrder] = useState<OrderCard | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    void run<{ success: true; order: OrderCard }>('promotion', { orderId: id }).then((result) => {
      if (!result.success) setError(result.error);
      else setOrder(result.order);
    });
  }, [id, run]);

  return (
    <ConsolePage title={order?.packageName || 'Promotion'} subtitle={order?.id || ''} onBack={back}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {order ? (
        <Panel>
          <Text style={styles.h}>{order.campaignLabel}</Text>
          <Text style={styles.p}>₹{order.priceInr.toLocaleString('en-IN')} · payment {order.paymentStatus}</Text>
          <Text style={styles.p}>{order.targetArea} {order.targetPincode}</Text>
          <View style={styles.row}>
            {FLOW.map((step) => (
              <Text key={step} style={[styles.step, order.campaignStatus === step && styles.stepOn]}>
                {step.replaceAll('_', ' ')}
              </Text>
            ))}
          </View>
          {order.rejectionReason ? <Text style={styles.error}>{order.rejectionReason}</Text> : null}
          {order.report ? (
            <Text style={styles.p}>
              Reach {order.report.reach.toLocaleString('en-IN')} · Views {order.report.views.toLocaleString('en-IN')} · Visits {order.report.visits.toLocaleString('en-IN')}
            </Text>
          ) : (
            <Text style={styles.note}>Actual results are added by FinderB when the campaign ends. Estimates are not results.</Text>
          )}
        </Panel>
      ) : null}
    </ConsolePage>
  );
}

const useStyles = createConsoleStyles((c) => ({
  h: { fontFamily: fonts.semiBold, fontSize: 18, color: c.ink },
  p: { marginTop: 6, fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 19, color: c.body },
  note: { marginTop: 8, fontFamily: fonts.regular, fontSize: 12.5, lineHeight: 18, color: c.muted },
  error: { fontFamily: fonts.regular, fontSize: 13, color: c.danger },
  row: { marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  step: { fontFamily: fonts.regular, fontSize: 11, color: c.muted, backgroundColor: c.sunken, borderRadius: 99, paddingHorizontal: 8, paddingVertical: 4, overflow: 'hidden' },
  stepOn: { color: '#fff', backgroundColor: c.primary },
}));

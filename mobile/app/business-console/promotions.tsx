import { useEffect, useState } from 'react';
import { Pressable, Text } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { fonts } from '../../constants/typography';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import { ConsolePage, Panel, createConsoleStyles, useTabBack } from '../../components/console/kit';

type OrderCard = {
  id: string;
  packageName: string;
  campaignLabel: string;
  priceInr: number;
  targetArea: string;
};

export default function PromotionsScreen() {
  const styles = useStyles();
  const router = useRouter();
  const back = useTabBack();
  const { run } = useMerchantConsole();
  const [orders, setOrders] = useState<OrderCard[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    void run<{ success: true; orders: OrderCard[] }>('promotions').then((result) => {
      if (!result.success) setError(result.error);
      else setOrders(result.orders || []);
    });
  }, [run]);

  return (
    <ConsolePage title="My promotions" subtitle="Campaigns you have bought" onBack={back} docked>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {orders.length ? orders.map((order) => (
        <Pressable key={order.id} onPress={() => router.push(`/business-console/promotion/${order.id}` as Href)}>
          <Panel>
            <Text style={styles.h}>{order.packageName}</Text>
            <Text style={styles.p}>{order.id} · ₹{order.priceInr.toLocaleString('en-IN')}</Text>
            <Text style={styles.p}>{order.campaignLabel} · {order.targetArea}</Text>
          </Panel>
        </Pressable>
      )) : <Text style={styles.p}>No promotions yet.</Text>}
    </ConsolePage>
  );
}

const useStyles = createConsoleStyles((c) => ({
  h: { fontFamily: fonts.semiBold, fontSize: 16, color: c.ink },
  p: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, color: c.body },
  error: { fontFamily: fonts.regular, fontSize: 13, color: c.danger },
}));

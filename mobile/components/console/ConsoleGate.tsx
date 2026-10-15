import { useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../../constants/typography';
import { useConsoleColors } from '../../constants/consoleColors';
import { useAuth } from '../../context/AuthContext';
import { useMerchantConsole } from '../../context/MerchantConsoleContext';
import type { ConsoleOverview } from '../../lib/merchantConsoleApi';
import { BusinessSplash } from './BusinessSplash';
import { Btn, createConsoleStyles } from './kit';

const MIN_SPLASH_MS = 700;

/** Wraps every console tab: shows the splash, sign-in problems and retry until the overview arrives. */
export function ConsoleGate({ children }: { children: (overview: ConsoleOverview) => ReactNode }) {
  const styles = useStyles();
  const c = useConsoleColors();
  const router = useRouter();
  const { signOut } = useAuth();
  const { overview, loading, error, errorCode, refresh, refreshing } = useMerchantConsole();
  const [holding, setHolding] = useState(() => !overview);

  useEffect(() => {
    if (!holding) return;
    const timer = setTimeout(() => setHolding(false), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, [holding]);

  if (overview && !holding) return <>{children(overview)}</>;
  if (loading || holding) return <BusinessSplash />;

  const signedOut = errorCode === 'signed_out';
  const notMerchant = errorCode === 'not_merchant';
  const offline = /no internet/i.test(error || '');

  if (offline) {
    return (
      <View style={styles.offlinePage}>
        <View style={styles.offlineMark}>
          <Ionicons name="wifi-outline" size={26} color="#6B7280" />
        </View>
        <Text style={styles.offlineTitle}>No internet connection</Text>
        <Text style={styles.offlineBody}>
          FinderB needs the internet to open your business dashboard. Check your connection, then try again.
        </Text>
        <View style={styles.errorActions}>
          <Btn label="Try again" icon="refresh" busy={refreshing} onPress={() => void refresh()} />
          <Btn label="Back to FinderB" tone="text" onPress={() => router.replace('/(tabs)/home' as Href)} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.page, styles.center]}>
      <View style={styles.errorMark}>
        <Ionicons
          name={signedOut ? 'key-outline' : notMerchant ? 'storefront-outline' : 'cloud-offline-outline'}
          size={24}
          color={c.accent}
        />
      </View>
      <Text style={styles.errorTitle}>
        {signedOut ? 'Please log in again' : notMerchant ? 'No business linked yet' : 'Couldn’t open your dashboard'}
      </Text>
      <Text style={styles.errorBody}>{error || 'Something went wrong. Try again.'}</Text>
      <View style={styles.errorActions}>
        {signedOut ? (
          <Btn
            label="Log in"
            icon="log-in-outline"
            onPress={async () => {
              await signOut();
              router.replace('/(tabs)/business-login' as Href);
            }}
          />
        ) : notMerchant ? (
          <Btn label="Set up my business" icon="add-circle-outline" onPress={() => router.replace('/(tabs)/business' as Href)} />
        ) : (
          <Btn label="Try again" icon="refresh" busy={refreshing} onPress={() => void refresh()} />
        )}
        <Btn label="Back to FinderB" tone="text" onPress={() => router.replace('/(tabs)/home' as Href)} />
      </View>
    </View>
  );
}

const useStyles = createConsoleStyles((c) => ({
  page: { flex: 1, backgroundColor: c.page, paddingHorizontal: 24 },
  center: { alignItems: 'center', justifyContent: 'center' },
  errorMark: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: c.primarySoft,
  },
  errorTitle: { marginTop: 16, fontFamily: fonts.semiBold, fontSize: 19, color: c.ink, textAlign: 'center' },
  errorBody: {
    marginTop: 8,
    maxWidth: 300,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: c.muted,
    textAlign: 'center',
  },
  errorActions: { marginTop: 22, alignSelf: 'stretch', gap: 6 },
  offlinePage: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  offlineMark: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F5',
  },
  offlineTitle: {
    marginTop: 18,
    fontFamily: fonts.semiBold,
    fontSize: 22,
    color: '#6B7280',
    textAlign: 'center',
  },
  offlineBody: {
    marginTop: 10,
    maxWidth: 320,
    fontFamily: fonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#9CA3AF',
    textAlign: 'center',
  },
}));

import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { hideNativeSplash } from '../lib/nativeSplash';
import { warmupHomeSession } from '../lib/homeBootstrap';

const SPLASH_BUDGET_MS = 3200;

/**
 * Keep the splash up while home categories + merchant shelves load.
 * Then open Home with data already in session cache.
 */
export default function Index() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const failsafe = setTimeout(() => {
      if (!alive || ready) return;
      hideNativeSplash();
      setReady(true);
    }, SPLASH_BUDGET_MS);

    void Promise.race([
      warmupHomeSession().catch(() => undefined),
      new Promise((resolve) => setTimeout(resolve, SPLASH_BUDGET_MS)),
    ]).finally(() => {
      if (!alive) return;
      clearTimeout(failsafe);
      hideNativeSplash();
      setReady(true);
    });

    return () => {
      alive = false;
      clearTimeout(failsafe);
    };
  }, []);

  if (!ready) {
    return <View style={styles.root} />;
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FFFFFF' },
});

import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { BrandedSplash } from '../components/BrandedSplash';
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
    const reveal = requestAnimationFrame(() => hideNativeSplash());
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
      cancelAnimationFrame(reveal);
      clearTimeout(failsafe);
    };
  }, []);

  if (!ready) {
    return <BrandedSplash message="Finding places near you" />;
  }

  return <Redirect href="/(tabs)/home" />;
}

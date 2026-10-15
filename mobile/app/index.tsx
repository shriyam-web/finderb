import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { BrandedSplash } from '../components/BrandedSplash';
import { BusinessSplash } from '../components/console/BusinessSplash';
import { hideNativeSplash } from '../lib/nativeSplash';
import { warmupHomeSession } from '../lib/homeBootstrap';
import { getStoredUser } from '../lib/session';
import { getPreferredShell } from '../lib/preferredShell';

const SPLASH_BUDGET_MS = 3200;

/**
 * Business accounts that prefer the merchant shell skip the consumer splash
 * and home warmup, and open the console immediately.
 */
export default function Index() {
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<Href>('/(tabs)/home');
  const [businessFirst, setBusinessFirst] = useState(false);

  useEffect(() => {
    let alive = true;
    const reveal = requestAnimationFrame(() => hideNativeSplash());
    const failsafe = setTimeout(() => {
      if (!alive) return;
      hideNativeSplash();
      setReady(true);
    }, SPLASH_BUDGET_MS + 400);

    void (async () => {
      const user = await getStoredUser().catch(() => null);
      const shell = await getPreferredShell(Boolean(user?.isBusinessAccount));
      const goBusiness = Boolean(user?.isBusinessAccount && shell === 'business');
      if (!alive) return;

      if (goBusiness) {
        setBusinessFirst(true);
        setTarget('/business-console' as Href);
        clearTimeout(failsafe);
        hideNativeSplash();
        setReady(true);
        return;
      }

      await Promise.race([
        warmupHomeSession().catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, SPLASH_BUDGET_MS)),
      ]);
      if (!alive) return;
      clearTimeout(failsafe);
      hideNativeSplash();
      setReady(true);
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(reveal);
      clearTimeout(failsafe);
    };
  }, []);

  if (!ready) {
    return businessFirst ? <BusinessSplash /> : <BrandedSplash message="Finding places near you" />;
  }

  return <Redirect href={target} />;
}

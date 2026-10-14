import { Redirect, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { BrandedSplash } from '../components/BrandedSplash';
import { hideNativeSplash } from '../lib/nativeSplash';
import { warmupHomeSession } from '../lib/homeBootstrap';
import { getStoredUser } from '../lib/session';
import { getPreferredShell } from '../lib/preferredShell';

const SPLASH_BUDGET_MS = 3200;

/**
 * Keep the splash up while home categories + merchant shelves load.
 * Then open Home with data already in session cache.
 */
export default function Index() {
  const [ready, setReady] = useState(false);
  const [target, setTarget] = useState<Href>('/(tabs)/home');

  useEffect(() => {
    let alive = true;
    const reveal = requestAnimationFrame(() => hideNativeSplash());
    const failsafe = setTimeout(() => {
      if (!alive || ready) return;
      hideNativeSplash();
      setReady(true);
    }, SPLASH_BUDGET_MS);

    void Promise.all([
      Promise.race([
        warmupHomeSession().catch(() => undefined),
        new Promise((resolve) => setTimeout(resolve, SPLASH_BUDGET_MS)),
      ]),
      getStoredUser().catch(() => null),
    ])
      .then(async ([, user]) => {
        const shell = await getPreferredShell(Boolean(user?.isBusinessAccount));
        if (!alive) return;
        if (user?.isBusinessAccount && shell === 'business') {
          setTarget('/business-console' as Href);
        } else {
          setTarget('/(tabs)/home' as Href);
        }
      })
      .finally(() => {
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

  return <Redirect href={target} />;
}

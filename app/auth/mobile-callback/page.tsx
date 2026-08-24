'use client';

import { useEffect, useState } from 'react';

/**
 * OAuth landing for the FinderB mobile app.
 * Supabase redirects here (HTTPS — reliable in Chrome Custom Tabs).
 * We immediately bounce to finderb:// so Expo AuthSession / Linking
 * can finish the PKCE exchange inside the app.
 *
 * Use `finderb://auth/callback` (AuthSession return URL). Expo Router
 * maps it via `+native-intent` because URL parsing treats `auth` as host.
 */
export default function MobileAuthCallbackPage() {
  const [deepLink, setDeepLink] = useState('finderb://auth/callback');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { search, hash } = window.location;
    const target = `finderb://auth/callback${search}${hash}`;
    setDeepLink(target);

    window.location.replace(target);

    const retry = window.setTimeout(() => {
      window.location.href = target;
    }, 350);

    const failTimer = window.setTimeout(() => setFailed(true), 1600);

    return () => {
      window.clearTimeout(retry);
      window.clearTimeout(failTimer);
    };
  }, []);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-medium text-neutral-800">
        {failed ? 'Couldn’t open the app automatically' : 'Returning to FinderB…'}
      </p>
      <p className="max-w-sm text-sm text-neutral-500">
        {failed
          ? 'Tap below to finish signing in in the FinderB app.'
          : 'You can close this tab if the app already opened.'}
      </p>
      <a
        href={deepLink}
        className="mt-2 rounded-lg bg-[#215481] px-4 py-2.5 text-sm font-semibold text-white"
      >
        Open FinderB app
      </a>
    </main>
  );
}

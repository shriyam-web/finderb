'use client';

import { useEffect, useState } from 'react';

/**
 * OAuth landing for the FinderB mobile app.
 * Supabase redirects here (HTTPS — reliable in Chrome Custom Tabs).
 * We immediately bounce to finderb:// so Expo AuthSession / Linking
 * can finish the PKCE exchange inside the app.
 */
export default function MobileAuthCallbackPage() {
  const [deepLink, setDeepLink] = useState('finderb://auth/callback');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { search, hash } = window.location;
    const target = `finderb://auth/callback${search}${hash}`;
    setDeepLink(target);

    // Immediate bounce — Custom Tabs hand off to the app scheme.
    window.location.replace(target);

    // Retry once in case the first navigation was blocked.
    const t = window.setTimeout(() => {
      window.location.href = target;
    }, 400);
    return () => window.clearTimeout(t);
  }, []);

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-medium text-neutral-800">Returning to FinderB…</p>
      <p className="text-sm text-neutral-500">You can close this tab if the app already opened.</p>
      <a href={deepLink} className="mt-2 text-sm font-semibold text-[#215481] underline">
        Open FinderB app
      </a>
    </main>
  );
}

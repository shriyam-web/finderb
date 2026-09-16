'use client';

import { useEffect, useState } from 'react';

/**
 * OAuth landing for the FinderB mobile app.
 * Supabase may redirect here (HTTPS). We bounce to finderb:// immediately
 * so Expo AuthSession / Linking can finish PKCE inside the app — keep this
 * page visually empty to avoid a jarring website mid-step.
 */
export default function MobileAuthCallbackPage() {
  const [deepLink, setDeepLink] = useState('finderb://auth/callback');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const { search, hash } = window.location;
    const qs = `${search}${hash}`;
    const hostForm = `finderb://auth/callback${qs}`;
    const pathForm = `finderb:///auth/callback${qs}`;
    setDeepLink(hostForm);

    window.location.replace(hostForm);

    const retry = window.setTimeout(() => {
      window.location.href = hostForm;
    }, 250);

    const retryPath = window.setTimeout(() => {
      window.location.href = pathForm;
    }, 700);

    const failTimer = window.setTimeout(() => setFailed(true), 1600);

    return () => {
      window.clearTimeout(retry);
      window.clearTimeout(retryPath);
      window.clearTimeout(failTimer);
    };
  }, []);

  if (!failed) {
    return (
      <main
        style={{
          minHeight: '100vh',
          margin: 0,
          background: '#0B1F2A',
        }}
        aria-busy="true"
        aria-label="Returning to FinderB"
      />
    );
  }

  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
      <p className="text-base font-medium text-neutral-800">
        Couldn’t open the app automatically
      </p>
      <p className="max-w-sm text-sm text-neutral-500">
        Tap below to finish signing in in the FinderB app.
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

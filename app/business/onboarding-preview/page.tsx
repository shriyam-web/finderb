'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BusinessOnboardingLoader from '@/components/business/BusinessOnboardingLoader';

/**
 * Dev-only preview for the merchant welcome splash.
 * Visit: /business/onboarding-preview
 */
export default function BusinessOnboardingPreviewPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      router.replace('/business/dashboard');
      return;
    }
    setAllowed(true);
  }, [router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-sm text-zinc-500">
        Loading preview…
      </div>
    );
  }

  if (done) {
    return (
      <div
        data-testid="welcome-splash-complete"
        className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[#f7f9fc] px-6 text-center"
      >
        <p className="text-lg font-bold text-[#0a1520]">Welcome splash completed</p>
        <p className="text-sm text-[#5a6b7d]">Preview only — dashboard would open here.</p>
        <button
          type="button"
          className="mt-2 rounded-lg bg-[#215481] px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setDone(false)}
        >
          Replay splash
        </button>
      </div>
    );
  }

  return (
    <BusinessOnboardingLoader
      onComplete={() => {
        setDone(true);
      }}
    />
  );
}

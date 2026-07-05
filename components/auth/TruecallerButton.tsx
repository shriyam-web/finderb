'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  buildTruecallerDeepLink,
  isAndroidBrowser,
  isTruecallerEnabled,
} from '@/lib/auth/truecallerConfig';

function TruecallerIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={className}
      fill="currentColor"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3.2c1.66 0 3.2.56 4.43 1.5L8.7 14.43A6.16 6.16 0 0 1 12 5.2zm-6.8 6.8c0-1.66.56-3.2 1.5-4.43l7.73 7.73A6.16 6.16 0 0 1 5.2 12zm6.8 6.8a6.16 6.16 0 0 1-4.43-1.5l7.73-7.73A6.16 6.16 0 0 1 18.8 12a6.16 6.16 0 0 1-6.8 6.8z" />
    </svg>
  );
}

type TruecallerButtonProps = {
  mode: 'login' | 'signup';
  redirectPath?: string;
  onError?: (message: string) => void;
};

function createRequestId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function TruecallerButton({
  mode,
  redirectPath = '/dashboard',
  onError,
}: TruecallerButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!isTruecallerEnabled()) return null;

  const label =
    mode === 'signup' ? 'Sign up with Truecaller' : 'Continue with Truecaller';

  const pollVerificationStatus = async (requestId: string) => {
    const maxAttempts = 40;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      await sleep(attempt === 0 ? 1500 : 3000);

      const response = await fetch(
        `/api/auth/truecaller/status?requestId=${encodeURIComponent(requestId)}`,
        { cache: 'no-store' }
      );
      const data = (await response.json()) as {
        status?: string;
        redirectUrl?: string;
        error?: string;
        suggestedLoginPath?: string;
      };

      if (data.status === 'completed' && data.redirectUrl) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('finderb-session-change', { detail: { type: 'user' } })
          );
        }
        router.push(data.redirectUrl);
        return;
      }

      if (data.status === 'user_rejected') {
        onError?.(data.error || 'You declined Truecaller verification.');
        return;
      }

      if (data.status === 'error') {
        onError?.(data.error || 'Truecaller verification failed.');
        return;
      }
    }

    onError?.('Verification timed out. Please try again.');
  };

  const startTruecaller = async () => {
    if (!isAndroidBrowser()) {
      onError?.(
        'Truecaller one-tap sign-in works on Android phones with the Truecaller app installed. Use Google or email on this device.'
      );
      return;
    }

    const requestId = createRequestId();
    const deepLink = buildTruecallerDeepLink(requestId);
    if (!deepLink) {
      onError?.('Truecaller is not configured yet.');
      return;
    }

    setLoading(true);
    onError?.('');

    try {
      const initResponse = await fetch('/api/auth/truecaller/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, redirectPath }),
      });

      if (!initResponse.ok) {
        const payload = (await initResponse.json()) as { error?: string };
        onError?.(payload.error || 'Could not start Truecaller verification.');
        setLoading(false);
        return;
      }

      void pollVerificationStatus(requestId);

      let lostFocus = false;
      const onBlur = () => {
        lostFocus = true;
      };
      window.addEventListener('blur', onBlur);

      window.location.href = deepLink;

      window.setTimeout(() => {
        window.removeEventListener('blur', onBlur);
        if (!lostFocus && document.hasFocus()) {
          setLoading(false);
          onError?.(
            'Truecaller app not detected. Install Truecaller from Play Store or use Google / email sign-in.'
          );
        }
      }, 700);
    } catch {
      onError?.('Could not connect to Truecaller. Please try again.');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={() => void startTruecaller()}
      className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl border border-[#0087FF]/25 bg-[#0087FF] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-[#0076e0] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 transition-opacity group-hover:opacity-100" />
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <TruecallerIcon className="h-[18px] w-[18px] shrink-0 text-white" />
      )}
      <span>{loading ? 'Waiting for Truecaller…' : label}</span>
    </button>
  );
}

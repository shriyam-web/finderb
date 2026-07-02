'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/app/actions/user';
import { getBusinessSession } from '@/app/actions/business';
import { getSafeRedirectPath } from '@/lib/authRedirect';

type RedirectState =
  | { status: 'checking' }
  | { status: 'idle' }
  | { status: 'redirecting'; message: string };

type UserRedirectOptions = {
  kind: 'user';
  redirectTo?: string;
  message?: string;
  delayMs?: number;
};

type BusinessRedirectOptions = {
  kind: 'business';
  redirectTo?: string;
  message?: string;
  delayMs?: number;
};

export function useAlreadyLoggedInRedirect(
  options: UserRedirectOptions | BusinessRedirectOptions,
): RedirectState {
  const router = useRouter();
  const [state, setState] = useState<RedirectState>({ status: 'checking' });
  const { kind, redirectTo, message, delayMs = 1600 } = options;

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function check() {
      try {
        if (kind === 'user') {
          const result = await getSession();
          if (cancelled) return;

          if (result?.success) {
            const path = redirectTo ?? '/dashboard';
            setState({
              status: 'redirecting',
              message: message ?? "You're already logged in. Redirecting to your dashboard…",
            });
            timer = setTimeout(() => router.replace(getSafeRedirectPath(path)), delayMs);
            return;
          }
        } else {
          const result = await getBusinessSession();
          if (cancelled) return;

          if (result?.success && result.business?.id) {
            const path = redirectTo ?? `/business/dashboard?id=${result.business.id}`;
            setState({
              status: 'redirecting',
              message:
                message ?? "You're currently logged in. Redirecting to your merchant dashboard…",
            });
            timer = setTimeout(() => router.replace(path), delayMs);
            return;
          }
        }
      } catch {
        // Dev server restart / port mismatch — allow the page to render normally.
      }

      setState({ status: 'idle' });
    }

    void check();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [kind, redirectTo, message, delayMs, router]);

  return state;
}

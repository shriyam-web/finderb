'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getSession } from '@/app/actions/user';
import { isMobileGateOpenPath, needsMobileNumber, verifyMobileHref } from '@/lib/mobileGate';

/** Sends a signed-in customer without a verified mobile to the verify page, on every route. */
export function useMobileGate() {
  const router = useRouter();
  const pathname = usePathname();
  const [needsMobile, setNeedsMobile] = useState(false);

  useEffect(() => {
    let live = true;
    const check = () => {
      getSession()
        .then((session) => {
          if (live) setNeedsMobile(Boolean(session?.success && needsMobileNumber(session.user)));
        })
        .catch(() => undefined);
    };
    check();
    window.addEventListener('finderb-session-change', check);
    return () => {
      live = false;
      window.removeEventListener('finderb-session-change', check);
    };
  }, []);

  useEffect(() => {
    if (!needsMobile || isMobileGateOpenPath(pathname)) return;
    router.replace(verifyMobileHref(`${pathname || '/'}${window.location.search}`));
  }, [needsMobile, pathname, router]);
}

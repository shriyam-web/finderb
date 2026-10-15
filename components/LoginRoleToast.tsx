'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  LOGIN_ROLE_PARAM,
  loginRoleFromParam,
  takeStoredLoginRole,
  type LoginRole,
} from '@/lib/loginRoleToast';

const SHOW_MS = 3000;

export default function LoginRoleToast() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [role, setRole] = useState<LoginRole | null>(null);

  useEffect(() => {
    const fromUrl = loginRoleFromParam(searchParams.get(LOGIN_ROLE_PARAM));
    const stored = takeStoredLoginRole();
    const next = fromUrl || stored;
    if (!next) return;
    setRole(next);
    if (fromUrl) {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(LOGIN_ROLE_PARAM);
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }, [pathname, router, searchParams]);

  useEffect(() => {
    const onRole = (event: Event) => {
      const detail = (event as CustomEvent<{ role?: LoginRole }>).detail;
      const next = loginRoleFromParam(detail?.role);
      if (next) setRole(next);
    };
    window.addEventListener('finderb-login-role', onRole);
    return () => window.removeEventListener('finderb-login-role', onRole);
  }, []);

  useEffect(() => {
    if (!role) return;
    const timer = setTimeout(() => setRole(null), SHOW_MS);
    return () => clearTimeout(timer);
  }, [role]);

  if (!role) return null;

  return (
    <div
      role="status"
      className="pointer-events-none fixed inset-x-0 top-5 z-[100000] flex justify-center px-4 sm:top-8"
    >
      <div className="rounded-full bg-zinc-900/92 px-4 py-2.5 text-sm font-semibold text-white shadow-lg">
        {role === 'business' ? 'Logged in as a business' : 'Logged in as a User'}
      </div>
    </div>
  );
}

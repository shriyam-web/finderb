'use client';

import { LOGIN_ROLE_PARAM, type LoginRole, loginRoleFromParam } from '@/lib/loginRole';

const STORAGE_KEY = 'finderb-login-role';

export function markLoginRole(role: LoginRole) {
  try {
    sessionStorage.setItem(STORAGE_KEY, role);
  } catch {
    // Private mode can block sessionStorage.
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('finderb-login-role', { detail: { role } }));
  }
}

export function takeStoredLoginRole(): LoginRole | null {
  try {
    const value = loginRoleFromParam(sessionStorage.getItem(STORAGE_KEY));
    if (value) sessionStorage.removeItem(STORAGE_KEY);
    return value;
  } catch {
    return null;
  }
}

export { LOGIN_ROLE_PARAM, loginRoleFromParam };
export type { LoginRole };

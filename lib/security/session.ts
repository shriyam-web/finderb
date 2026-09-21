import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';

export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;
/** Support impersonation sessions expire after this much idle time. */
export const SUPPORT_SESSION_IDLE_MS = 15 * 60 * 1000;
export const SUPPORT_SESSION_COOKIE_MAX_AGE = 15 * 60;

const BUSINESS_ID_COOKIE = 'business_id';
const USER_ID_COOKIE = 'user_id';
const SUPPORT_FLAG_COOKIE = 'business_support';
const SUPPORT_ACTIVE_COOKIE = 'business_support_active';

export function getSessionCookieOptions(maxAge = SESSION_COOKIE_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}

export async function getSessionUserId(): Promise<string | null> {
  return (await cookies()).get(USER_ID_COOKIE)?.value ?? null;
}

export async function getSessionBusinessId(): Promise<string | null> {
  const jar = await cookies();
  const businessId = jar.get(BUSINESS_ID_COOKIE)?.value ?? null;
  if (!businessId) return null;

  // Read-only expiry check — do not slide idle window here.
  const supportOk = await enforceSupportSessionIdle(businessId, { touch: false });
  if (!supportOk) return null;
  return businessId;
}

export async function isBusinessSupportSession(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(SUPPORT_FLAG_COOKIE)?.value === '1';
}

export async function getBusinessSupportIdleDeadline(): Promise<number | null> {
  const jar = await cookies();
  if (jar.get(SUPPORT_FLAG_COOKIE)?.value !== '1') return null;
  const active = Number(jar.get(SUPPORT_ACTIVE_COOKIE)?.value || 0);
  if (!Number.isFinite(active) || active <= 0) return null;
  return active + SUPPORT_SESSION_IDLE_MS;
}

/**
 * If this is a support session, expire after 15 minutes of inactivity.
 * Pass touch:true only when the admin is actively using the panel.
 */
async function enforceSupportSessionIdle(
  businessId: string,
  options?: { touch?: boolean },
): Promise<boolean> {
  const jar = await cookies();
  if (jar.get(SUPPORT_FLAG_COOKIE)?.value !== '1') return true;

  const activeRaw = jar.get(SUPPORT_ACTIVE_COOKIE)?.value;
  const lastActive = Number(activeRaw || 0);
  const now = Date.now();

  if (!Number.isFinite(lastActive) || lastActive <= 0 || now - lastActive > SUPPORT_SESSION_IDLE_MS) {
    await clearBusinessSessionCookies();
    return false;
  }

  if (options?.touch) {
    const opts = getSessionCookieOptions(SUPPORT_SESSION_COOKIE_MAX_AGE);
    jar.set(BUSINESS_ID_COOKIE, businessId, opts);
    jar.set(SUPPORT_FLAG_COOKIE, '1', opts);
    jar.set(SUPPORT_ACTIVE_COOKIE, String(now), opts);
  }

  return true;
}

/**
 * Slide the support idle window after real user activity.
 * Returns a fresh deadline from Date.now() (do not re-read request cookies —
 * cookies().get still reflects the incoming request, not the Set-Cookie we just wrote).
 */
export async function touchSupportSessionActivity(): Promise<
  | { ok: true; idleDeadlineMs: number; businessId: string }
  | { ok: false }
> {
  const jar = await cookies();
  const businessId = jar.get(BUSINESS_ID_COOKIE)?.value ?? null;
  if (!businessId) return { ok: false };
  if (jar.get(SUPPORT_FLAG_COOKIE)?.value !== '1') return { ok: false };

  const ok = await enforceSupportSessionIdle(businessId, { touch: true });
  if (!ok) return { ok: false };

  return {
    ok: true,
    businessId,
    idleDeadlineMs: Date.now() + SUPPORT_SESSION_IDLE_MS,
  };
}

export async function assertUserSession(userId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const sessionId = await getSessionUserId();
  if (!sessionId || sessionId !== userId) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true };
}

export async function assertBusinessSession(businessId: string): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const sessionId = await getSessionBusinessId();
  if (!sessionId || sessionId !== businessId) {
    return { ok: false, error: 'Unauthorized' };
  }
  return { ok: true };
}

export async function clearBusinessSessionCookies() {
  const jar = await cookies();
  jar.delete(BUSINESS_ID_COOKIE);
  jar.delete(SUPPORT_FLAG_COOKIE);
  jar.delete(SUPPORT_ACTIVE_COOKIE);
}

export async function setUserSessionCookie(userId: string) {
  const jar = await cookies();
  jar.delete(BUSINESS_ID_COOKIE);
  jar.delete(SUPPORT_FLAG_COOKIE);
  jar.delete(SUPPORT_ACTIVE_COOKIE);
  jar.delete(USER_ID_COOKIE);
  jar.set(USER_ID_COOKIE, userId, getSessionCookieOptions());
}

export async function setBusinessSessionCookie(
  businessId: string,
  options?: { maxAge?: number; supportSession?: boolean },
) {
  const jar = await cookies();
  jar.delete(USER_ID_COOKIE);
  jar.delete(BUSINESS_ID_COOKIE);
  jar.delete(SUPPORT_FLAG_COOKIE);
  jar.delete(SUPPORT_ACTIVE_COOKIE);

  const maxAge = options?.maxAge ?? SESSION_COOKIE_MAX_AGE;
  const cookieOpts = getSessionCookieOptions(maxAge);
  jar.set(BUSINESS_ID_COOKIE, businessId, cookieOpts);

  if (options?.supportSession) {
    jar.set(SUPPORT_FLAG_COOKIE, '1', cookieOpts);
    jar.set(SUPPORT_ACTIVE_COOKIE, String(Date.now()), cookieOpts);
  }
}

/** Attach merchant (+ optional support) session cookies onto a Route Handler response. */
export function applyBusinessSessionCookies(
  response: NextResponse,
  businessId: string,
  options?: { maxAge?: number; supportSession?: boolean },
) {
  const maxAge = options?.maxAge ?? SESSION_COOKIE_MAX_AGE;
  const cookieOpts = getSessionCookieOptions(maxAge);
  const clearOpts = { ...cookieOpts, maxAge: 0 };

  response.cookies.set(USER_ID_COOKIE, '', clearOpts);
  response.cookies.set(BUSINESS_ID_COOKIE, businessId, cookieOpts);

  if (options?.supportSession) {
    response.cookies.set(SUPPORT_FLAG_COOKIE, '1', cookieOpts);
    response.cookies.set(SUPPORT_ACTIVE_COOKIE, String(Date.now()), cookieOpts);
  } else {
    response.cookies.set(SUPPORT_FLAG_COOKIE, '', clearOpts);
    response.cookies.set(SUPPORT_ACTIVE_COOKIE, '', clearOpts);
  }

  return response;
}

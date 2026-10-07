import { NextResponse } from 'next/server';
import {
  SUPPORT_SESSION_COOKIE_MAX_AGE,
  SUPPORT_SESSION_IDLE_MS,
  applyBusinessSessionCookies,
  readSignedBusinessCookie,
} from '@/lib/security/session';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SUPPORT_FLAG_COOKIE = 'business_support';
const SUPPORT_ACTIVE_COOKIE = 'business_support_active';
const BUSINESS_ID_COOKIE = 'business_id';

/**
 * Slide the support-session idle window after real admin activity.
 * Cookies are set on the JSON response so the browser always receives Set-Cookie.
 */
export async function POST() {
  try {
    const jar = await cookies();
    const businessId = await readSignedBusinessCookie();
    const isSupport = jar.get(SUPPORT_FLAG_COOKIE)?.value === '1';
    const lastActive = Number(jar.get(SUPPORT_ACTIVE_COOKIE)?.value || 0);
    const now = Date.now();

    if (!businessId || !isSupport) {
      return NextResponse.json({ ok: false, error: 'not_support_session' }, { status: 401 });
    }

    if (
      !Number.isFinite(lastActive) ||
      lastActive <= 0 ||
      now - lastActive > SUPPORT_SESSION_IDLE_MS
    ) {
      const expired = NextResponse.json({ ok: false, error: 'expired' }, { status: 401 });
      expired.cookies.set(BUSINESS_ID_COOKIE, '', { path: '/', maxAge: 0 });
      expired.cookies.set(SUPPORT_FLAG_COOKIE, '', { path: '/', maxAge: 0 });
      expired.cookies.set(SUPPORT_ACTIVE_COOKIE, '', { path: '/', maxAge: 0 });
      return expired;
    }

    const idleDeadlineMs = now + SUPPORT_SESSION_IDLE_MS;
    const response = NextResponse.json({
      ok: true,
      idleDeadlineMs,
      businessId,
    });
    applyBusinessSessionCookies(response, businessId, {
      maxAge: SUPPORT_SESSION_COOKIE_MAX_AGE,
      supportSession: true,
    });
    return response;
  } catch (error) {
    console.error('[support-session touch]', error);
    return NextResponse.json({ ok: false, error: 'touch_failed' }, { status: 500 });
  }
}

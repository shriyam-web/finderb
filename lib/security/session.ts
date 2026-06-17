import { cookies } from 'next/headers';

export const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: '/',
  };
}

export async function getSessionUserId(): Promise<string | null> {
  return (await cookies()).get('user_id')?.value ?? null;
}

export async function getSessionBusinessId(): Promise<string | null> {
  return (await cookies()).get('business_id')?.value ?? null;
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

export async function setUserSessionCookie(userId: string) {
  const jar = await cookies();
  jar.delete('user_id');
  jar.set('user_id', userId, getSessionCookieOptions());
}

export async function setBusinessSessionCookie(businessId: string) {
  const jar = await cookies();
  jar.delete('business_id');
  jar.set('business_id', businessId, getSessionCookieOptions());
}

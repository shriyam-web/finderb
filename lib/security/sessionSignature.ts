import { createHmac, timingSafeEqual } from 'crypto';

export type SessionCookieKind = 'user' | 'business' | 'team-member';

function getSecret(): string {
  const secret =
    process.env.SESSION_COOKIE_SECRET?.trim() ||
    process.env.MOBILE_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!secret) {
    throw new Error('Missing SESSION_COOKIE_SECRET / MOBILE_SESSION_SECRET for session cookies');
  }
  return secret;
}

function sign(kind: SessionCookieKind, id: string): string {
  return createHmac('sha256', getSecret()).update(`finderb-session:${kind}:${id}`).digest('base64url');
}

export function signSessionValue(kind: SessionCookieKind, id: string): string {
  return `${id}.${sign(kind, id)}`;
}

/** Returns the id when the cookie value carries a valid signature, otherwise null. */
export function verifySessionValue(kind: SessionCookieKind, raw: string | null | undefined): string | null {
  if (!raw) return null;
  const dot = raw.lastIndexOf('.');
  if (dot <= 0) return null;
  const id = raw.slice(0, dot);
  const given = Buffer.from(raw.slice(dot + 1));
  const expected = Buffer.from(sign(kind, id));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return id;
}

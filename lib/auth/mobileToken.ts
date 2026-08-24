import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

type MobileTokenPayload = {
  sub: string;
  exp: number;
  v: 1;
};

function getSecret(): string {
  const secret =
    process.env.MOBILE_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!secret) {
    throw new Error('Missing MOBILE_SESSION_SECRET / Supabase keys for mobile tokens');
  }
  return secret;
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64Url(value: string): Buffer {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  return Buffer.from(padded + pad, 'base64');
}

function sign(body: string): string {
  return toBase64Url(createHmac('sha256', getSecret()).update(body).digest());
}

export function createMobileSessionToken(userId: string): string {
  const payload: MobileTokenPayload = {
    sub: userId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    v: 1,
  };
  const body = toBase64Url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyMobileSessionToken(token: string): string | null {
  try {
    const [body, signature] = token.split('.');
    if (!body || !signature) return null;

    const expected = sign(body);
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

    const payload = JSON.parse(fromBase64Url(body).toString('utf8')) as MobileTokenPayload;
    if (payload.v !== 1 || typeof payload.sub !== 'string' || !payload.sub) return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return payload.sub;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization') || request.headers.get('Authorization');
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}

import 'server-only';

import { headers } from 'next/headers';
import {
  enforceRateLimitForKey,
  getRateLimitKey,
  type RateLimitProfile,
} from '@/lib/security/rateLimit';

export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return h.get('x-real-ip') || h.get('cf-connecting-ip') || 'unknown';
}

export async function enforceRateLimit(
  profile: RateLimitProfile,
  suffix = ''
): Promise<{ ok: true } | { ok: false; error: string }> {
  const ip = await getClientIp();
  const key = getRateLimitKey(profile, ip, suffix);
  const result = enforceRateLimitForKey(key, profile);

  if (!result.allowed) {
    return {
      ok: false,
      error: `Too many requests. Please try again in ${result.retryAfterSec} seconds.`,
    };
  }

  return { ok: true };
}

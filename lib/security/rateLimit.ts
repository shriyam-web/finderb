export type RateLimitConfig = {
  limit: number;
  windowMs: number;
};

export const RATE_LIMITS = {
  /** Login attempts per IP (mobile carriers put many phones behind one IP) */
  auth: { limit: 30, windowMs: 15 * 60 * 1000 },
  /** Sign-in status polling while Truecaller verifies (about one request a second) */
  authPoll: { limit: 300, windowMs: 10 * 60 * 1000 },
  /** Login/register per email */
  authEmail: { limit: 5, windowMs: 15 * 60 * 1000 },
  /** Account creation per IP */
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  /** "Is this email / mobile already registered?" checks per IP */
  lookup: { limit: 40, windowMs: 10 * 60 * 1000 },
  /** Lead forms, reviews, job applications */
  write: { limit: 20, windowMs: 60 * 60 * 1000 },
  /** Category / search queries */
  search: { limit: 60, windowMs: 60 * 1000 },
  /** News RSS + article proxy routes */
  expensiveApi: { limit: 30, windowMs: 60 * 1000 },
  /** Google Maps geocoding */
  geocode: { limit: 40, windowMs: 60 * 1000 },
  /** Razorpay order + verify */
  payment: { limit: 15, windowMs: 60 * 60 * 1000 },
} as const satisfies Record<string, RateLimitConfig>;

export type RateLimitProfile = keyof typeof RATE_LIMITS;

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 20_000;

function pruneBuckets(now: number) {
  if (buckets.size < MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) {
      buckets.delete(key);
    }
  }

  if (buckets.size >= MAX_BUCKETS) {
    const overflow = buckets.size - MAX_BUCKETS + 1_000;
    const keys = [...buckets.keys()].slice(0, overflow);
    for (const key of keys) buckets.delete(key);
  }
}

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSec: number };

export function checkRateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  pruneBuckets(now);

  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true };
  }

  if (bucket.count >= config.limit) {
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

export function getRateLimitKey(profile: RateLimitProfile, ip: string, suffix = ''): string {
  return suffix ? `${profile}:${ip}:${suffix}` : `${profile}:${ip}`;
}

export function enforceRateLimitForKey(
  key: string,
  profile: RateLimitProfile
): RateLimitResult {
  return checkRateLimit(key, RATE_LIMITS[profile]);
}

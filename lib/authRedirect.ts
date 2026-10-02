const BLOCKED_PREFIXES = ['/login', '/signup', '/business/login', '/business/register'];

export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback = '/dashboard'
): string {
  if (!path) return fallback;

  const trimmed = path.trim();
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return fallback;

  const pathname = trimmed.split(/[?#]/)[0];
  if (BLOCKED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return fallback;
  }

  return trimmed;
}

export const MERCHANT_HOME_PATH = '/business/dashboard';

/** The merchant panel; public listing pages also live under `/business/<slug>`. */
export function isMerchantPortalPath(path: string): boolean {
  const pathname = path.split(/[?#]/)[0];
  return pathname === MERCHANT_HOME_PATH || pathname.startsWith(`${MERCHANT_HOME_PATH}/`);
}

export function buildLoginHref(redirectPath: string): string {
  return `/login?redirect=${encodeURIComponent(redirectPath)}`;
}

export function buildSignupHref(redirectPath: string): string {
  return `/signup?redirect=${encodeURIComponent(redirectPath)}`;
}

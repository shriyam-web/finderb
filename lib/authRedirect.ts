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

export function buildLoginHref(redirectPath: string): string {
  return `/login?redirect=${encodeURIComponent(redirectPath)}`;
}

export function buildSignupHref(redirectPath: string): string {
  return `/signup?redirect=${encodeURIComponent(redirectPath)}`;
}

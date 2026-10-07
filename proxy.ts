import { NextResponse, type NextRequest } from 'next/server';
import { redirectLegacyBusinessProfile } from '@/lib/businessProfileRedirect';
import { businessSubdomainDestination } from '@/lib/businessSubdomain';
import { redirectLegacyTouristPlaceProfile } from '@/lib/touristPlaceProfileRedirect';
import {
  enforceRateLimitForKey,
  getRateLimitKey,
  type RateLimitProfile,
} from '@/lib/security/rateLimit';
import { type SessionCookieKind, verifySessionValue } from '@/lib/security/sessionSignature';

function getRequestIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown';
  }
  return request.headers.get('x-real-ip') || request.headers.get('cf-connecting-ip') || 'unknown';
}

function rateLimitApi(request: NextRequest, profile: RateLimitProfile) {
  const ip = getRequestIp(request);
  const path = request.nextUrl.pathname;
  const key = getRateLimitKey(profile, ip, path);
  const result = enforceRateLimitForKey(key, profile);

  if (!result.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(result.retryAfterSec) },
      }
    );
  }

  return null;
}

function requireSession(
  request: NextRequest,
  cookieName: string,
  kind: SessionCookieKind,
  loginPath: string
): NextResponse | null {
  const raw = request.cookies.get(cookieName)?.value;
  if (verifySessionValue(kind, raw)) {
    return null;
  }

  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  const response = NextResponse.redirect(loginUrl);
  if (raw) response.cookies.set(cookieName, '', { path: '/', maxAge: 0 });
  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const businessHostUrl = businessSubdomainDestination(
    request.headers.get('x-forwarded-host') || request.headers.get('host'),
    pathname,
    request.nextUrl.search,
  );
  if (businessHostUrl) {
    return NextResponse.redirect(businessHostUrl, 308);
  }

  const legacyBusinessRedirect = await redirectLegacyBusinessProfile(request);
  if (legacyBusinessRedirect) return legacyBusinessRedirect;

  const legacyTouristRedirect = await redirectLegacyTouristPlaceProfile(request);
  if (legacyTouristRedirect) return legacyTouristRedirect;

  if (pathname.startsWith('/api/news')) {
    const blocked = rateLimitApi(request, 'expensiveApi');
    if (blocked) return blocked;
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const blocked = requireSession(request, 'user_id', 'user', '/login');
    if (blocked) return blocked;
  }

  if (
    pathname === '/business/dashboard' ||
    pathname.startsWith('/business/dashboard/') ||
    pathname.startsWith('/business/kyc/') ||
    pathname.startsWith('/business/payment/')
  ) {
    const blocked = requireSession(request, 'business_id', 'business', '/business/login');
    if (blocked) return blocked;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};

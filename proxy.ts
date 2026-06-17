import { NextResponse, type NextRequest } from 'next/server';
import {
  enforceRateLimitForKey,
  getRateLimitKey,
  type RateLimitProfile,
} from '@/lib/security/rateLimit';

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

function requireCookie(
  request: NextRequest,
  cookieName: string,
  loginPath: string
): NextResponse | null {
  if (request.cookies.get(cookieName)?.value) {
    return null;
  }

  const loginUrl = new URL(loginPath, request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/api/news')) {
    const blocked = rateLimitApi(request, 'expensiveApi');
    if (blocked) return blocked;
  }

  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    const blocked = requireCookie(request, 'user_id', '/login');
    if (blocked) return blocked;
  }

  if (
    pathname === '/business/dashboard' ||
    pathname.startsWith('/business/dashboard/') ||
    pathname.startsWith('/business/kyc/') ||
    pathname.startsWith('/business/payment/')
  ) {
    const blocked = requireCookie(request, 'business_id', '/business/login');
    if (blocked) return blocked;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/news/:path*',
    '/dashboard',
    '/dashboard/:path*',
    '/business/dashboard',
    '/business/dashboard/:path*',
    '/business/kyc/:path*',
    '/business/payment/:path*',
  ],
};

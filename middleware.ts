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

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/api/news')) {
    const blocked = rateLimitApi(request, 'expensiveApi');
    if (blocked) return blocked;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/news/:path*'],
};

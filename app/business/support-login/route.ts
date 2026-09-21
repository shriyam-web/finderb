import { NextResponse } from 'next/server';
import {
  redeemSupportLoginCode,
  redeemSupportLoginToken,
} from '@/lib/auth/supportLogin.server';
import {
  SUPPORT_SESSION_COOKIE_MAX_AGE,
  applyBusinessSessionCookies,
} from '@/lib/security/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function firstParam(value: string | null): string {
  return String(value || '').trim();
}

/**
 * Redeems a one-time support login code/token and sets the merchant session cookie.
 * Must be a Route Handler (not a Server Component) so Set-Cookie on redirect is allowed.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = firstParam(url.searchParams.get('code'));
    const token = firstParam(url.searchParams.get('token'));

    if (!code && !token) {
      return NextResponse.redirect(
        new URL('/business/login?error=support_token_missing', request.url),
      );
    }

    const result = code
      ? await redeemSupportLoginCode(code)
      : await redeemSupportLoginToken(token);

    if (!result.success) {
      return NextResponse.redirect(
        new URL(
          `/business/login?error=${encodeURIComponent(result.error || 'support_login_failed')}`,
          request.url,
        ),
      );
    }

    const response = NextResponse.redirect(
      new URL('/business/dashboard?support=1', request.url),
    );
    applyBusinessSessionCookies(response, result.businessId, {
      maxAge: SUPPORT_SESSION_COOKIE_MAX_AGE,
      supportSession: true,
    });
    return response;
  } catch (error) {
    console.error('[support-login redeem]', error);
    return NextResponse.redirect(
      new URL(
        `/business/login?error=${encodeURIComponent('Support login failed. Please try again from Admin.')}`,
        request.url,
      ),
    );
  }
}

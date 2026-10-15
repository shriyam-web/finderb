import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { syncOAuthUserToAppSession } from '@/lib/auth/syncOAuthUser.server';
import { openMerchantPortalForUser } from '@/lib/auth/merchantPortal.server';
import { userNeedsMobile } from '@/lib/auth/phoneVerify.server';
import { VERIFY_MOBILE_PATH } from '@/lib/mobileGate';
import {
  getSafeRedirectPath,
  isMerchantPortalPath,
  MERCHANT_HOME_PATH,
} from '@/lib/authRedirect';
import { withLoginRole } from '@/lib/loginRole';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = getSafeRedirectPath(searchParams.get('next'));
  const oauthError = searchParams.get('error_description') || searchParams.get('error');

  if (oauthError) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(oauthError)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_oauth_code`);
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    console.error('[oauth callback] exchange failed:', error);
    return NextResponse.redirect(`${origin}/login?error=oauth_exchange_failed`);
  }

  const syncResult = await syncOAuthUserToAppSession(data.user);

  await supabase.auth.signOut();

  if (!syncResult.success) {
    const params = new URLSearchParams({ error: syncResult.error });
    if (syncResult.suggestedLoginPath) {
      params.set('suggested', syncResult.suggestedLoginPath);
    }
    return NextResponse.redirect(`${origin}/login?${params.toString()}`);
  }

  const merchantLogin = isMerchantPortalPath(next);
  const linked = await openMerchantPortalForUser(syncResult.userId);
  if (merchantLogin && !linked) {
    const message =
      'This Google account is not linked to a FinderB business. Register your business, or sign in with your work email.';
    return NextResponse.redirect(
      `${origin}/business/login?error=${encodeURIComponent(message)}`,
    );
  }
  // Business owners signing in from the customer page land in their panel too.
  if (linked && (merchantLogin || next === '/dashboard')) {
    return NextResponse.redirect(`${origin}${withLoginRole(MERCHANT_HOME_PATH, 'business')}`);
  }

  const redirectUrl = new URL(next, origin);
  redirectUrl.searchParams.set('as', linked ? 'business' : 'user');
  if (syncResult.isNewUser) {
    redirectUrl.searchParams.set('welcome', '1');
  }
  if (!linked && (await userNeedsMobile(syncResult.userId))) {
    const verifyUrl = new URL(VERIFY_MOBILE_PATH, origin);
    verifyUrl.searchParams.set('next', `${redirectUrl.pathname}${redirectUrl.search}`);
    return NextResponse.redirect(verifyUrl.toString());
  }
  return NextResponse.redirect(redirectUrl.toString());
}

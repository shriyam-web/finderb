import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { syncOAuthUserToAppSession } from '@/lib/auth/syncOAuthUser.server';
import { openMerchantPortalForUser } from '@/lib/auth/merchantPortal.server';
import { getSafeRedirectPath } from '@/lib/authRedirect';

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

  if (next.startsWith('/business')) {
    const linked = await openMerchantPortalForUser(syncResult.userId);
    if (!linked) {
      const message =
        'This Google account is not linked to a FinderB business. Register your business, or sign in with your work email.';
      return NextResponse.redirect(
        `${origin}/business/login?error=${encodeURIComponent(message)}`,
      );
    }
    return NextResponse.redirect(`${origin}/business/dashboard`);
  }

  const redirectUrl = new URL(next, origin);
  if (syncResult.isNewUser) {
    redirectUrl.searchParams.set('welcome', '1');
  }
  return NextResponse.redirect(redirectUrl.toString());
}

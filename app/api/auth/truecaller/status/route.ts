import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  getSafeRedirectPath,
  isMerchantPortalPath,
  MERCHANT_HOME_PATH,
} from '@/lib/authRedirect';
import { mobileAuthSuccessForUserId } from '@/lib/auth/mobileAuth.server';
import { isValidTruecallerRequestId } from '@/lib/auth/truecallerConfig';
import { getTruecallerAuthRequest } from '@/lib/auth/truecallerPendingStore.server';
import { setUserSessionCookie } from '@/lib/security/session';
import { openMerchantPortalForUser } from '@/lib/auth/merchantPortal.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const ipLimit = await enforceRateLimit('authPoll');
  if (!ipLimit.ok) {
    return NextResponse.json({ error: ipLimit.error }, { status: 429 });
  }

  const { searchParams } = new URL(request.url);
  const requestId = searchParams.get('requestId')?.trim() ?? '';
  const client = searchParams.get('client')?.trim() ?? '';

  if (!isValidTruecallerRequestId(requestId)) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  try {
    const record = await getTruecallerAuthRequest(requestId);
    if (!record) {
      return NextResponse.json({ status: 'pending' });
    }

    if (record.status === 'completed' && record.userId) {
      if (client === 'mobile') {
        const auth = await mobileAuthSuccessForUserId(
          record.userId,
          Boolean(record.isNewUser)
        );
        if (!auth.success) {
          return NextResponse.json({
            status: 'error',
            error: auth.error,
          });
        }
        return NextResponse.json({
          status: 'completed',
          token: auth.token,
          user: auth.user,
          isNewUser: Boolean(record.isNewUser),
        });
      }

      const redirectPath = getSafeRedirectPath(record.redirectPath);
      const merchantLogin = isMerchantPortalPath(redirectPath);
      if (!merchantLogin) await setUserSessionCookie(record.userId);
      const linked = await openMerchantPortalForUser(record.userId);
      if (merchantLogin && !linked) {
        return NextResponse.json({
          status: 'error',
          error:
            'This Truecaller number is not linked to a FinderB business. Use your work email, or register the business first.',
        });
      }
      // Business owners signing in from the customer page land in their panel too.
      if (linked && (merchantLogin || redirectPath === '/dashboard')) {
        return NextResponse.json({
          status: 'completed',
          redirectUrl: MERCHANT_HOME_PATH,
          isNewUser: Boolean(record.isNewUser),
        });
      }

      const redirectUrl = new URL(redirectPath, request.url);
      if (record.isNewUser) {
        redirectUrl.searchParams.set('welcome', '1');
      }
      return NextResponse.json({
        status: 'completed',
        redirectUrl: `${redirectUrl.pathname}${redirectUrl.search}`,
        isNewUser: Boolean(record.isNewUser),
      });
    }

    if (record.status === 'user_rejected') {
      return NextResponse.json({
        status: 'user_rejected',
        error: record.errorMessage || 'Verification was cancelled.',
      });
    }

    if (record.status === 'error') {
      return NextResponse.json({
        status: 'error',
        error: record.errorMessage || 'Truecaller verification failed.',
        suggestedLoginPath: record.suggestedLoginPath,
      });
    }

    return NextResponse.json({ status: record.status });
  } catch (error) {
    console.error('[truecaller status]', error);
    return NextResponse.json(
      { status: 'error', error: 'Could not check verification status.' },
      { status: 500 }
    );
  }
}

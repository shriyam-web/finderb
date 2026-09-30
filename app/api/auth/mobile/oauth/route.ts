import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { mobileLoginWithSupabaseAccessToken } from '@/lib/auth/mobileAuth.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  const ipLimit = await enforceRateLimit('auth');
  if (!ipLimit.ok) {
    return mobileApiJson({ success: false, error: ipLimit.error }, 429);
  }

  try {
    const body = (await request.json()) as { accessToken?: string };
    const accessToken = String(body.accessToken || '').trim();
    if (!accessToken) {
      return mobileApiJson({ success: false, error: 'Missing access token.' }, 400);
    }

    const result = await mobileLoginWithSupabaseAccessToken(accessToken);
    return mobileApiJson(result, result.success ? 200 : 401);
  } catch (error) {
    console.error('[mobile oauth]', error);
    return mobileApiJson({ success: false, error: 'Social sign-in failed. Please try again.' }, 500);
  }
}

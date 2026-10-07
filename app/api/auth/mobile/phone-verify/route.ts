import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import {
  requestPhoneVerifyCode,
  startTruecallerPhoneVerify,
  truecallerPhoneVerifyStatus,
  verifyPhoneCode,
} from '@/lib/auth/phoneVerify.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

async function signedInUserId(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  const user = await mobileGetUserFromToken(token);
  return user?.id ?? null;
}

export async function GET(request: Request) {
  const limit = await enforceRateLimit('authPoll', 'phone-verify');
  if (!limit.ok) return mobileApiJson({ status: 'pending' }, 429);
  const userId = await signedInUserId(request);
  if (!userId) return mobileApiJson({ status: 'error', error: 'Please log in.' }, 401);
  const requestId = new URL(request.url).searchParams.get('requestId')?.trim() ?? '';
  try {
    return mobileApiJson(await truecallerPhoneVerifyStatus(userId, requestId));
  } catch (error) {
    console.error('[phone verify status]', error);
    return mobileApiJson({ status: 'pending' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await signedInUserId(request);
    if (!userId) return mobileApiJson({ success: false, error: 'Please log in.' }, 401);

    const body = (await request.json()) as {
      method?: 'whatsapp' | 'truecaller';
      phone?: string;
      code?: string;
      requestId?: string;
    };

    const result =
      body.method === 'truecaller'
        ? await startTruecallerPhoneVerify(userId, String(body.requestId || '').trim())
        : body.code
          ? await verifyPhoneCode(userId, body.phone, String(body.code).trim())
          : await requestPhoneVerifyCode(userId, body.phone);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[phone verify]', error);
    return mobileApiJson(
      { success: false, error: 'Could not verify this mobile number. Please try again.' },
      500,
    );
  }
}

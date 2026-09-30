import {
  isMerchantEmailOtpConfigured,
  requestMerchantRegisterEmailOtp,
  verifyMerchantRegisterEmailOtp,
} from '@/lib/auth/emailOtp.server';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function GET() {
  return mobileApiJson({ required: isMerchantEmailOtpConfigured() });
}

export async function POST(request: Request) {
  const limit = await enforceRateLimit('auth');
  if (!limit.ok) {
    return mobileApiJson({ success: false, error: limit.error }, 429);
  }

  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = String(body.email || '').trim();
    const code = String(body.code || '').trim();
    const result = code
      ? await verifyMerchantRegisterEmailOtp(email, code)
      : await requestMerchantRegisterEmailOtp(email);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[business otp]', error);
    return mobileApiJson({ success: false, error: 'Could not verify that email.' }, 500);
  }
}

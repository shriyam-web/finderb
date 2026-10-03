import { requestUserEmailOtp, verifyUserEmailOtp } from '@/lib/auth/emailOtp.server';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = String(body.email || '').trim();
    const code = String(body.code || '').trim();
    const result = code
      ? await verifyUserEmailOtp(email, code)
      : await requestUserEmailOtp(email);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[user email otp]', error);
    return mobileApiJson({ success: false, error: 'Could not verify that email.' }, 500);
  }
}

import { NextResponse } from 'next/server';
import {
  isMerchantEmailOtpConfigured,
  requestMerchantRegisterEmailOtp,
  verifyMerchantRegisterEmailOtp,
} from '@/lib/auth/emailOtp.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({ required: isMerchantEmailOtpConfigured() });
}

export async function POST(request: Request) {
  const limit = await enforceRateLimit('auth');
  if (!limit.ok) {
    return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { email?: string; code?: string };
    const email = String(body.email || '').trim();
    const code = String(body.code || '').trim();
    const result = code
      ? await verifyMerchantRegisterEmailOtp(email, code)
      : await requestMerchantRegisterEmailOtp(email);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[business otp]', error);
    return NextResponse.json(
      { success: false, error: 'Could not verify that email.' },
      { status: 500 },
    );
  }
}

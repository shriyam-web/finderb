import {
  isMerchantEmailOtpConfigured,
  requestMerchantRegisterEmailOtp,
  verifyMerchantRegisterEmailOtp,
} from '@/lib/auth/emailOtp.server';
import {
  requestMerchantRegisterPhoneCode,
  verifyMerchantRegisterPhoneCode,
} from '@/lib/auth/phoneVerify.server';
import { isWhatsAppOtpConfigured } from '@/lib/whatsapp/cloudConfig';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function GET() {
  return mobileApiJson({
    required: isMerchantEmailOtpConfigured(),
    phoneRequired: isWhatsAppOtpConfigured(),
  });
}

/** `{ email[, code] }` verifies the work email; `{ phone[, code] }` verifies the owner mobile on WhatsApp. */
export async function POST(request: Request) {
  const limit = await enforceRateLimit('auth');
  if (!limit.ok) {
    return mobileApiJson({ success: false, error: limit.error }, 429);
  }

  try {
    const body = (await request.json()) as { email?: string; phone?: string; code?: string };
    const code = String(body.code || '').trim();
    const phone = String(body.phone || '').trim();
    if (phone) {
      const result = code
        ? await verifyMerchantRegisterPhoneCode(phone, code)
        : await requestMerchantRegisterPhoneCode(phone);
      return mobileApiJson(result, result.success ? 200 : 400);
    }
    const email = String(body.email || '').trim();
    const result = code
      ? await verifyMerchantRegisterEmailOtp(email, code)
      : await requestMerchantRegisterEmailOtp(email);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[business otp]', error);
    return mobileApiJson({ success: false, error: 'Could not verify that code.' }, 500);
  }
}

import {
  completeWhatsAppLogin,
  requestWhatsAppLoginOtp,
} from '@/lib/auth/whatsappOtp.server';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      phone?: string;
      code?: string;
      audience?: string;
      client?: 'web' | 'mobile';
      redirectPath?: string;
    };
    const phone = String(body.phone || '');
    const code = String(body.code || '').trim();
    const result = code
      ? await completeWhatsAppLogin({
          phone,
          code,
          audience: body.audience,
          client: body.client,
          redirectPath: body.redirectPath,
        })
      : await requestWhatsAppLoginOtp({ phone, audience: body.audience });
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[whatsapp otp]', error);
    return mobileApiJson(
      { success: false, error: 'Could not complete WhatsApp sign-in. Please try again.' },
      500,
    );
  }
}

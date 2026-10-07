import {
  completeWhatsAppInboundLogin,
  getWhatsAppInboundStatus,
  startWhatsAppInboundLogin,
} from '@/lib/auth/whatsappInbound.server';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function GET(request: Request) {
  const limit = await enforceRateLimit('authPoll', 'whatsapp-inbound');
  if (!limit.ok) return mobileApiJson({ status: 'pending' }, 429);
  const { searchParams } = new URL(request.url);
  try {
    const result = await getWhatsAppInboundStatus(
      searchParams.get('ref'),
      searchParams.get('requestId'),
    );
    return mobileApiJson(result);
  } catch (error) {
    console.error('[whatsapp inbound status]', error);
    return mobileApiJson({ status: 'pending' }, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      action?: string;
      audience?: string;
      ref?: string;
      requestId?: string;
      code?: string;
      client?: 'web' | 'mobile';
      redirectPath?: string;
    };

    if (body.action === 'verify') {
      const result = await completeWhatsAppInboundLogin({
        ref: body.ref,
        requestId: body.requestId,
        code: String(body.code || '').trim(),
        client: body.client,
        redirectPath: body.redirectPath,
      });
      return mobileApiJson(result, result.success ? 200 : 400);
    }

    const result = await startWhatsAppInboundLogin(body.audience);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[whatsapp inbound]', error);
    return mobileApiJson(
      { success: false, error: 'Could not complete WhatsApp sign-in. Please try again.' },
      500,
    );
  }
}

import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { notifyListingLive } from '@/lib/business/notifyListingLive';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function dispatchAuthorized(request: Request): boolean {
  const configured = process.env.FINDERB_DISPATCH_SECRET?.trim();
  if (!configured) return true;
  const header =
    request.headers.get('x-finderb-dispatch') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  return header.trim() === configured;
}

/**
 * Called by FinderB Admin after setting Business.status = Active.
 * Body: { businessId: string, preview?: boolean }
 * preview composes the email, WhatsApp, and in-app copy without sending.
 */
export async function POST(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'listing-live-email');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      businessId?: string;
      preview?: boolean;
    } | null;

    const result = await notifyListingLive(String(body?.businessId || ''), {
      preview: body?.preview === true,
    });
    const status = result.success ? 200 : result.reason?.includes('not found') ? 404 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('[listing-live]', error);
    return NextResponse.json(
      { success: false, sent: false, reason: 'Could not send listing-live email.' },
      { status: 500 },
    );
  }
}

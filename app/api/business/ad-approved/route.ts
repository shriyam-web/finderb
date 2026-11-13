import { NextResponse } from 'next/server';
import { notifyAdApproved } from '@/lib/promotions/notifyAdApproved';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

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

/** Called by FinderB Admin after an ad is approved. Emails the business and saves an in-app alert. */
export async function POST(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'ad-approved-notice');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = (await request.json().catch(() => null)) as { orderId?: string } | null;
    const result = await notifyAdApproved(String(body?.orderId || ''));
    const status = result.success ? 200 : result.reason?.includes('not found') ? 404 : 400;
    return NextResponse.json(result, { status });
  } catch (error) {
    console.error('[ad-approved]', error);
    return NextResponse.json(
      { success: false, reason: 'Could not send the approval notice.' },
      { status: 500 },
    );
  }
}

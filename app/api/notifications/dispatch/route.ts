import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { dispatchBroadcastPush } from '@/lib/userNotifications.server';

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

export async function POST(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'broadcast-dispatch');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { broadcastId?: string } | null;
    const result = await dispatchBroadcastPush(String(body?.broadcastId || ''));
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[notifications dispatch]', error);
    return NextResponse.json(
      { success: false, error: 'Could not dispatch notifications.' },
      { status: 500 }
    );
  }
}

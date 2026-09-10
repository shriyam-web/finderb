import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { getSessionBusinessId, getSessionUserId } from '@/lib/security/session';
import { getBearerToken, verifyMobileSessionToken } from '@/lib/auth/mobileToken';
import { recordBroadcastReads } from '@/lib/broadcastReads.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const limit = await enforceRateLimit('search', 'broadcast-reads');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }

    const body = (await request.json().catch(() => null)) as { ids?: unknown } | null;
    const ids = Array.isArray(body?.ids)
      ? body.ids.map((id) => String(id || '').trim()).filter(Boolean)
      : [];

    const bearer = getBearerToken(request);
    const mobileUserId = bearer ? verifyMobileSessionToken(bearer) : null;
    const cookieUserId = await getSessionUserId();
    const cookieBusinessId = await getSessionBusinessId();

    if (mobileUserId || cookieUserId) {
      await recordBroadcastReads({
        readerId: mobileUserId || cookieUserId || '',
        readerType: 'user',
        broadcastIds: ids,
      });
      return NextResponse.json({ success: true });
    }

    if (cookieBusinessId) {
      await recordBroadcastReads({
        readerId: cookieBusinessId,
        readerType: 'merchant',
        broadcastIds: ids,
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, error: 'Sign in required.' }, { status: 401 });
  } catch (error) {
    console.error('[notifications read]', error);
    return NextResponse.json(
      { success: false, error: 'Could not record reads.' },
      { status: 500 },
    );
  }
}

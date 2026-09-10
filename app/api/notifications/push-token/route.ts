import { NextResponse } from 'next/server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { upsertUserPushToken } from '@/lib/userNotifications.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'push-token');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    const token = getBearerToken(request);
    let userId = 'guest';
    if (token) {
      const user = await mobileGetUserFromToken(token);
      if (user?.id) userId = user.id;
    }

    const body = (await request.json().catch(() => null)) as {
      token?: string;
      platform?: string;
    } | null;

    const result = await upsertUserPushToken({
      userId,
      token: String(body?.token || ''),
      platform: String(body?.platform || ''),
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[push-token]', error);
    return NextResponse.json(
      { success: false, error: 'Could not save notification token.' },
      { status: 500 }
    );
  }
}

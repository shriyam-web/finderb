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
    let businessId: string | null = null;
    if (token) {
      const user = await mobileGetUserFromToken(token);
      if (user?.id) userId = user.id;
      if (user?.isBusinessAccount && user.businessId) businessId = user.businessId;
    }

    const body = (await request.json().catch(() => null)) as {
      token?: string;
      fcmToken?: string;
      platform?: string;
    } | null;

    const tokens = [
      String(body?.token || '').trim(),
      String(body?.fcmToken || '').trim(),
    ].filter((value, index, list) => value.length >= 20 && list.indexOf(value) === index);

    if (!tokens.length) {
      return NextResponse.json(
        { success: false, error: 'Invalid push token.' },
        { status: 400 },
      );
    }

    let last = { success: true as const };
    for (const pushToken of tokens) {
      const result = await upsertUserPushToken({
        userId,
        token: pushToken,
        platform: String(body?.platform || ''),
        businessId,
      });
      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }
      last = result;
    }

    return NextResponse.json(last, { status: 200 });
  } catch (error) {
    console.error('[push-token]', error);
    return NextResponse.json(
      { success: false, error: 'Could not save notification token.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { getBearerToken, verifyMobileSessionToken } from '@/lib/auth/mobileToken';
import {
  dispatchPendingBroadcastPushes,
  listUserNotifications,
} from '@/lib/userNotifications.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const bearer = getBearerToken(request);
    const mobileUserId = bearer ? verifyMobileSessionToken(bearer) : null;
    const notifications = await listUserNotifications(50, mobileUserId);
    void dispatchPendingBroadcastPushes().catch(() => undefined);
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('[notifications get]', error);
    return NextResponse.json(
      { success: false, error: 'Could not load notifications.' },
      { status: 500 }
    );
  }
}

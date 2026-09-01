import { NextResponse } from 'next/server';
import { listUserNotifications } from '@/lib/userNotifications.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const notifications = await listUserNotifications(50);
    return NextResponse.json({ success: true, notifications });
  } catch (error) {
    console.error('[notifications get]', error);
    return NextResponse.json(
      { success: false, error: 'Could not load notifications.' },
      { status: 500 }
    );
  }
}

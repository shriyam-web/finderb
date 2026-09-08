import { NextResponse } from 'next/server';
import { requestPasswordReset } from '@/lib/auth/passwordReset.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ipLimit = await enforceRateLimit('auth');
  if (!ipLimit.ok) {
    return NextResponse.json({ success: false, error: ipLimit.error }, { status: 429 });
  }

  try {
    const body = (await request.json().catch(() => null)) as { email?: string } | null;
    const email = String(body?.email || '').trim().toLowerCase();

    const emailLimit = await enforceRateLimit('authEmail', `forgot-password:${email}`);
    if (!emailLimit.ok) {
      return NextResponse.json({ success: false, error: emailLimit.error }, { status: 429 });
    }

    const result = await requestPasswordReset(email);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[forgot-password]', error);
    return NextResponse.json(
      { success: false, error: 'Could not start a password reset. Please try again.' },
      { status: 500 }
    );
  }
}

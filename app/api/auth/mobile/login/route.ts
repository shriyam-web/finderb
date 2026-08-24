import { NextResponse } from 'next/server';
import { mobileLoginWithPassword } from '@/lib/auth/mobileAuth.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ipLimit = await enforceRateLimit('auth');
  if (!ipLimit.ok) {
    return NextResponse.json({ success: false, error: ipLimit.error }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email || '').trim();
    const password = String(body.password || '');

    const emailLimit = await enforceRateLimit(
      'authEmail',
      `mobile-login:${email.toLowerCase()}`
    );
    if (!emailLimit.ok) {
      return NextResponse.json({ success: false, error: emailLimit.error }, { status: 429 });
    }

    const result = await mobileLoginWithPassword(email, password);
    return NextResponse.json(result, { status: result.success ? 200 : 401 });
  } catch (error) {
    console.error('[mobile login]', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}

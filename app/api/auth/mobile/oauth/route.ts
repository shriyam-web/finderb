import { NextResponse } from 'next/server';
import { mobileLoginWithSupabaseAccessToken } from '@/lib/auth/mobileAuth.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const ipLimit = await enforceRateLimit('auth');
  if (!ipLimit.ok) {
    return NextResponse.json({ success: false, error: ipLimit.error }, { status: 429 });
  }

  try {
    const body = (await request.json()) as { accessToken?: string };
    const accessToken = String(body.accessToken || '').trim();
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: 'Missing access token.' },
        { status: 400 }
      );
    }

    const result = await mobileLoginWithSupabaseAccessToken(accessToken);
    return NextResponse.json(result, { status: result.success ? 200 : 401 });
  } catch (error) {
    console.error('[mobile oauth]', error);
    return NextResponse.json(
      { success: false, error: 'Social sign-in failed. Please try again.' },
      { status: 500 }
    );
  }
}

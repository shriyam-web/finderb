import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  mintSupportLoginToken,
  searchBusinessesForSupportLogin,
} from '@/lib/auth/supportLogin.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function dispatchAuthorized(request: Request): boolean {
  const configured =
    process.env.FINDERB_SUPPORT_LOGIN_SECRET?.trim() ||
    process.env.FINDERB_DISPATCH_SECRET?.trim();
  if (!configured) return true;
  const header =
    request.headers.get('x-finderb-dispatch') ||
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    '';
  return header.trim() === configured;
}

/** Admin-only: search merchants for support login. */
export async function GET(request: Request) {
  try {
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const limit = await enforceRateLimit('search', 'support-login-search');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }
    const q = new URL(request.url).searchParams.get('q') || '';
    const result = await searchBusinessesForSupportLogin(q);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[support-login search]', error);
    return NextResponse.json(
      { success: false, error: 'Search failed.' },
      { status: 500 },
    );
  }
}

/** Admin-only: mint a one-time support login token. */
export async function POST(request: Request) {
  try {
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const writeLimit = await enforceRateLimit('write', 'support-login-mint');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    const body = (await request.json().catch(() => null)) as {
      businessId?: string;
      adminId?: string;
      adminEmail?: string;
      reason?: string;
    } | null;

    const result = await mintSupportLoginToken({
      businessId: String(body?.businessId || ''),
      adminId: String(body?.adminId || ''),
      adminEmail: body?.adminEmail,
      reason: body?.reason,
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[support-login mint]', error);
    return NextResponse.json(
      { success: false, error: 'Could not mint support login token.' },
      { status: 500 },
    );
  }
}

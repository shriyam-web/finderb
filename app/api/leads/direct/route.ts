import { NextResponse } from 'next/server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { isContactIntent } from '@/lib/directLead';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { recordDirectLeadForActor } from '@/lib/submitLeadsCore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      businessId?: string;
      channel?: string;
    } | null;

    const businessId = String(body?.businessId || '').trim();
    const writeLimit = await enforceRateLimit('write', `direct-lead:${businessId || 'unknown'}`);
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Sign in to contact this business.' },
        { status: 401 }
      );
    }

    const user = await mobileGetUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sign in to contact this business.' },
        { status: 401 }
      );
    }

    if (!isContactIntent(body?.channel)) {
      return NextResponse.json({ success: false, error: 'Invalid contact channel.' }, { status: 400 });
    }

    const result = await recordDirectLeadForActor({
      businessId,
      channel: body.channel,
      actor: {
        name: user.fullName || 'FinderB user',
        email: user.email || null,
        phone: user.phone || null,
      },
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[mobile direct lead]', error);
    return NextResponse.json(
      { success: false, error: 'Could not record this contact.' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { getSafeRedirectPath } from '@/lib/authRedirect';
import { isValidTruecallerRequestId } from '@/lib/auth/truecallerConfig';
import { createTruecallerAuthRequest } from '@/lib/auth/truecallerPendingStore.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type InitBody = {
  requestId?: string;
  redirectPath?: string;
};

export async function POST(request: Request) {
  try {
    const ipLimit = await enforceRateLimit('auth');
    if (!ipLimit.ok) {
      return NextResponse.json({ error: ipLimit.error }, { status: 429 });
    }

    const body = (await request.json()) as InitBody;
    const requestId = body.requestId?.trim() ?? '';
    const redirectPath = getSafeRedirectPath(body.redirectPath);

    if (!isValidTruecallerRequestId(requestId)) {
      return NextResponse.json({ error: 'Invalid verification request.' }, { status: 400 });
    }

    await createTruecallerAuthRequest(requestId, redirectPath);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[truecaller init]', error);
    return NextResponse.json(
      { error: 'Could not start Truecaller verification. Please try again.' },
      { status: 500 }
    );
  }
}

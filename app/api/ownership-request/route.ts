import { NextResponse } from 'next/server';
import { getBearerToken, verifyMobileSessionToken } from '@/lib/auth/mobileToken';
import { submitOwnershipRequest } from '@/lib/ownershipRequest.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const limit = await enforceRateLimit('search', 'ownership-request');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }
    const body = (await request.json().catch(() => null)) as {
      businessId?: string;
      name?: string;
      email?: string;
      phone?: string;
    } | null;
    const bearer = getBearerToken(request);
    const userId = bearer ? verifyMobileSessionToken(bearer) : null;
    const result = await submitOwnershipRequest(
      {
        businessId: String(body?.businessId || ''),
        name: String(body?.name || ''),
        email: String(body?.email || ''),
        phone: String(body?.phone || ''),
      },
      userId,
    );
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[ownership request]', error);
    return NextResponse.json({ success: false, error: 'Could not submit the request.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { getBearerToken, verifyMobileSessionToken } from '@/lib/auth/mobileToken';
import { pendingOwnershipForViewer, submitOwnershipRequest } from '@/lib/ownershipRequest.server';
import { createServiceClient } from '@/lib/supabase/service';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const businessId = new URL(request.url).searchParams.get('businessId')?.trim() || '';
    const bearer = getBearerToken(request);
    const userId = bearer ? verifyMobileSessionToken(bearer) : null;
    if (!businessId || !userId) {
      return NextResponse.json({ success: true, pending: false });
    }
    const supabase = createServiceClient();
    let email: string | null = null;
    if (supabase) {
      const { data } = await supabase.from('User').select('email').eq('id', userId).maybeSingle();
      email = data?.email ? String(data.email) : null;
    }
    const pending = await pendingOwnershipForViewer(businessId, { userId, email });
    return NextResponse.json({ success: true, pending });
  } catch (error) {
    console.error('[ownership request status]', error);
    return NextResponse.json({ success: true, pending: false });
  }
}

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

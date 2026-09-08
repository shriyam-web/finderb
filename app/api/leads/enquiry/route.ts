import { NextResponse } from 'next/server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { submitBroadcastEnquiryForUser } from '@/lib/submitLeadsCore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'broadcast-enquiry');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Sign in to send an enquiry.' },
        { status: 401 }
      );
    }

    const user = await mobileGetUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Sign in to send an enquiry.' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      sourceBusinessId?: string;
      category?: string;
      area?: string;
      name?: string;
      email?: string;
      phone?: string;
      lookingFor?: string;
    } | null;

    if (!body) {
      return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
    }

    const result = await submitBroadcastEnquiryForUser({
      sourceBusinessId: String(body.sourceBusinessId || ''),
      category: String(body.category || ''),
      area: String(body.area || ''),
      name: String(body.name || user.fullName || ''),
      email: String(body.email || user.email || ''),
      phone: String(body.phone || ''),
      lookingFor: String(body.lookingFor || ''),
    });

    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[mobile enquiry]', error);
    return NextResponse.json(
      { success: false, error: 'Could not send enquiry. Please try again.' },
      { status: 500 }
    );
  }
}

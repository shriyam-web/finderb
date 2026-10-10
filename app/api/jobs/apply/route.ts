import { NextResponse } from 'next/server';
import { submitJobApplication } from '@/app/actions/job';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    const user = token ? await mobileGetUserFromToken(token) : null;
    if (!user) {
      return NextResponse.json({ success: false, error: 'Sign in to apply.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      jobId?: string;
      businessId?: string;
      jobTitle?: string;
      fullName?: string;
      email?: string;
      phone?: string;
      message?: string;
    } | null;

    const fullName = String(body?.fullName || '').trim();
    const email = String(body?.email || '').trim();
    const phone = String(body?.phone || '').trim();
    if (!body?.jobId || !body.businessId || !fullName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and phone are required' },
        { status: 400 }
      );
    }

    const result = await submitJobApplication({
      jobId: String(body.jobId),
      businessId: String(body.businessId),
      jobTitle: body.jobTitle ? String(body.jobTitle) : undefined,
      fullName: fullName.slice(0, 120),
      email: email.slice(0, 200),
      phone: phone.slice(0, 20),
      message: body.message ? String(body.message).slice(0, 2000) : undefined,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[mobile job application]', error);
    return NextResponse.json(
      { success: false, error: 'Could not submit application. Please try again.' },
      { status: 500 }
    );
  }
}

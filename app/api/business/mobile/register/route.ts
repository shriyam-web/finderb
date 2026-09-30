import { NextResponse } from 'next/server';
import { registerBusiness } from '@/app/actions/business';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  const limit = await enforceRateLimit('register');
  if (!limit.ok) {
    return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
  }

  try {
    const body = await request.json();
    const result = await registerBusiness(body);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[business register]', error);
    return NextResponse.json(
      { success: false, error: 'Could not register the business. Please try again.' },
      { status: 500 },
    );
  }
}

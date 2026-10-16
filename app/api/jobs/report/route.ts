import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { submitJobReport } from '@/lib/jobBoard.server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { getSessionUserId } from '@/lib/security/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const limit = await enforceRateLimit('write', 'job-report');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }
    const body = (await request.json().catch(() => null)) as { jobId?: string; reason?: string } | null;
    const token = getBearerToken(request);
    const mobileUser = token ? await mobileGetUserFromToken(token) : null;
    const userId = mobileUser?.id || (await getSessionUserId());
    const result = await submitJobReport({
      jobId: String(body?.jobId || ''),
      reason: String(body?.reason || ''),
      userId,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[job report]', error);
    return NextResponse.json({ success: false, error: 'Could not send this report.' }, { status: 500 });
  }
}

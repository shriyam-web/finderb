import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { listJobReports, moderateJobReport } from '@/lib/jobBoard.server';

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

export async function GET(request: Request) {
  try {
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const limit = await enforceRateLimit('search', 'admin-job-reports');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }
    const status = new URL(request.url).searchParams.get('status') || 'pending';
    const result = await listJobReports(status);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[admin job reports GET]', error);
    return NextResponse.json({ success: false, error: 'Could not load job reports.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = (await request.json().catch(() => null)) as {
      reportId?: string;
      action?: string;
      adminNote?: string;
    } | null;
    const action = body?.action === 'takedown' || body?.action === 'dismiss' ? body.action : null;
    if (!body?.reportId || !action) {
      return NextResponse.json({ success: false, error: 'Choose a report and an action.' }, { status: 400 });
    }
    const result = await moderateJobReport({
      reportId: body.reportId,
      action,
      adminNote: body.adminNote,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[admin job reports POST]', error);
    return NextResponse.json({ success: false, error: 'Could not update this report.' }, { status: 500 });
  }
}

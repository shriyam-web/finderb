import { NextResponse } from 'next/server';
import { deleteBusinessReport, listBusinessReports } from '@/lib/businessReports.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

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
    const limit = await enforceRateLimit('search', 'admin-business-reports');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }
    const result = await listBusinessReports();
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[admin business reports GET]', error);
    return NextResponse.json({ success: false, error: 'Could not load reports.' }, { status: 500 });
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
    } | null;
    if (body?.action !== 'delete' || !body.reportId) {
      return NextResponse.json({ success: false, error: 'Choose a report to remove.' }, { status: 400 });
    }
    const result = await deleteBusinessReport(body.reportId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[admin business reports POST]', error);
    return NextResponse.json({ success: false, error: 'Could not remove this report.' }, { status: 500 });
  }
}

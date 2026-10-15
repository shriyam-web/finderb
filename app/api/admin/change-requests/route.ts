import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  listAdminChangeRequests,
  moderateChangeRequest,
} from '@/lib/businessChangeRequest.admin.server';

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
    const limit = await enforceRateLimit('search', 'admin-change-requests');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }
    const status = new URL(request.url).searchParams.get('status') || 'pending';
    const result = await listAdminChangeRequests(status);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[admin change-requests GET]', error);
    return NextResponse.json({ success: false, error: 'Could not load change requests.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const body = (await request.json().catch(() => null)) as {
      requestId?: string;
      action?: string;
      adminId?: string;
      adminNote?: string;
    } | null;
    const action = body?.action === 'reject' ? 'reject' : body?.action === 'approve' ? 'approve' : null;
    if (!action || !body?.requestId) {
      return NextResponse.json({ success: false, error: 'Choose approve or reject.' }, { status: 400 });
    }
    const result = await moderateChangeRequest({
      requestId: body.requestId,
      action,
      adminId: body.adminId,
      adminNote: body.adminNote,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[admin change-requests POST]', error);
    return NextResponse.json({ success: false, error: 'Could not update this request.' }, { status: 500 });
  }
}

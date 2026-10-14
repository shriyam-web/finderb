import { NextResponse } from 'next/server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  dismissReviewReport,
  listAllReviews,
  listAnonymousReviews,
  listReviewFlags,
  moderateStoredReview,
  searchReviews,
  type ReviewModerationAction,
} from '@/lib/reviewModeration.server';

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

const ACTIONS = new Set<ReviewModerationAction>([
  'hide',
  'unhide',
  'delete',
  'restore',
  'allowAnonymous',
  'revealAnonymous',
]);

export async function GET(request: Request) {
  try {
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const limit = await enforceRateLimit('search', 'admin-reviews');
    if (!limit.ok) {
      return NextResponse.json({ success: false, error: limit.error }, { status: 429 });
    }

    const url = new URL(request.url);
    const kind = url.searchParams.get('kind') || 'search';
    const q = url.searchParams.get('q') || '';
    const status = url.searchParams.get('status') || '';

    if (kind === 'anonymous') {
      const rows = await listAnonymousReviews(status || undefined);
      return NextResponse.json({ success: true, rows });
    }
    if (kind === 'user-flags' || kind === 'business-flags') {
      const rows = await listReviewFlags(
        kind === 'business-flags' ? 'business' : 'user',
        status === 'all' ? '' : status || 'open'
      );
      return NextResponse.json({ success: true, rows });
    }
    if (kind === 'all') {
      const result = await listAllReviews(q);
      return NextResponse.json({ success: true, ...result });
    }

    const result = await searchReviews(q);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('[admin reviews GET]', error);
    return NextResponse.json({ success: false, error: 'Search failed.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!dispatchAuthorized(request)) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const writeLimit = await enforceRateLimit('write', 'admin-reviews');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    const body = (await request.json().catch(() => null)) as {
      action?: string;
      businessId?: string;
      reviewId?: string;
      reportId?: string;
      adminId?: string;
      adminNote?: string;
    } | null;

    if (body?.action === 'dismissFlag' && body.reportId) {
      const result = await dismissReviewReport({
        reportId: body.reportId,
        adminId: body.adminId,
        adminNote: body.adminNote,
      });
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }

    const action = body?.action as ReviewModerationAction;
    if (!ACTIONS.has(action)) {
      return NextResponse.json({ success: false, error: 'Unknown action.' }, { status: 400 });
    }

    const result = await moderateStoredReview({
      businessId: String(body?.businessId || ''),
      reviewId: String(body?.reviewId || ''),
      action,
      adminId: body?.adminId,
      adminNote: body?.adminNote,
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[admin reviews POST]', error);
    return NextResponse.json({ success: false, error: 'Could not update this review.' }, { status: 500 });
  }
}

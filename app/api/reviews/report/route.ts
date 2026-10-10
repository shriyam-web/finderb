import { NextResponse } from 'next/server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { reportBusinessReviewAs } from '@/lib/reportBusinessReviewCore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    const user = token ? await mobileGetUserFromToken(token) : null;
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please sign in to report a review.' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      businessId?: string;
      reviewId?: string;
      reason?: string;
    } | null;

    const result = await reportBusinessReviewAs(`user:${user.id}`, {
      businessId: String(body?.businessId || ''),
      reviewId: String(body?.reviewId || ''),
      reason: String(body?.reason || ''),
    });
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[mobile report review]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to report review. Please try again.' },
      { status: 500 }
    );
  }
}

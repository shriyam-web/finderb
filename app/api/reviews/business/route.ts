import { NextResponse } from 'next/server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import { submitBusinessReviewForUser } from '@/lib/submitBusinessReviewCore';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'business-review');
    if (!writeLimit.ok) {
      return NextResponse.json(
        { success: false, error: writeLimit.error },
        { status: 429 }
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Please log in to post a review.' },
        { status: 401 }
      );
    }

    const user = await mobileGetUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in to post a review.' },
        { status: 401 }
      );
    }

    const body = (await request.json().catch(() => null)) as {
      businessId?: string;
      rating?: number;
      content?: string;
    } | null;

    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const result = await submitBusinessReviewForUser({
      userId: user.id,
      fullName: user.fullName,
      businessId: body.businessId || '',
      rating: Number(body.rating),
      content: body.content || '',
    });

    if (!result.success) {
      const status =
        result.error.includes('log in') ? 401 :
        result.error.includes('already reviewed') ? 409 :
        result.error.includes('not found') ? 404 :
        400;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[mobile submit review]', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit review. Please try again.' },
      { status: 500 }
    );
  }
}

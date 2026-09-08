import { NextResponse } from 'next/server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  getFavoriteIdsForUser,
  toggleFavoriteForUser,
} from '@/lib/userFavorites.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function requireUser(request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  return mobileGetUserFromToken(token);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please log in.' }, { status: 401 });
    }

    const favoriteIds = await getFavoriteIdsForUser(user.id);
    return NextResponse.json({ success: true, favoriteIds });
  } catch (error) {
    console.error('[favorites get]', error);
    return NextResponse.json(
      { success: false, error: 'Could not load favourites.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'favorites');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    const user = await requireUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please log in.' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { businessId?: string } | null;
    const result = await toggleFavoriteForUser(user.id, String(body?.businessId || ''));
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[favorites toggle]', error);
    return NextResponse.json(
      { success: false, error: 'Could not update favourites.' },
      { status: 500 }
    );
  }
}

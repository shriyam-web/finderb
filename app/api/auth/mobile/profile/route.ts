import { NextResponse } from 'next/server';
import {
  mobileGetUserFromToken,
  mobileUpdateProfile,
} from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PATCH(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'profile-update');
    if (!writeLimit.ok) {
      return NextResponse.json(
        { success: false, error: writeLimit.error },
        { status: 429 },
      );
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Please log in.' },
        { status: 401 },
      );
    }

    const user = await mobileGetUserFromToken(token);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Please log in.' },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      phone?: string;
      avatarUrl?: string | null;
    };

    const result = await mobileUpdateProfile(user.id, body);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[mobile profile patch]', error);
    return NextResponse.json(
      { success: false, error: 'Could not update profile.' },
      { status: 500 },
    );
  }
}

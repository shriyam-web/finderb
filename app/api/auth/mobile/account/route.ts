import { NextResponse } from 'next/server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { deleteUserAccountById } from '@/lib/accountDeletion.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function DELETE(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'account-delete');
    if (!writeLimit.ok) {
      return NextResponse.json({ success: false, error: writeLimit.error }, { status: 429 });
    }

    const token = getBearerToken(request);
    if (!token) {
      return NextResponse.json({ success: false, error: 'Please log in.' }, { status: 401 });
    }

    const user = await mobileGetUserFromToken(token);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Please log in.' }, { status: 401 });
    }

    const result = await deleteUserAccountById(user.id);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (error) {
    console.error('[mobile account delete]', error);
    return NextResponse.json(
      { success: false, error: 'Could not delete your account. Please try again.' },
      { status: 500 }
    );
  }
}

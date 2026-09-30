import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { deleteUserAccountById } from '@/lib/accountDeletion.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function DELETE(request: Request) {
  try {
    const writeLimit = await enforceRateLimit('write', 'account-delete');
    if (!writeLimit.ok) {
      return mobileApiJson({ success: false, error: writeLimit.error }, 429);
    }

    const token = getBearerToken(request);
    if (!token) {
      return mobileApiJson({ success: false, error: 'Please log in.' }, 401);
    }

    const user = await mobileGetUserFromToken(token);
    if (!user) {
      return mobileApiJson({ success: false, error: 'Please log in.' }, 401);
    }

    const result = await deleteUserAccountById(user.id);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[mobile account delete]', error);
    return mobileApiJson(
      { success: false, error: 'Could not delete your account. Please try again.' },
      500,
    );
  }
}

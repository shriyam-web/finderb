import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { uploadUserAvatar } from '@/lib/account/avatarUpload.server';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    const user = token ? await mobileGetUserFromToken(token) : null;
    if (!user) {
      return mobileApiJson({ success: false, error: 'Please log in.' }, 401);
    }

    const limit = await enforceRateLimit('write', `profile:${user.id}`);
    if (!limit.ok) {
      return mobileApiJson({ success: false, error: limit.error }, 429);
    }

    const body = (await request.json().catch(() => null)) as { image?: unknown } | null;
    const result = await uploadUserAvatar(user.id, body?.image);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[mobile avatar]', error);
    return mobileApiJson({ success: false, error: 'Could not upload the photo. Please try again.' }, 500);
  }
}

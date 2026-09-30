import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function GET(request: Request) {
  try {
    const token = getBearerToken(request);
    if (!token) {
      return mobileApiJson({ success: false, error: 'Unauthorized' }, 401);
    }

    const user = await mobileGetUserFromToken(token);
    if (!user) {
      return mobileApiJson({ success: false, error: 'Unauthorized' }, 401);
    }

    return mobileApiJson({ success: true, user });
  } catch (error) {
    console.error('[mobile me]', error);
    return mobileApiJson({ success: false, error: 'Could not load session.' }, 500);
  }
}

import 'server-only';

import { getBusinessSession } from '@/app/actions/business';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';

/** Cookie session for the website, bearer token for the business app. */
export async function promotionBusinessId(request: Request): Promise<string | null> {
  const token = getBearerToken(request);
  if (token) {
    const user = await mobileGetUserFromToken(token);
    if (user?.isBusinessAccount && user.businessId) return user.businessId;
    return null;
  }
  const session = await getBusinessSession();
  const id = session?.business && typeof session.business === 'object'
    ? String((session.business as { id?: string }).id || '')
    : '';
  return id || null;
}

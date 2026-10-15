import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { mobileGetUserFromToken } from '@/lib/auth/mobileAuth.server';
import { getBearerToken } from '@/lib/auth/mobileToken';
import { runAsMobileMerchant } from '@/lib/security/session';
import { runConsoleAction, type ConsoleRequest } from '@/lib/merchantConsole/console.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  try {
    const token = getBearerToken(request);
    const user = token ? await mobileGetUserFromToken(token) : null;
    if (!user) {
      return mobileApiJson({ success: false, error: 'Please log in again.', code: 'signed_out' }, 401);
    }
    if (!user.isBusinessAccount || !user.businessId) {
      return mobileApiJson(
        { success: false, error: 'This login is not linked to a business.', code: 'not_merchant' },
        403,
      );
    }

    const body = (await request.json().catch(() => null)) as ConsoleRequest | null;
    if (!body || typeof body.action !== 'string') {
      return mobileApiJson({ success: false, error: 'Unknown action.' }, 400);
    }

    const businessId = user.businessId;
    const result = await runAsMobileMerchant(
      businessId,
      () => runConsoleAction(user.id, businessId, body),
      user.teamMemberId,
    );
    return mobileApiJson(result, 200);
  } catch (error) {
    console.error('[merchant console]', error);
    return mobileApiJson({ success: false, error: 'Something went wrong. Please try again.' }, 500);
  }
}

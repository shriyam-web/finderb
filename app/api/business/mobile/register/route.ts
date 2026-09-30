import { registerBusiness } from '@/app/actions/business';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  const limit = await enforceRateLimit('register');
  if (!limit.ok) {
    return mobileApiJson({ success: false, error: limit.error }, 429);
  }

  try {
    const body = await request.json();
    const result = await registerBusiness(body);
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[business register]', error);
    return mobileApiJson(
      { success: false, error: 'Could not register the business. Please try again.' },
      500,
    );
  }
}

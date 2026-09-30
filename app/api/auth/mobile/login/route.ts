import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { mobileLoginWithPassword } from '@/lib/auth/mobileAuth.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  const ipLimit = await enforceRateLimit('auth');
  if (!ipLimit.ok) {
    return mobileApiJson({ success: false, error: ipLimit.error }, 429);
  }

  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const email = String(body.email || '').trim();
    const password = String(body.password || '');

    const emailLimit = await enforceRateLimit(
      'authEmail',
      `mobile-login:${email.toLowerCase()}`
    );
    if (!emailLimit.ok) {
      return mobileApiJson({ success: false, error: emailLimit.error }, 429);
    }

    const result = await mobileLoginWithPassword(email, password);
    return mobileApiJson(result, result.success ? 200 : 401);
  } catch (error) {
    console.error('[mobile login]', error);
    return mobileApiJson({ success: false, error: 'Login failed. Please try again.' }, 500);
  }
}

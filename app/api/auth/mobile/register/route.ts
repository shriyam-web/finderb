import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { mobileRegisterWithPassword } from '@/lib/auth/mobileAuth.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export function OPTIONS() {
  return mobileApiOptions();
}

export async function POST(request: Request) {
  const ipLimit = await enforceRateLimit('register');
  if (!ipLimit.ok) {
    return mobileApiJson({ success: false, error: ipLimit.error }, 429);
  }

  try {
    const body = (await request.json()) as {
      fullName?: string;
      email?: string;
      password?: string;
    };
    const email = String(body.email || '').trim().toLowerCase();

    const emailLimit = await enforceRateLimit('authEmail', `mobile-register:${email}`);
    if (!emailLimit.ok) {
      return mobileApiJson({ success: false, error: emailLimit.error }, 429);
    }

    const result = await mobileRegisterWithPassword({
      fullName: body.fullName,
      email: body.email,
      password: body.password,
    });
    return mobileApiJson(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('[mobile register]', error);
    return mobileApiJson(
      { success: false, error: 'Could not create your account. Please try again.' },
      500,
    );
  }
}

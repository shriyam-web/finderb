import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { lookupEmailAccountTypes, lookupMobileAccountTypes } from '@/lib/emailAccountLookup';
import { mobileApiJson, mobileApiOptions } from '@/lib/mobileApiCors';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function OPTIONS() {
  return mobileApiOptions();
}

/** Lets the app warn about a taken work email or owner mobile while the merchant types. */
export async function POST(request: Request) {
  const limit = await enforceRateLimit('lookup', 'business-availability');
  if (!limit.ok) {
    return mobileApiJson({ error: limit.error }, 429);
  }

  let body: { email?: unknown; mobile?: unknown };
  try {
    body = await request.json();
  } catch {
    return mobileApiJson({ error: 'Invalid request.' }, 400);
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const mobile = typeof body.mobile === 'string' ? body.mobile.replace(/\D/g, '').slice(-10) : '';
  const checkEmail = EMAIL_REGEX.test(email);
  const checkMobile = mobile.length === 10;
  if (!checkEmail && !checkMobile) {
    return mobileApiJson({ emailTaken: false, mobileTaken: false });
  }

  try {
    const supabase = createClient(await cookies());
    const [emailTypes, mobileTypes] = await Promise.all([
      checkEmail ? lookupEmailAccountTypes(supabase, email) : Promise.resolve([]),
      checkMobile ? lookupMobileAccountTypes(supabase, mobile) : Promise.resolve([]),
    ]);
    // Values on a FinderB user account stay usable; the app asks the owner to confirm and verify them.
    // Staff accounts only ever show up as "taken", never by name.
    const emailBlockedBy = emailTypes.find((type) => type !== 'user') ?? null;
    const mobileBlockedBy = mobileTypes.find((type) => type !== 'user') ?? null;
    return mobileApiJson({
      emailTaken: Boolean(emailBlockedBy),
      emailRegisteredAs: emailBlockedBy === 'merchant' ? 'merchant' : null,
      emailOnUserAccount: !emailBlockedBy && emailTypes.includes('user'),
      mobileTaken: Boolean(mobileBlockedBy),
      mobileRegisteredAs: mobileBlockedBy === 'merchant' ? 'merchant' : null,
      mobileOnUserAccount: !mobileBlockedBy && mobileTypes.includes('user'),
    });
  } catch (error) {
    console.error('[business availability]', error);
    return mobileApiJson({ error: 'Could not check right now.' }, 500);
  }
}

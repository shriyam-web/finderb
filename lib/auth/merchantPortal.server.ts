import 'server-only';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { extractIndianMobileDigits } from '@/lib/indianPhone';
import { setBusinessSessionCookie } from '@/lib/security/session';
import { TRUECALLER_PHONE_EMAIL_DOMAIN } from '@/lib/auth/truecallerConfig';

export type LinkedBusiness = {
  id: string;
  businessName: string | null;
  slug: string | null;
};

async function db() {
  const service = createServiceClient();
  if (service) return service;
  return createClient(await cookies());
}

/** Match a FinderB business by work email or the owner's mobile number. */
export async function findBusinessForIdentity(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<LinkedBusiness | null> {
  const email = input.email?.toLowerCase().trim() || '';
  const phone = extractIndianMobileDigits(input.phone || '');
  const synthetic = email.endsWith(`@${TRUECALLER_PHONE_EMAIL_DOMAIN}`);
  const filters: string[] = [];

  if (email && !synthetic && !email.includes(',')) {
    filters.push(`workEmail.eq.${email}`, `email.eq.${email}`);
  }
  if (phone) {
    filters.push(
      `mobile.eq.${phone}`,
      `owner_mobile.eq.${phone}`,
      `publicPhone.eq.${phone}`,
    );
  }
  if (!filters.length) return null;

  const { data } = await (await db())
    .from('Business')
    .select('id, businessName, slug')
    .or(filters.join(','))
    .limit(1);

  const row = data?.[0] as
    | { id?: string; businessName?: string | null; slug?: string | null }
    | undefined;
  if (!row?.id) return null;
  return {
    id: row.id,
    businessName: row.businessName ?? null,
    slug: row.slug ?? null,
  };
}

/** Open the website merchant panel session when this user owns a business. */
export async function openMerchantPortalForUser(
  userId: string,
): Promise<LinkedBusiness | null> {
  const { data: user } = await (await db())
    .from('User')
    .select('email, phone')
    .eq('id', userId)
    .maybeSingle();
  if (!user) return null;

  const business = await findBusinessForIdentity({
    email: (user as { email?: string | null }).email,
    phone: (user as { phone?: string | null }).phone,
  });
  if (!business) return null;
  await setBusinessSessionCookie(business.id);
  return business;
}

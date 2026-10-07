import 'server-only';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { extractIndianMobileDigits } from '@/lib/indianPhone';
import { setBusinessSessionCookie } from '@/lib/security/session';
import { TRUECALLER_PHONE_EMAIL_DOMAIN } from '@/lib/auth/truecallerConfig';
import { WHATSAPP_PHONE_EMAIL_DOMAIN } from '@/lib/auth/whatsappConfig';

export type LinkedBusiness = {
  id: string;
  businessName: string | null;
  slug: string | null;
  selectedPlan: string | null;
  paymentStatus: string | null;
  planExpiresAt: string | null;
  billingCycle: string | null;
  ownerName: string | null;
  contactEmail: string | null;
  contactMobile: string | null;
  profilePictureUrl: string | null;
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
  const synthetic =
    email.endsWith(`@${TRUECALLER_PHONE_EMAIL_DOMAIN}`) ||
    email.endsWith(`@${WHATSAPP_PHONE_EMAIL_DOMAIN}`);
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
    .select(
      'id, businessName, slug, selectedPlan, paymentStatus, planExpiresAt, billingCycle, fullName, owner_name, workEmail, email, mobile, owner_mobile, profilePictureUrl',
    )
    .or(filters.join(','))
    .limit(1);

  const row = data?.[0] as
    | {
        id?: string;
        businessName?: string | null;
        slug?: string | null;
        selectedPlan?: string | null;
        paymentStatus?: string | null;
        planExpiresAt?: string | null;
        billingCycle?: string | null;
        fullName?: string | null;
        owner_name?: string | null;
        workEmail?: string | null;
        email?: string | null;
        mobile?: string | null;
        owner_mobile?: string | null;
        profilePictureUrl?: string | null;
      }
    | undefined;
  if (!row?.id) return null;
  const text = (value: string | null | undefined) => value?.trim() || null;
  return {
    id: row.id,
    businessName: row.businessName ?? null,
    slug: row.slug ?? null,
    selectedPlan: row.selectedPlan ?? null,
    paymentStatus: row.paymentStatus ?? null,
    planExpiresAt: row.planExpiresAt ?? null,
    billingCycle: row.billingCycle ?? null,
    ownerName: text(row.owner_name) ?? text(row.fullName),
    contactEmail: text(row.workEmail)?.toLowerCase() ?? text(row.email)?.toLowerCase() ?? null,
    contactMobile: extractIndianMobileDigits(row.mobile || row.owner_mobile || '') || null,
    profilePictureUrl: text(row.profilePictureUrl),
  };
}

/** A user login linked to a business shows the business owner's details instead of its own. */
export function withBusinessProfile<
  T extends { fullName?: string | null; email?: string | null; phone?: string | null; avatarUrl?: string | null },
>(user: T, business: LinkedBusiness): T {
  return {
    ...user,
    fullName: business.ownerName || business.businessName || user.fullName,
    email: business.contactEmail || user.email,
    phone: business.contactMobile || user.phone,
    avatarUrl: business.profilePictureUrl || user.avatarUrl,
  };
}

export const BUSINESS_PROFILE_LOCKED_MESSAGE =
  'This is a business account. Update the name, email, mobile and photo from your business dashboard.';

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

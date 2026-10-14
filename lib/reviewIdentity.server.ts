import 'server-only';

import { extractIndianMobileDigits } from '@/lib/indianPhone';
import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import {
  rememberBusinessUserLink,
  userHasBusinessLink,
} from '@/lib/businessUserLinks.server';

function db() {
  return createServiceClient();
}

function emailsOf(value: unknown): string[] {
  const email = String(value || '')
    .toLowerCase()
    .trim();
  return email ? [email] : [];
}

function phonesOf(...values: unknown[]): string[] {
  return [...new Set(values.map((value) => extractIndianMobileDigits(value)).filter(Boolean))];
}

/**
 * True when this FinderB user owns the listing or is an active team member.
 * Owners and staff cannot review their own business.
 */
export async function userOwnsOrManagesBusiness(
  userId: string,
  businessId: string
): Promise<boolean> {
  const id = userId.trim();
  const listingId = businessId.trim();
  if (!id || !listingId) return false;

  if (await userHasBusinessLink(id, listingId)) return true;

  const supabase = db() ?? createClient(await cookies());
  const { data: user } = await supabase
    .from('User')
    .select('email, phone')
    .eq('id', id)
    .maybeSingle();

  if (!user) return false;

  const userEmails = emailsOf(user.email);
  const userPhones = phonesOf(user.phone);

  const { data: business } = await supabase
    .from('Business')
    .select('email, workEmail, mobile, owner_mobile, publicPhone, whatsappNumber')
    .eq('id', listingId)
    .maybeSingle();

  if (business) {
    const listingEmails = [...emailsOf(business.email), ...emailsOf(business.workEmail)];
    const listingPhones = phonesOf(
      business.mobile,
      business.owner_mobile,
      business.publicPhone,
      business.whatsappNumber
    );
    const emailMatch = userEmails.some((email) => listingEmails.includes(email));
    const phoneMatch = userPhones.some((phone) => listingPhones.includes(phone));
    if (emailMatch || phoneMatch) {
      await rememberBusinessUserLink(id, listingId, 'identity');
      return true;
    }
  }

  if (!userEmails.length && !userPhones.length) return false;

  const { data: members } = await supabase
    .from('business_team_members')
    .select('id, email, mobile')
    .eq('business_id', listingId)
    .eq('status', 'active')
    .limit(40);

  const isTeam = (members || []).some((member) => {
    const memberEmail = String(member.email || '')
      .toLowerCase()
      .trim();
    const memberPhone = extractIndianMobileDigits(member.mobile);
    return (
      (memberEmail && userEmails.includes(memberEmail)) ||
      (memberPhone && userPhones.includes(memberPhone))
    );
  });

  if (isTeam) {
    await rememberBusinessUserLink(id, listingId, 'team');
    return true;
  }

  return false;
}

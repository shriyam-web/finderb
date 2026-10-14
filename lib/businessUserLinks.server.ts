import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { extractIndianMobileDigits } from '@/lib/indianPhone';

function db() {
  return createServiceClient();
}

export async function rememberBusinessUserLink(
  userId: string,
  businessId: string,
  source = 'session'
): Promise<void> {
  const supabase = db();
  const uid = userId.trim();
  const bid = businessId.trim();
  if (!supabase || !uid || !bid) return;

  const { error } = await supabase.from('business_user_links').upsert(
    {
      user_id: uid,
      business_id: bid,
      source,
    },
    { onConflict: 'user_id,business_id' }
  );
  if (error && error.code !== '42P01') {
    console.error('[business-user-links] upsert', error);
  }
}

export async function userHasBusinessLink(userId: string, businessId: string): Promise<boolean> {
  const supabase = db();
  const uid = userId.trim();
  const bid = businessId.trim();
  if (!supabase || !uid || !bid) return false;

  const { data, error } = await supabase
    .from('business_user_links')
    .select('user_id')
    .eq('user_id', uid)
    .eq('business_id', bid)
    .maybeSingle();

  if (error) {
    if (error.code !== '42P01') {
      console.error('[business-user-links] lookup', error);
    }
    return false;
  }
  return Boolean(data);
}

/** Find every user whose email or mobile matches this listing and store the link. */
export async function linkUsersMatchingBusiness(businessId: string): Promise<void> {
  const supabase = db();
  const bid = businessId.trim();
  if (!supabase || !bid) return;

  const { data: business } = await supabase
    .from('Business')
    .select('email, workEmail, mobile, owner_mobile, publicPhone, whatsappNumber')
    .eq('id', bid)
    .maybeSingle();

  if (!business) return;

  const emails = [business.email, business.workEmail]
    .map((value) => String(value || '').toLowerCase().trim())
    .filter(Boolean);
  const phones = [business.mobile, business.owner_mobile, business.publicPhone, business.whatsappNumber]
    .map((value) => extractIndianMobileDigits(value))
    .filter(Boolean);

  const userIds = new Set<string>();

  if (emails.length) {
    const { data } = await supabase.from('User').select('id').in('email', emails).limit(20);
    for (const row of data || []) {
      if (row.id) userIds.add(String(row.id));
    }
  }

  for (const phone of phones) {
    const { data } = await supabase
      .from('User')
      .select('id, phone')
      .ilike('phone', `%${phone}%`)
      .limit(20);
    for (const row of data || []) {
      if (extractIndianMobileDigits(row.phone) === phone && row.id) {
        userIds.add(String(row.id));
      }
    }
  }

  await Promise.all(
    [...userIds].map((userId) => rememberBusinessUserLink(userId, bid, 'identity'))
  );
}

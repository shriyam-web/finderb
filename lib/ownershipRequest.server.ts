import 'server-only';

import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { hashPassword } from '@/lib/security/password';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
import { sendOwnershipEmail } from '@/lib/email/sendOwnershipEmail';
import { recordDirectUserNotification } from '@/lib/userNotifications.server';
import { getSessionUserId } from '@/lib/security/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type OwnershipRequestInput = {
  businessId: string;
  name: string;
  email: string;
  phone: string;
};

function temporaryPassword() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = randomBytes(12);
  let out = '';
  for (let index = 0; index < bytes.length; index += 1) {
    out += alphabet[bytes[index] % alphabet.length];
  }
  return out;
}

export async function submitOwnershipRequest(input: OwnershipRequestInput, signedInUserId?: string | null) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  const businessId = input.businessId.trim();
  const name = input.name.trim().slice(0, 80);
  const email = input.email.trim().toLowerCase();
  const phone = extractIndianMobileDigits(input.phone);
  if (!businessId) return { success: false as const, error: 'Missing business.' };
  if (name.length < 2) return { success: false as const, error: 'Enter your name.' };
  if (!EMAIL_RE.test(email)) return { success: false as const, error: 'Enter a valid email.' };
  if (!isValidIndianMobileDigits(phone)) return { success: false as const, error: 'Enter a valid mobile number.' };

  const { data: business } = await supabase
    .from('Business')
    .select('id, businessName')
    .eq('id', businessId)
    .maybeSingle();
  if (!business) return { success: false as const, error: 'Business not found.' };

  const { data: existing } = await supabase
    .from('business_ownership_requests')
    .select('id')
    .eq('business_id', businessId)
    .eq('requester_email', email)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing?.id) {
    return { success: true as const, alreadyPending: true };
  }

  const userId = (signedInUserId || (await getSessionUserId()) || '').trim() || null;
  const { error } = await supabase.from('business_ownership_requests').insert({
    business_id: businessId,
    user_id: userId,
    requester_name: name,
    requester_email: email,
    requester_phone: phone,
    status: 'pending',
  });
  if (error) {
    console.error('[ownership request]', error);
    return { success: false as const, error: 'Could not submit the request. Try again shortly.' };
  }
  return { success: true as const, alreadyPending: false };
}

export async function listOwnershipRequests(status = 'pending') {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  let query = supabase
    .from('business_ownership_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) {
    console.error('[ownership list]', error);
    return { success: false as const, error: 'Could not load ownership requests.' };
  }

  const rows = data || [];
  const ids = [...new Set(rows.map((row) => String(row.business_id || '')).filter(Boolean))];
  const names = new Map<string, { businessName?: string; city?: string | null; slug?: string | null }>();
  if (ids.length) {
    const { data: businesses } = await supabase
      .from('Business')
      .select('id, businessName, city, slug')
      .in('id', ids);
    for (const row of businesses || []) names.set(String(row.id), row);
  }

  return {
    success: true as const,
    rows: rows.map((row) => {
      const business = names.get(String(row.business_id));
      return {
        ...row,
        business_name: business?.businessName || 'Business',
        city: business?.city || null,
        slug: business?.slug || null,
      };
    }),
  };
}

export async function moderateOwnershipRequest(input: {
  requestId: string;
  action: 'approve' | 'deny';
  adminId?: string;
  adminNote?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  const requestId = input.requestId.trim();
  const note = input.adminNote?.trim() || '';
  if (!requestId) return { success: false as const, error: 'Missing request.' };
  if (input.action === 'deny' && note.length < 3) {
    return { success: false as const, error: 'Add a reason before denying.' };
  }

  const { data: request, error } = await supabase
    .from('business_ownership_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (error || !request) return { success: false as const, error: 'Request not found.' };
  if (request.status !== 'pending') return { success: false as const, error: 'This request was already reviewed.' };

  const { data: business } = await supabase
    .from('Business')
    .select('id, businessName, displayName')
    .eq('id', request.business_id)
    .maybeSingle();
  const businessName = business?.displayName || business?.businessName || 'the business';
  const now = new Date().toISOString();

  if (input.action === 'deny') {
    const { error: updateError } = await supabase
      .from('business_ownership_requests')
      .update({
        status: 'denied',
        admin_note: note,
        reviewed_by: input.adminId || null,
        reviewed_at: now,
      })
      .eq('id', requestId)
      .eq('status', 'pending');
    if (updateError) return { success: false as const, error: 'Could not deny this request.' };

    const denial = `FinderB could not approve your request to manage ${businessName}. Reason: ${note}`;
    if (request.user_id) {
      await recordDirectUserNotification({
        userId: String(request.user_id),
        title: 'Ownership request update',
        message: denial,
        pushBody: `Your request to manage ${businessName} was not approved.`,
      });
    }
    await sendOwnershipEmail({
      to: String(request.requester_email),
      subject: `Ownership request for ${businessName}`,
      text: denial,
    });
    return { success: true as const };
  }

  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  const email = String(request.requester_email || '').trim().toLowerCase();
  const phone = extractIndianMobileDigits(request.requester_phone);
  const { error: businessError } = await supabase
    .from('Business')
    .update({
      email,
      workEmail: email,
      mobile: phone,
      password: passwordHash,
      emailVerified: true,
      mobileVerified: true,
      updatedAt: now,
    })
    .eq('id', request.business_id);
  if (businessError) {
    console.error('[ownership approve]', businessError);
    return { success: false as const, error: 'Could not update the business login.' };
  }

  const { error: statusError } = await supabase
    .from('business_ownership_requests')
    .update({
      status: 'approved',
      admin_note: note || null,
      reviewed_by: input.adminId || null,
      reviewed_at: now,
    })
    .eq('id', requestId)
    .eq('status', 'pending');
  if (statusError) return { success: false as const, error: 'Login was updated, but the request status did not save.' };

  const credentials = [
    `Your request to manage ${businessName} on FinderB was approved.`,
    '',
    `Business login email: ${email}`,
    `Business login mobile: +91 ${phone}`,
    `Temporary password: ${password}`,
    '',
    'Sign in at https://finderb.com/business/login and change this password from Login and security.',
    'These details were sent only to you.',
  ].join('\n');

  if (request.user_id) {
    await recordDirectUserNotification({
      userId: String(request.user_id),
      title: `You can manage ${businessName}`,
      message: credentials,
      pushBody: `Your request to manage ${businessName} was approved. Open notifications for the login details.`,
      ctaUrl: 'https://finderb.com/business/login',
      ctaLabel: 'Business login',
    });
  }
  await sendOwnershipEmail({
    to: email,
    subject: `Your FinderB login for ${businessName}`,
    text: credentials,
  });
  return { success: true as const };
}

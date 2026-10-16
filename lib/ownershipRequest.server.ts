import 'server-only';

import { randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { hashPassword } from '@/lib/security/password';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
import { sendOwnershipEmail } from '@/lib/email/sendOwnershipEmail';
import { recordMerchantNotification } from '@/lib/merchantAlert.server';
import { recordDirectUserNotification, queueBusinessPush } from '@/lib/userNotifications.server';
import { getSessionUserId } from '@/lib/security/session';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const OWNER_WINDOW_MS = 48 * 60 * 60 * 1000;
const REVERSE_WINDOW_MS = 15 * 24 * 60 * 60 * 1000;

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
    .select('id, businessName, displayName, email, workEmail')
    .eq('id', businessId)
    .maybeSingle();
  if (!business) return { success: false as const, error: 'Business not found.' };

  const userId = (signedInUserId || (await getSessionUserId()) || '').trim() || null;
  const alreadyPending = await hasPendingOwnershipRequest(supabase, businessId, {
    userId,
    email,
  });
  if (alreadyPending) {
    return { success: true as const, alreadyPending: true };
  }

  const deadline = new Date(Date.now() + OWNER_WINDOW_MS).toISOString();
  const row = {
    business_id: businessId,
    user_id: userId,
    requester_name: name,
    requester_email: email,
    requester_phone: phone,
    status: 'pending',
    owner_deadline_at: deadline,
  };
  let inserted = await supabase.from('business_ownership_requests').insert(row).select('id').single();
  if (inserted.error && missingColumn(inserted.error)) {
    const { owner_deadline_at: _deadline, ...withoutDeadline } = row;
    inserted = await supabase.from('business_ownership_requests').insert(withoutDeadline).select('id').single();
  }
  if (inserted.error || !inserted.data?.id) {
    console.error('[ownership request]', inserted.error);
    return { success: false as const, error: 'Could not submit the request. Try again shortly.' };
  }

  const businessName = business.displayName || business.businessName || 'the business';
  await notifyCurrentOwner(supabase, {
    requestId: String(inserted.data.id),
    businessId,
    businessName,
    ownerEmail: firstEmail(business.workEmail, business.email),
    requesterName: name,
    requesterEmail: email,
    requesterPhone: phone,
    deadline,
  });
  return { success: true as const, alreadyPending: false };
}

type OwnershipDb = NonNullable<ReturnType<typeof createServiceClient>>;

/** True when this signed-in person already has a waiting request for the business. */
export async function hasPendingOwnershipRequest(
  supabase: OwnershipDb,
  businessId: string,
  identity: { userId?: string | null; email?: string | null },
) {
  const id = businessId.trim();
  const userId = String(identity.userId || '').trim();
  const email = String(identity.email || '').trim().toLowerCase();
  if (!id || (!userId && !email)) return false;

  if (userId) {
    const byUser = await supabase
      .from('business_ownership_requests')
      .select('id')
      .eq('business_id', id)
      .eq('status', 'pending')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (byUser.data?.id) return true;
  }

  if (!email) return false;
  const byEmail = await supabase
    .from('business_ownership_requests')
    .select('id')
    .eq('business_id', id)
    .eq('status', 'pending')
    .eq('requester_email', email)
    .limit(1)
    .maybeSingle();
  return Boolean(byEmail.data?.id);
}

export async function pendingOwnershipForViewer(
  businessId: string,
  identity: { userId?: string | null; email?: string | null },
) {
  const supabase = createServiceClient();
  if (!supabase) return false;
  return hasPendingOwnershipRequest(supabase, businessId, identity);
}

function missingColumn(error: { message?: string } | null | undefined) {
  return /column|schema cache|does not exist/i.test(error?.message || '');
}

function firstEmail(...values: Array<string | null | undefined>) {
  for (const value of values) {
    const email = String(value || '').trim().toLowerCase();
    if (EMAIL_RE.test(email)) return email;
  }
  return '';
}

function formatIst(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function deadlineOf(row: { owner_deadline_at?: string | null; created_at?: string | null }) {
  if (row.owner_deadline_at) {
    const date = new Date(row.owner_deadline_at);
    if (!Number.isNaN(date.getTime())) return date;
  }
  if (row.created_at) {
    const created = new Date(row.created_at);
    if (!Number.isNaN(created.getTime())) return new Date(created.getTime() + OWNER_WINDOW_MS);
  }
  return null;
}

function ownerWindowClosed(row: { owner_decision?: string | null; owner_deadline_at?: string | null; created_at?: string | null }) {
  const decision = String(row.owner_decision || '').trim();
  if (decision === 'approved' || decision === 'denied') return false;
  if (decision === 'expired') return true;
  const deadline = deadlineOf(row);
  return Boolean(deadline && deadline.getTime() <= Date.now());
}

export type OwnershipPrompt = {
  requestId: string;
  deadline: string | null;
  decision: string | null;
  canDecide: boolean;
};

async function notifyCurrentOwner(
  supabase: OwnershipDb,
  input: {
    requestId: string;
    businessId: string;
    businessName: string;
    ownerEmail: string;
    requesterName: string;
    requesterEmail: string;
    requesterPhone: string;
    deadline: string;
  },
) {
  const until = formatIst(input.deadline);
  const title = `Ownership request for ${input.businessName}`;
  const body = `${input.requesterName} asked to manage ${input.businessName}. Approve or deny this in Notifications before ${until}. If you do not answer within 48 hours, the buttons close and FinderB decides.`;
  await recordMerchantNotification({
    businessId: input.businessId,
    type: 'ownership_request',
    title,
    body,
    metadata: {
      requestId: input.requestId,
      priority: 'high',
      deadline: input.deadline,
      decision: null,
    },
  });
  queueBusinessPush({
    businessId: input.businessId,
    type: 'ownership',
    title,
    body: `${input.requesterName} asked to manage ${input.businessName}. You have 48 hours to approve or deny.`,
    url: '/business/dashboard?tab=overview',
  });
  if (!input.ownerEmail) return;
  await sendOwnershipEmail({
    to: input.ownerEmail,
    subject: title,
    text: [
      `${input.requesterName} (${input.requesterEmail}, +91 ${input.requesterPhone}) asked to manage ${input.businessName} on FinderB.`,
      '',
      `You have 48 hours, until ${until}, to approve or deny this in the FinderB business app. Open Notifications. Those buttons close after 48 hours.`,
      '',
      'Your answer is shown to FinderB. The login changes only if FinderB approves the transfer.',
    ].join('\n'),
  });
}

async function stampOwnerDecisionOnAlert(
  supabase: OwnershipDb,
  businessId: string,
  requestId: string,
  decision: 'approved' | 'denied',
) {
  const { data } = await supabase
    .from('merchant_notifications')
    .select('id, metadata')
    .eq('business_id', businessId)
    .eq('type', 'ownership_request')
    .order('created_at', { ascending: false })
    .limit(20);
  const matches = (data || []).filter((row) => {
    const metadata = row.metadata as { requestId?: string } | null;
    return String(metadata?.requestId || '') === requestId;
  });
  await Promise.all(
    matches.map((row) => {
      const metadata = (row.metadata || {}) as Record<string, unknown>;
      return supabase
        .from('merchant_notifications')
        .update({ metadata: { ...metadata, decision } })
        .eq('id', row.id);
    }),
  );
}

export async function recordOwnerOwnershipDecision(input: {
  businessId: string;
  requestId: string;
  decision: 'approved' | 'denied';
  note?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  const businessId = input.businessId.trim();
  const requestId = input.requestId.trim();
  const note = input.note?.trim() || '';
  if (!businessId || !requestId) return { success: false as const, error: 'Missing request.' };
  if (input.decision === 'denied' && note.length < 3) {
    return { success: false as const, error: 'Add a short reason before denying.' };
  }

  const { data: request, error } = await supabase
    .from('business_ownership_requests')
    .select('*')
    .eq('id', requestId)
    .eq('business_id', businessId)
    .maybeSingle();
  if (error && missingColumn(error)) {
    return { success: false as const, error: 'Run supabase/ownership_owner_window.sql before answering this request.' };
  }
  if (error || !request) return { success: false as const, error: 'Request not found.' };
  if (request.status !== 'pending') return { success: false as const, error: 'This request is no longer waiting.' };

  const existing = String(request.owner_decision || '');
  if (existing === 'approved' || existing === 'denied') {
    return { success: false as const, error: 'You already answered this request.' };
  }
  if (ownerWindowClosed(request)) {
    await supabase
      .from('business_ownership_requests')
      .update({ owner_decision: 'expired' })
      .eq('id', requestId)
      .eq('status', 'pending')
      .is('owner_decision', null);
    return { success: false as const, error: 'The 48-hour window has closed. FinderB will decide.' };
  }

  const now = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('business_ownership_requests')
    .update({
      owner_decision: input.decision,
      owner_note: input.decision === 'denied' ? note : note || null,
      owner_decided_at: now,
    })
    .eq('id', requestId)
    .eq('status', 'pending');
  if (updateError) {
    if (missingColumn(updateError)) {
      return { success: false as const, error: 'Run supabase/ownership_owner_window.sql before answering this request.' };
    }
    return { success: false as const, error: 'Could not save your answer.' };
  }

  await stampOwnerDecisionOnAlert(supabase, businessId, requestId, input.decision);

  const { data: business } = await supabase
    .from('Business')
    .select('businessName, displayName')
    .eq('id', businessId)
    .maybeSingle();
  const businessName = business?.displayName || business?.businessName || 'the business';
  const answer = input.decision === 'approved' ? 'agreed' : 'did not agree';
  const message = `The current owner ${answer} with your request to manage ${businessName}. FinderB still makes the final decision.`;
  if (request.user_id) {
    await recordDirectUserNotification({
      userId: String(request.user_id),
      title: 'Ownership request update',
      message: input.decision === 'denied' ? `${message} Reason: ${note}` : message,
      pushBody: message,
    });
  }
  await sendOwnershipEmail({
    to: String(request.requester_email),
    subject: `Ownership request for ${businessName}`,
    text: input.decision === 'denied' ? `${message}\n\nReason: ${note}` : message,
  });
  return { success: true as const };
}

export function ownershipPromptFromRow(row: {
  id?: string;
  status?: string | null;
  owner_decision?: string | null;
  owner_deadline_at?: string | null;
  created_at?: string | null;
}): OwnershipPrompt | null {
  const requestId = String(row.id || '').trim();
  if (!requestId) return null;
  const decision = String(row.owner_decision || '').trim() || null;
  const deadline = deadlineOf(row);
  const canDecide =
    row.status === 'pending' &&
    decision !== 'approved' &&
    decision !== 'denied' &&
    decision !== 'expired' &&
    Boolean(deadline && deadline.getTime() > Date.now());
  return {
    requestId,
    deadline: deadline ? deadline.toISOString() : null,
    decision,
    canDecide,
  };
}

export async function ownershipDetailsLock(businessId: string): Promise<
  { locked: false } | { locked: true; until: string; error: string }
> {
  const id = businessId.trim();
  const supabase = createServiceClient();
  if (!supabase || !id) return { locked: false };
  const { data, error } = await supabase
    .from('business_ownership_requests')
    .select('reversible_until')
    .eq('business_id', id)
    .eq('status', 'approved')
    .is('reversed_at', null)
    .gt('reversible_until', new Date().toISOString())
    .order('reversible_until', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error || !data?.reversible_until) return { locked: false };
  const until = String(data.reversible_until);
  return {
    locked: true,
    until,
    error: `This listing was transferred recently. Business details stay locked until ${formatIst(until)}. After that you can edit them.`,
  };
}

export async function ownershipPromptsById(requestIds: string[]) {
  const ids = [...new Set(requestIds.map((id) => id.trim()).filter(Boolean))];
  const prompts = new Map<string, OwnershipPrompt>();
  if (!ids.length) return prompts;
  const supabase = createServiceClient();
  if (!supabase) return prompts;
  const { data, error } = await supabase
    .from('business_ownership_requests')
    .select('id, status, owner_decision, owner_deadline_at, created_at')
    .in('id', ids);
  if (error) return prompts;
  for (const row of data || []) {
    const prompt = ownershipPromptFromRow(row);
    if (prompt) prompts.set(prompt.requestId, prompt);
  }
  return prompts;
}

export async function listOwnershipRequests(status = 'pending') {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  let query = supabase
    .from('business_ownership_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status === 'reversible') {
    query = query.eq('status', 'approved').is('reversed_at', null).gt('reversible_until', new Date().toISOString());
  } else if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  if (error) {
    if (status === 'reversible' && missingColumn(error)) {
      return { success: true as const, rows: [] };
    }
    console.error('[ownership list]', error);
    return { success: false as const, error: 'Could not load ownership requests.' };
  }

  const rows = data || [];
  const expiredIds = rows
    .filter((row) => row.status === 'pending' && ownerWindowClosed(row) && row.owner_decision !== 'expired')
    .map((row) => String(row.id));
  if (expiredIds.length) {
    await supabase
      .from('business_ownership_requests')
      .update({ owner_decision: 'expired' })
      .in('id', expiredIds)
      .eq('status', 'pending');
    for (const row of rows) {
      if (expiredIds.includes(String(row.id))) row.owner_decision = 'expired';
    }
  }
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
      const reversibleUntil = row.reversible_until ? new Date(String(row.reversible_until)) : null;
      const reversible =
        row.status === 'approved' &&
        !row.reversed_at &&
        Boolean(reversibleUntil && reversibleUntil.getTime() > Date.now() && row.transferred_at);
      const decision = String(row.owner_decision || '');
      const opinion = decision === 'approved'
        ? 'approved'
        : decision === 'denied'
          ? 'denied'
          : ownerWindowClosed(row)
            ? 'expired'
            : 'waiting';
      return {
        ...row,
        business_name: business?.businessName || 'Business',
        city: business?.city || null,
        slug: business?.slug || null,
        owner_opinion: opinion,
        reversible,
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
    .select('id, businessName, displayName, email, workEmail, mobile, password, emailVerified, mobileVerified')
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

  const rollbackProbe = await supabase
    .from('business_ownership_requests')
    .select('previous_email, reversible_until')
    .eq('id', requestId)
    .maybeSingle();
  if (rollbackProbe.error && missingColumn(rollbackProbe.error)) {
    return {
      success: false as const,
      error: 'Run supabase/ownership_owner_window.sql before approving. The login was not changed.',
    };
  }
  if (!business) return { success: false as const, error: 'Business not found.' };

  const password = temporaryPassword();
  const passwordHash = await hashPassword(password);
  const email = String(request.requester_email || '').trim().toLowerCase();
  const phone = extractIndianMobileDigits(request.requester_phone);
  const reversibleUntil = new Date(Date.now() + REVERSE_WINDOW_MS).toISOString();
  const rollback = {
    previous_email: business.email || null,
    previous_work_email: business.workEmail || null,
    previous_mobile: business.mobile || null,
    previous_password: business.password || null,
    previous_email_verified: Boolean(business.emailVerified),
    previous_mobile_verified: Boolean(business.mobileVerified),
    transferred_at: now,
    reversible_until: reversibleUntil,
  };
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
      ...rollback,
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
  const previousEmail = firstEmail(rollback.previous_work_email, rollback.previous_email);
  if (previousEmail && previousEmail !== email) {
    await sendOwnershipEmail({
      to: previousEmail,
      subject: `Login for ${businessName} was transferred`,
      text: `FinderB approved another person's request to manage ${businessName}. The previous business login no longer works. FinderB can reverse this transfer for 15 days.`,
    });
  }
  return { success: true as const };
}

export async function reverseOwnershipTransfer(input: { requestId: string; adminId?: string; adminNote?: string }) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  const requestId = input.requestId.trim();
  if (!requestId) return { success: false as const, error: 'Missing request.' };

  const { data: request, error } = await supabase
    .from('business_ownership_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (error && missingColumn(error)) {
    return { success: false as const, error: 'Run supabase/ownership_owner_window.sql before reversing a transfer.' };
  }
  if (error || !request) return { success: false as const, error: 'Request not found.' };
  if (request.status !== 'approved' || request.reversed_at) {
    return { success: false as const, error: 'This transfer cannot be reversed.' };
  }
  const until = request.reversible_until ? new Date(String(request.reversible_until)) : null;
  if (!request.transferred_at || !until || Number.isNaN(until.getTime()) || until.getTime() <= Date.now()) {
    return { success: false as const, error: 'The 15-day reversal window has closed.' };
  }

  const now = new Date().toISOString();
  const { error: businessError } = await supabase
    .from('Business')
    .update({
      email: request.previous_email || null,
      workEmail: request.previous_work_email || null,
      mobile: request.previous_mobile || null,
      password: request.previous_password || null,
      emailVerified: Boolean(request.previous_email_verified),
      mobileVerified: Boolean(request.previous_mobile_verified),
      updatedAt: now,
    })
    .eq('id', request.business_id);
  if (businessError) {
    console.error('[ownership reverse]', businessError);
    return { success: false as const, error: 'Could not restore the previous login.' };
  }

  const note = input.adminNote?.trim() || '';
  const { error: statusError } = await supabase
    .from('business_ownership_requests')
    .update({
      status: 'reversed',
      reversed_at: now,
      reversed_by: input.adminId || null,
      admin_note: note || request.admin_note || null,
    })
    .eq('id', requestId)
    .eq('status', 'approved');
  if (statusError) {
    return { success: false as const, error: 'The login was restored, but the request status did not save.' };
  }

  const { data: business } = await supabase
    .from('Business')
    .select('businessName, displayName')
    .eq('id', request.business_id)
    .maybeSingle();
  const businessName = business?.displayName || business?.businessName || 'the business';
  const restored = `FinderB reversed the transfer of ${businessName}. The previous business login works again.`;
  const removed = `FinderB reversed the transfer of ${businessName}. The login that was sent to you no longer works.`;

  const previousEmail = firstEmail(request.previous_work_email, request.previous_email);
  if (previousEmail) {
    await sendOwnershipEmail({ to: previousEmail, subject: `Login restored for ${businessName}`, text: restored });
  }
  await sendOwnershipEmail({
    to: String(request.requester_email),
    subject: `Transfer reversed for ${businessName}`,
    text: removed,
  });
  if (request.user_id) {
    await recordDirectUserNotification({
      userId: String(request.user_id),
      title: 'Ownership transfer reversed',
      message: removed,
      pushBody: removed,
    });
  }
  await recordMerchantNotification({
    businessId: String(request.business_id),
    type: 'ownership_reversed',
    title: `Login restored for ${businessName}`,
    body: restored,
    metadata: { requestId, priority: 'high' },
  });
  return { success: true as const };
}

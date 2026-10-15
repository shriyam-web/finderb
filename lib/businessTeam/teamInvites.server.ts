import 'server-only';

import { createHash, randomBytes } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { SITE_URL } from '@/lib/businessSeo';
import { sendTeamInviteEmail } from '@/lib/email/sendTeamInviteEmail';
import { sendTeamInviteWhatsApp } from '@/lib/whatsapp/sendTeamInviteWhatsApp';
import { sendWhatsAppOtp } from '@/lib/whatsapp/sendWhatsAppOtp';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
import { hashPassword, validatePasswordLength, PASSWORD_MIN_LENGTH_MERCHANT } from '@/lib/security/password';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimit';
import { setBusinessSessionCookie } from '@/lib/security/session';
import type { LinkedBusiness } from '@/lib/auth/merchantPortal.server';
import { getEffectivePlanKey } from '@/lib/subscription/merchantSubscription';
import {
  consumeOtpChallenge,
  discardOtpChallenge,
  issueOtpChallenge,
  otpIssueErrorMessage,
} from '@/lib/auth/otpChallenge.server';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  TEAM_INVITE_HOURS,
  defaultInviteAccess,
  normalizeTeamAccess,
  type TeamAccessMap,
  type TeamInviteChannel,
} from '@/lib/businessTeam/teamAccess';

export type TeamMemberStatus = 'pending' | 'active' | 'revoked' | 'expired';

export type TeamMember = {
  id: string;
  email: string | null;
  mobile: string | null;
  status: TeamMemberStatus;
  access: TeamAccessMap;
  contactVerified: boolean;
  lastInviteSentAt: string | null;
  acceptedAt: string | null;
  inviteExpiresAt: string | null;
  createdAt: string;
};

type MemberRow = {
  id: string;
  business_id: string;
  email: string | null;
  mobile: string | null;
  password_hash: string | null;
  status: TeamMemberStatus;
  invite_token_hash: string;
  invite_expires_at: string;
  last_invite_sent_at: string | null;
  accepted_at: string | null;
  contact_verified_at: string | null;
  tab_access: unknown;
  invited_by: string | null;
  created_at: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INVITE_TTL_MS = TEAM_INVITE_HOURS * 60 * 60 * 1000;
const RESEND_GAP_MS = 90 * 1000;

function db() {
  return createServiceClient();
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function newToken() {
  return randomBytes(24).toString('base64url');
}

function otpPurpose(memberId: string) {
  return `team-invite:${memberId}`;
}

function inviteTimedOut(member: Pick<MemberRow, 'invite_expires_at' | 'last_invite_sent_at' | 'created_at'>) {
  const expiry = new Date(member.invite_expires_at).getTime();
  const sent = new Date(member.last_invite_sent_at || member.created_at).getTime();
  return Date.now() > expiry || Date.now() - sent > INVITE_TTL_MS;
}

function otpSubject(member: Pick<MemberRow, 'email' | 'mobile'>) {
  return member.email || member.mobile || '';
}

function mapMember(row: MemberRow): TeamMember {
  return {
    id: row.id,
    email: row.email,
    mobile: row.mobile,
    status: row.status,
    access: normalizeTeamAccess(row.tab_access),
    contactVerified: Boolean(row.contact_verified_at),
    lastInviteSentAt: row.last_invite_sent_at,
    acceptedAt: row.accepted_at,
    inviteExpiresAt: row.invite_expires_at,
    createdAt: row.created_at,
  };
}

function inviteUrl(token: string) {
  return `${SITE_URL}/business/invite/${encodeURIComponent(token)}`;
}

export function inviteSenderName(business: { businessName?: string | null; ownerName?: string | null }) {
  return business.businessName?.trim() || business.ownerName?.trim() || 'A teammate';
}

async function loadBusinessCard(businessId: string): Promise<LinkedBusiness | null> {
  const supabase = db();
  if (!supabase) return null;
  const { data: row } = await supabase
    .from('Business')
    .select(
      'id, businessName, slug, selectedPlan, paymentStatus, planExpiresAt, billingCycle, updatedAt, createdAt, fullName, owner_name, workEmail, email, mobile, owner_mobile, profilePictureUrl',
    )
    .eq('id', businessId)
    .maybeSingle();
  if (!row?.id) return null;
  const text = (value: string | null | undefined) => value?.trim() || null;
  return {
    id: row.id,
    businessName: row.businessName ?? null,
    slug: row.slug ?? null,
    selectedPlan: row.selectedPlan ?? null,
    effectivePlan: getEffectivePlanKey({
      paymentStatus: row.paymentStatus,
      selectedPlan: row.selectedPlan,
      billingCycle: row.billingCycle,
      planExpiresAt: row.planExpiresAt,
      updatedAt: row.updatedAt,
      createdAt: row.createdAt,
    }),
    paymentStatus: row.paymentStatus ?? null,
    planExpiresAt: row.planExpiresAt ?? null,
    billingCycle: row.billingCycle ?? null,
    ownerName: text(row.owner_name) ?? text(row.fullName),
    contactEmail: text(row.workEmail)?.toLowerCase() ?? text(row.email)?.toLowerCase() ?? null,
    contactMobile: extractIndianMobileDigits(row.mobile || row.owner_mobile || '') || null,
    profilePictureUrl: text(row.profilePictureUrl),
  };
}

async function identityTakenByBusiness(email: string, mobile: string, exceptBusinessId?: string) {
  const supabase = db();
  if (!supabase) return false;
  if (email) {
    const [{ data: byEmail }, { data: byWork }] = await Promise.all([
      supabase.from('Business').select('id').ilike('email', email).limit(3),
      supabase.from('Business').select('id').ilike('workEmail', email).limit(3),
    ]);
    if ([...(byEmail || []), ...(byWork || [])].some((row) => row.id !== exceptBusinessId)) return true;
  }
  if (mobile) {
    const { data } = await supabase
      .from('Business')
      .select('id, mobile, owner_mobile, publicPhone')
      .or(`mobile.eq.${mobile},owner_mobile.eq.${mobile},publicPhone.eq.${mobile}`)
      .limit(8);
    if (
      (data || []).some(
        (row) =>
          row.id !== exceptBusinessId &&
          [row.mobile, row.owner_mobile, row.publicPhone].some(
            (value) => extractIndianMobileDigits(value) === mobile,
          ),
      )
    ) {
      return true;
    }
  }
  return false;
}

async function identityTakenByTeam(email: string, mobile: string, exceptId?: string) {
  const supabase = db();
  if (!supabase) return false;
  const filters: string[] = [];
  if (email) filters.push(`email.eq.${email}`);
  if (mobile) filters.push(`mobile.eq.${mobile}`);
  if (!filters.length) return false;
  const { data } = await supabase
    .from('business_team_members')
    .select('id')
    .in('status', ['pending', 'active'])
    .or(filters.join(','));
  return (data || []).some((row) => row.id !== exceptId);
}

const INVITE_LINK_EXPIRED = 'This invite link has expired.';
const INVITE_LINK_INVALID = 'This invite link is not valid.';

export async function expireStaleInvites(businessId?: string) {
  const supabase = db();
  if (!supabase) return;
  const now = new Date();
  const payload = {
    status: 'expired' as const,
    password_hash: null,
    updated_at: now.toISOString(),
  };
  const sentCutoff = new Date(now.getTime() - INVITE_TTL_MS).toISOString();
  let byExpiry = supabase
    .from('business_team_members')
    .update(payload)
    .eq('status', 'pending')
    .lt('invite_expires_at', now.toISOString());
  let byAge = supabase
    .from('business_team_members')
    .update(payload)
    .eq('status', 'pending')
    .lt('last_invite_sent_at', sentCutoff);
  if (businessId) {
    byExpiry = byExpiry.eq('business_id', businessId);
    byAge = byAge.eq('business_id', businessId);
  }
  const [expired, aged] = await Promise.all([byExpiry, byAge]);
  if (expired.error) console.error('[team] expire', expired.error);
  if (aged.error) console.error('[team] expire-age', aged.error);
}

async function dispatchInvite(input: {
  email: string | null;
  mobile: string | null;
  token: string;
  code: string;
  businessName: string;
  inviterName: string;
}) {
  const acceptUrl = inviteUrl(input.token);
  const sent = { email: false, whatsapp: false, otp: false };
  if (input.email) {
    sent.email = await sendTeamInviteEmail({
      to: input.email,
      businessName: input.businessName,
      inviterName: input.inviterName,
      acceptUrl,
      code: input.code,
    });
    sent.otp = sent.email;
  }
  if (input.mobile) {
    const otp = await sendWhatsAppOtp(`91${input.mobile}`, input.code);
    sent.otp = otp.ok;
    sent.whatsapp = await sendTeamInviteWhatsApp({
      mobile: input.mobile,
      inviterName: input.inviterName,
      businessName: input.businessName,
      token: input.token,
    });
  }
  return sent;
}

async function issueAndSendInvite(member: MemberRow, token: string, business: LinkedBusiness) {
  const subject = otpSubject(member);
  if (!subject) return { success: false as const, error: 'This invite has no email or mobile.' };

  let code = '';
  try {
    code = await issueOtpChallenge(otpPurpose(member.id), subject);
  } catch (error) {
    return {
      success: false as const,
      error: otpIssueErrorMessage(error, 'Could not send the verification code. Try again shortly.'),
    };
  }

  const sent = await dispatchInvite({
    email: member.email,
    mobile: member.mobile,
    token,
    code,
    businessName: business.businessName || 'your business',
    inviterName: inviteSenderName(business),
  });

  const warnings: string[] = [];
  if (member.email && !sent.email) warnings.push('Email could not be sent. Try resend in a minute.');
  if (member.mobile && !sent.otp) {
    warnings.push('WhatsApp could not deliver the verification code. Confirm the number and try resend.');
  } else if (member.mobile && !sent.whatsapp) {
    warnings.push('The invite link on WhatsApp needs the finderb_team_invite template. The verification code was still sent.');
  }

  return { success: true as const, warning: warnings.join(' ') || undefined };
}

export async function getTeamMemberRecord(businessId: string, memberId: string): Promise<TeamMember | null> {
  const supabase = db();
  if (!supabase) return null;
  const { data } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('id', memberId)
    .eq('business_id', businessId)
    .maybeSingle();
  return data ? mapMember(data as MemberRow) : null;
}

export async function listTeamMembers(businessId: string): Promise<TeamMember[]> {
  await expireStaleInvites(businessId);
  const supabase = db();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('business_id', businessId)
    .in('status', ['pending', 'active', 'expired'])
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[team] list', error);
    return [];
  }
  return ((data || []) as MemberRow[]).map(mapMember);
}

export async function inviteTeamMember(input: {
  businessId: string;
  channel: TeamInviteChannel;
  email?: string;
  mobile?: string;
  access?: unknown;
  invitedBy?: string | null;
}): Promise<{ success: true; member: TeamMember; warning?: string } | { success: false; error: string }> {
  const email = input.channel === 'email' ? input.email?.trim().toLowerCase() || '' : '';
  const mobile = input.channel === 'phone' ? extractIndianMobileDigits(input.mobile || '') : '';
  if (input.channel === 'email' && !EMAIL_RE.test(email)) {
    return { success: false, error: 'Enter a valid email address.' };
  }
  if (input.channel === 'phone' && !isValidIndianMobileDigits(mobile)) {
    return { success: false, error: 'Enter a valid 10-digit mobile number.' };
  }

  const hour = checkRateLimit(`teamInviteHour:${input.businessId}`, RATE_LIMITS.teamInviteHour);
  if (!hour.allowed) {
    return { success: false, error: `Wait ${hour.retryAfterSec} seconds before sending more invites.` };
  }

  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not save the invite.' };

  await expireStaleInvites(input.businessId);

  if (await identityTakenByBusiness(email, mobile, input.businessId)) {
    return { success: false, error: 'That email or mobile is already tied to another business.' };
  }
  if (await identityTakenByTeam(email, mobile)) {
    return { success: false, error: 'That email or mobile already has a pending or active invite.' };
  }

  const business = await loadBusinessCard(input.businessId);
  if (!business) return { success: false, error: 'Business not found.' };

  const token = newToken();
  const now = new Date();
  const access = normalizeTeamAccess(input.access);
  const reusable = await supabase
    .from('business_team_members')
    .select('*')
    .eq('business_id', input.businessId)
    .in('status', ['expired', 'revoked'])
    .or([email ? `email.eq.${email}` : '', mobile ? `mobile.eq.${mobile}` : ''].filter(Boolean).join(','))
    .maybeSingle();

  const payload = {
    business_id: input.businessId,
    email: email || null,
    mobile: mobile || null,
    password_hash: null,
    status: 'pending',
    invite_token_hash: hashToken(token),
    invite_expires_at: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
    last_invite_sent_at: now.toISOString(),
    accepted_at: null,
    contact_verified_at: null,
    tab_access: access,
    invited_by: input.invitedBy || null,
    updated_at: now.toISOString(),
  };

  let row: MemberRow | null = null;
  if (reusable.data?.id) {
    const { data, error } = await supabase
      .from('business_team_members')
      .update(payload)
      .eq('id', reusable.data.id)
      .select('*')
      .single();
    if (error || !data) {
      console.error('[team] invite reuse', error);
      return { success: false, error: 'Could not create the invite.' };
    }
    row = data as MemberRow;
  } else {
    const { data, error } = await supabase
      .from('business_team_members')
      .insert({ ...payload, created_at: now.toISOString() })
      .select('*')
      .single();
    if (error || !data) {
      console.error('[team] invite insert', error);
      return { success: false, error: 'Could not create the invite.' };
    }
    row = data as MemberRow;
  }

  const sent = await issueAndSendInvite(row, token, business);
  if (!sent.success) {
    await supabase
      .from('business_team_members')
      .update({ status: 'expired', updated_at: new Date().toISOString() })
      .eq('id', row.id);
    return sent;
  }

  return {
    success: true,
    member: mapMember(row),
    warning: sent.warning,
  };
}

export async function resendTeamInvite(input: {
  businessId: string;
  memberId: string;
}): Promise<{ success: true; warning?: string } | { success: false; error: string }> {
  const perMember = checkRateLimit(`teamInvite:${input.memberId}`, RATE_LIMITS.teamInvite);
  if (!perMember.allowed) {
    return { success: false, error: `You can resend in ${perMember.retryAfterSec} seconds.` };
  }
  const hour = checkRateLimit(`teamInviteHour:${input.businessId}`, RATE_LIMITS.teamInviteHour);
  if (!hour.allowed) {
    return { success: false, error: `Wait ${hour.retryAfterSec} seconds before sending more invites.` };
  }

  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not resend the invite.' };
  await expireStaleInvites(input.businessId);

  const { data: row } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('id', input.memberId)
    .eq('business_id', input.businessId)
    .maybeSingle();
  if (!row) return { success: false, error: 'Invite not found.' };
  const member = row as MemberRow;
  if (member.status !== 'pending' && member.status !== 'expired') {
    return { success: false, error: 'Only pending or expired invites can be resent.' };
  }
  if (member.last_invite_sent_at) {
    const elapsed = Date.now() - new Date(member.last_invite_sent_at).getTime();
    if (elapsed < RESEND_GAP_MS) {
      const wait = Math.ceil((RESEND_GAP_MS - elapsed) / 1000);
      return { success: false, error: `You can resend in ${wait} seconds.` };
    }
  }

  const business = await loadBusinessCard(input.businessId);
  if (!business) return { success: false, error: 'Business not found.' };

  const token = newToken();
  const now = new Date();
  const { data: updated, error } = await supabase
    .from('business_team_members')
    .update({
      invite_token_hash: hashToken(token),
      invite_expires_at: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
      last_invite_sent_at: now.toISOString(),
      status: 'pending',
      accepted_at: null,
      contact_verified_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', member.id)
    .select('*')
    .single();
  if (error || !updated) return { success: false, error: 'Could not resend the invite.' };

  const sent = await issueAndSendInvite(updated as MemberRow, token, business);
  if (!sent.success) return sent;
  return { success: true, warning: sent.warning };
}

export async function verifyTeamInviteOtp(input: {
  businessId?: string;
  memberId?: string;
  token?: string;
  code: string;
}): Promise<{ success: true; memberId: string } | { success: false; error: string }> {
  const limit = await enforceRateLimit('authEmail', `team-invite-otp:${input.memberId || input.token || 'x'}`);
  if (!limit.ok) return { success: false, error: limit.error };

  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not verify the code.' };

  let member: MemberRow | null = null;
  if (input.token?.trim()) {
    const { data } = await supabase
      .from('business_team_members')
      .select('*')
      .eq('invite_token_hash', hashToken(input.token.trim()))
      .maybeSingle();
    member = (data as MemberRow) || null;
  } else if (input.businessId && input.memberId) {
    const { data } = await supabase
      .from('business_team_members')
      .select('*')
      .eq('id', input.memberId)
      .eq('business_id', input.businessId)
      .maybeSingle();
    member = (data as MemberRow) || null;
  }

  if (!member) return { success: false, error: INVITE_LINK_INVALID };
  if (member.status === 'expired' || inviteTimedOut(member)) {
    await expireStaleInvites(member.business_id);
    return { success: false, error: INVITE_LINK_EXPIRED };
  }
  if (member.status !== 'pending') {
    return { success: false, error: 'This invite has already been used or cancelled.' };
  }

  const subject = otpSubject(member);
  if (!(await consumeOtpChallenge(otpPurpose(member.id), subject, input.code))) {
    return { success: false, error: 'That code is incorrect or has expired. Request a new one.' };
  }

  const { error } = await supabase
    .from('business_team_members')
    .update({
      contact_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', member.id)
    .eq('status', 'pending');
  if (error) return { success: false, error: 'Could not verify the code.' };
  return { success: true, memberId: member.id };
}

export async function updateTeamAccess(input: {
  businessId: string;
  memberId: string;
  access: unknown;
}): Promise<{ success: true; member: TeamMember } | { success: false; error: string }> {
  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not update access.' };
  const access = normalizeTeamAccess(input.access);
  const { data, error } = await supabase
    .from('business_team_members')
    .update({ tab_access: access, updated_at: new Date().toISOString() })
    .eq('id', input.memberId)
    .eq('business_id', input.businessId)
    .in('status', ['pending', 'active'])
    .select('*')
    .single();
  if (error || !data) return { success: false, error: 'Could not update access for this person.' };
  return { success: true, member: mapMember(data as MemberRow) };
}

export async function revokeTeamMember(input: {
  businessId: string;
  memberId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not remove this person.' };
  const { data: row } = await supabase
    .from('business_team_members')
    .select('id')
    .eq('id', input.memberId)
    .eq('business_id', input.businessId)
    .maybeSingle();
  if (row?.id) {
    await discardOtpChallenge(otpPurpose(row.id), '');
  }
  const { error } = await supabase
    .from('business_team_members')
    .update({
      status: 'revoked',
      password_hash: null,
      invite_token_hash: hashToken(randomBytes(12).toString('hex')),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.memberId)
    .eq('business_id', input.businessId);
  if (error) return { success: false, error: 'Could not remove this person.' };
  return { success: true };
}

export async function getTeamInvitePreview(token: string): Promise<
  | {
      success: true;
      businessName: string;
      email: string | null;
      mobile: string | null;
      contactVerified: boolean;
      expiresAt: string;
    }
  | { success: false; error: string }
> {
  const supabase = db();
  if (!supabase || !token.trim()) return { success: false, error: INVITE_LINK_INVALID };
  const { data } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('invite_token_hash', hashToken(token.trim()))
    .maybeSingle();
  if (!data) return { success: false, error: INVITE_LINK_INVALID };
  const member = data as MemberRow;
  if (member.status === 'expired' || inviteTimedOut(member)) {
    await expireStaleInvites(member.business_id);
    return { success: false, error: INVITE_LINK_EXPIRED };
  }
  if (member.status !== 'pending') {
    return { success: false, error: 'This invite has already been used or cancelled.' };
  }
  const business = await loadBusinessCard(member.business_id);
  return {
    success: true,
    businessName: business?.businessName || 'this business',
    email: member.email,
    mobile: member.mobile,
    contactVerified: Boolean(member.contact_verified_at),
    expiresAt: member.invite_expires_at,
  };
}

export async function acceptTeamInvite(input: {
  token: string;
  password: string;
  code?: string;
}): Promise<{ success: true; businessId: string } | { success: false; error: string }> {
  const passwordCheck = validatePasswordLength(input.password.trim(), PASSWORD_MIN_LENGTH_MERCHANT);
  if (!passwordCheck.ok) return { success: false, error: passwordCheck.error };

  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not accept the invite.' };

  const { data } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('invite_token_hash', hashToken(input.token.trim()))
    .maybeSingle();
  if (!data) return { success: false, error: INVITE_LINK_INVALID };
  const member = data as MemberRow;
  if (member.status === 'expired' || inviteTimedOut(member)) {
    await expireStaleInvites(member.business_id);
    return { success: false, error: INVITE_LINK_EXPIRED };
  }
  if (member.status !== 'pending') {
    return { success: false, error: 'This invite has already been used or cancelled.' };
  }
  if (await identityTakenByBusiness(member.email || '', member.mobile || '', member.business_id)) {
    return { success: false, error: 'That email or mobile is already tied to another business.' };
  }

  if (!member.contact_verified_at) {
    const verified = await verifyTeamInviteOtp({ token: input.token, code: input.code || '' });
    if (!verified.success) return verified;
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password.trim());
  const { error } = await supabase
    .from('business_team_members')
    .update({
      status: 'active',
      password_hash: passwordHash,
      accepted_at: now,
      contact_verified_at: member.contact_verified_at || now,
      updated_at: now,
    })
    .eq('id', member.id)
    .eq('status', 'pending');
  if (error) return { success: false, error: 'Could not finish setting up access.' };

  await setBusinessSessionCookie(member.business_id, { teamMemberId: member.id });
  return { success: true, businessId: member.business_id };
}

export async function findActiveTeamMembership(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<{ business: LinkedBusiness; memberId: string; access: TeamAccessMap } | null> {
  const email = input.email?.toLowerCase().trim() || '';
  const phone = extractIndianMobileDigits(input.phone || '');
  const supabase = db();
  if (!supabase || (!email && !phone)) return null;

  let query = supabase.from('business_team_members').select('*').eq('status', 'active');
  if (email && phone) {
    query = query.or(`email.eq.${email},mobile.eq.${phone}`);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    query = query.eq('mobile', phone);
  }
  const { data } = await query.limit(1);
  const row = (data?.[0] as MemberRow | undefined) || undefined;
  if (!row?.business_id) return null;
  const business = await loadBusinessCard(row.business_id);
  if (!business) return null;
  return { business, memberId: row.id, access: normalizeTeamAccess(row.tab_access) };
}

export async function findActiveTeamBusiness(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<LinkedBusiness | null> {
  const membership = await findActiveTeamMembership(input);
  return membership?.business ?? null;
}

export async function verifyTeamMemberPassword(input: {
  email?: string | null;
  phone?: string | null;
  password: string;
}): Promise<{ businessId: string; email: string | null; mobile: string | null; memberId: string } | null> {
  const email = input.email?.toLowerCase().trim() || '';
  const phone = extractIndianMobileDigits(input.phone || '');
  const supabase = db();
  if (!supabase || (!email && !phone)) return null;

  let query = supabase.from('business_team_members').select('*').eq('status', 'active');
  if (email && phone) {
    query = query.or(`email.eq.${email},mobile.eq.${phone}`);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    query = query.eq('mobile', phone);
  }
  const { data } = await query.limit(8);
  const { verifyPassword } = await import('@/lib/security/password');
  for (const row of (data || []) as MemberRow[]) {
    if (!row.password_hash) continue;
    const check = await verifyPassword(input.password, row.password_hash);
    if (check.valid) {
      return { businessId: row.business_id, email: row.email, mobile: row.mobile, memberId: row.id };
    }
  }
  return null;
}

import 'server-only';

import { createHash, randomBytes, timingSafeEqual } from 'crypto';
import { createServiceClient } from '@/lib/supabase/service';
import { SITE_URL } from '@/lib/businessSeo';
import { sendTeamInviteEmail } from '@/lib/email/sendTeamInviteEmail';
import { sendTeamInviteWhatsApp } from '@/lib/whatsapp/sendTeamInviteWhatsApp';
import { extractIndianMobileDigits, isValidIndianMobileDigits } from '@/lib/indianPhone';
import { hashPassword, validatePasswordLength, PASSWORD_MIN_LENGTH_MERCHANT } from '@/lib/security/password';
import { checkRateLimit, RATE_LIMITS } from '@/lib/security/rateLimit';
import { setBusinessSessionCookie } from '@/lib/security/session';
import type { LinkedBusiness } from '@/lib/auth/merchantPortal.server';
import { getEffectivePlanKey } from '@/lib/subscription/merchantSubscription';

export type TeamMemberStatus = 'pending' | 'active' | 'revoked';

export type TeamMember = {
  id: string;
  email: string | null;
  mobile: string | null;
  status: TeamMemberStatus;
  lastInviteSentAt: string | null;
  acceptedAt: string | null;
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
  invited_by: string | null;
  created_at: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
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

function tokensEqual(stored: string, given: string) {
  const left = Buffer.from(stored);
  const right = Buffer.from(given);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function mapMember(row: MemberRow): TeamMember {
  return {
    id: row.id,
    email: row.email,
    mobile: row.mobile,
    status: row.status,
    lastInviteSentAt: row.last_invite_sent_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

function inviteUrl(token: string) {
  return `${SITE_URL}/business/invite/${encodeURIComponent(token)}`;
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

async function dispatchInvite(input: {
  email: string | null;
  mobile: string | null;
  token: string;
  businessName: string;
  inviterName: string;
}) {
  const acceptUrl = inviteUrl(input.token);
  const sent = { email: false, whatsapp: false };
  if (input.email) {
    sent.email = await sendTeamInviteEmail({
      to: input.email,
      businessName: input.businessName,
      inviterName: input.inviterName,
      acceptUrl,
    });
  }
  if (input.mobile) {
    sent.whatsapp = await sendTeamInviteWhatsApp({
      mobile: input.mobile,
      inviterName: input.inviterName,
      businessName: input.businessName,
      token: input.token,
    });
  }
  return sent;
}

export async function listTeamMembers(businessId: string): Promise<TeamMember[]> {
  const supabase = db();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('business_id', businessId)
    .neq('status', 'revoked')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('[team] list', error);
    return [];
  }
  return ((data || []) as MemberRow[]).map(mapMember);
}

export async function inviteTeamMember(input: {
  businessId: string;
  email?: string;
  mobile?: string;
  invitedBy?: string | null;
}): Promise<{ success: true; member: TeamMember; warning?: string } | { success: false; error: string }> {
  const email = input.email?.trim().toLowerCase() || '';
  const mobile = extractIndianMobileDigits(input.mobile || '');
  if (email && !EMAIL_RE.test(email)) {
    return { success: false, error: 'Enter a valid email address.' };
  }
  if (mobile && !isValidIndianMobileDigits(mobile)) {
    return { success: false, error: 'Enter a valid 10-digit mobile number.' };
  }
  if (!email && !mobile) {
    return { success: false, error: 'Add an email, a mobile number, or both.' };
  }

  const hour = checkRateLimit(`teamInviteHour:${input.businessId}`, RATE_LIMITS.teamInviteHour);
  if (!hour.allowed) {
    return { success: false, error: `Wait ${hour.retryAfterSec} seconds before sending more invites.` };
  }

  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not save the invite.' };

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
  const row = {
    business_id: input.businessId,
    email: email || null,
    mobile: mobile || null,
    password_hash: null,
    status: 'pending',
    invite_token_hash: hashToken(token),
    invite_expires_at: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
    last_invite_sent_at: now.toISOString(),
    accepted_at: null,
    invited_by: input.invitedBy || null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  const { data, error } = await supabase.from('business_team_members').insert(row).select('*').single();
  if (error || !data) {
    console.error('[team] invite insert', error);
    return { success: false, error: 'Could not create the invite.' };
  }

  const sent = await dispatchInvite({
    email: email || null,
    mobile: mobile || null,
    token,
    businessName: business.businessName || 'your business',
    inviterName: business.ownerName || 'A teammate',
  });

  const warnings: string[] = [];
  if (email && !sent.email) warnings.push('Email could not be sent. Try resend in a minute.');
  if (mobile && !sent.whatsapp) {
    warnings.push(
      'WhatsApp needs the finderb_team_invite template. Create it in Meta, then use Resend invitation.',
    );
  }

  return {
    success: true,
    member: mapMember(data as MemberRow),
    warning: warnings.join(' ') || undefined,
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

  const { data: row } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('id', input.memberId)
    .eq('business_id', input.businessId)
    .maybeSingle();
  if (!row) return { success: false, error: 'Invite not found.' };
  const member = row as MemberRow;
  if (member.status !== 'pending') {
    return { success: false, error: 'Only pending invites can be resent.' };
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
  const { error } = await supabase
    .from('business_team_members')
    .update({
      invite_token_hash: hashToken(token),
      invite_expires_at: new Date(now.getTime() + INVITE_TTL_MS).toISOString(),
      last_invite_sent_at: now.toISOString(),
      status: 'pending',
      accepted_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', member.id);
  if (error) return { success: false, error: 'Could not resend the invite.' };

  const sent = await dispatchInvite({
    email: member.email,
    mobile: member.mobile,
    token,
    businessName: business.businessName || 'your business',
    inviterName: business.ownerName || 'A teammate',
  });
  const warnings: string[] = [];
  if (member.email && !sent.email) warnings.push('Email could not be sent.');
  if (member.mobile && !sent.whatsapp) {
    warnings.push('WhatsApp invite was not delivered. Confirm the finderb_team_invite template.');
  }
  return { success: true, warning: warnings.join(' ') || undefined };
}

export async function revokeTeamMember(input: {
  businessId: string;
  memberId: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const supabase = db();
  if (!supabase) return { success: false, error: 'Could not remove this person.' };
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
  | { success: true; businessName: string; email: string | null; mobile: string | null }
  | { success: false; error: string }
> {
  const supabase = db();
  if (!supabase || !token.trim()) return { success: false, error: 'This invite link is not valid.' };
  const { data } = await supabase
    .from('business_team_members')
    .select('*')
    .eq('invite_token_hash', hashToken(token.trim()))
    .maybeSingle();
  if (!data) return { success: false, error: 'This invite link is not valid.' };
  const member = data as MemberRow;
  if (member.status !== 'pending') {
    return { success: false, error: 'This invite has already been used or cancelled.' };
  }
  if (new Date(member.invite_expires_at).getTime() < Date.now()) {
    return { success: false, error: 'This invite has expired. Ask the owner to resend it.' };
  }
  const business = await loadBusinessCard(member.business_id);
  return {
    success: true,
    businessName: business?.businessName || 'this business',
    email: member.email,
    mobile: member.mobile,
  };
}

export async function acceptTeamInvite(input: {
  token: string;
  password: string;
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
  if (!data) return { success: false, error: 'This invite link is not valid.' };
  const member = data as MemberRow;
  if (member.status !== 'pending') {
    return { success: false, error: 'This invite has already been used or cancelled.' };
  }
  if (new Date(member.invite_expires_at).getTime() < Date.now()) {
    return { success: false, error: 'This invite has expired. Ask the owner to resend it.' };
  }
  if (await identityTakenByBusiness(member.email || '', member.mobile || '', member.business_id)) {
    return { success: false, error: 'That email or mobile is already tied to another business.' };
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(input.password.trim());
  const { error } = await supabase
    .from('business_team_members')
    .update({
      status: 'active',
      password_hash: passwordHash,
      accepted_at: now,
      updated_at: now,
    })
    .eq('id', member.id)
    .eq('status', 'pending');
  if (error) return { success: false, error: 'Could not finish setting up access.' };

  await setBusinessSessionCookie(member.business_id);
  return { success: true, businessId: member.business_id };
}

export async function findActiveTeamBusiness(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<LinkedBusiness | null> {
  const email = input.email?.toLowerCase().trim() || '';
  const phone = extractIndianMobileDigits(input.phone || '');
  const supabase = db();
  if (!supabase || (!email && !phone)) return null;

  let query = supabase.from('business_team_members').select('business_id').eq('status', 'active');
  if (email && phone) {
    query = query.or(`email.eq.${email},mobile.eq.${phone}`);
  } else if (email) {
    query = query.eq('email', email);
  } else {
    query = query.eq('mobile', phone);
  }
  const { data } = await query.limit(1);
  const businessId = data?.[0]?.business_id as string | undefined;
  if (!businessId) return null;
  return loadBusinessCard(businessId);
}

export async function verifyTeamMemberPassword(input: {
  email?: string | null;
  phone?: string | null;
  password: string;
}): Promise<{ businessId: string; email: string | null; mobile: string | null } | null> {
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
      return { businessId: row.business_id, email: row.email, mobile: row.mobile };
    }
  }
  return null;
}

'use server';

import { assertBusinessOwner } from '@/lib/businessTeam/teamActor.server';
import {
  acceptTeamInvite,
  getTeamInvitePreview,
  inviteTeamMember,
  listTeamMembers,
  resendTeamInvite,
  revokeTeamMember,
  updateTeamAccess,
  verifyTeamInviteOtp,
} from '@/lib/businessTeam/teamInvites.server';
import type { TeamInviteChannel } from '@/lib/businessTeam/teamAccess';

export async function listBusinessTeam(businessId: string) {
  const auth = await assertBusinessOwner(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  const members = await listTeamMembers(businessId);
  return { success: true as const, members };
}

export async function inviteBusinessTeamMember(
  businessId: string,
  input: { channel: TeamInviteChannel; email?: string; mobile?: string; access?: unknown },
) {
  const auth = await assertBusinessOwner(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return inviteTeamMember({
    businessId,
    channel: input.channel,
    email: input.email,
    mobile: input.mobile,
    access: input.access,
    invitedBy: businessId,
  });
}

export async function resendBusinessTeamInvite(businessId: string, memberId: string) {
  const auth = await assertBusinessOwner(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return resendTeamInvite({ businessId, memberId });
}

export async function verifyBusinessTeamInviteOtp(
  businessId: string,
  memberId: string,
  code: string,
) {
  const auth = await assertBusinessOwner(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return verifyTeamInviteOtp({ businessId, memberId, code });
}

export async function updateBusinessTeamAccess(
  businessId: string,
  memberId: string,
  access: unknown,
) {
  const auth = await assertBusinessOwner(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return updateTeamAccess({ businessId, memberId, access });
}

export async function revokeBusinessTeamMember(businessId: string, memberId: string) {
  const auth = await assertBusinessOwner(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return revokeTeamMember({ businessId, memberId });
}

export async function previewBusinessTeamInvite(token: string) {
  return getTeamInvitePreview(token);
}

export async function verifyBusinessTeamInviteOtpByToken(token: string, code: string) {
  return verifyTeamInviteOtp({ token, code });
}

export async function acceptBusinessTeamInvite(token: string, password: string, code?: string) {
  return acceptTeamInvite({ token, password, code });
}

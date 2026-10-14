'use server';

import { assertBusinessSession } from '@/lib/security/session';
import {
  acceptTeamInvite,
  getTeamInvitePreview,
  inviteTeamMember,
  listTeamMembers,
  resendTeamInvite,
  revokeTeamMember,
} from '@/lib/businessTeam/teamInvites.server';

export async function listBusinessTeam(businessId: string) {
  const auth = await assertBusinessSession(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  const members = await listTeamMembers(businessId);
  return { success: true as const, members };
}

export async function inviteBusinessTeamMember(
  businessId: string,
  input: { email?: string; mobile?: string },
) {
  const auth = await assertBusinessSession(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return inviteTeamMember({
    businessId,
    email: input.email,
    mobile: input.mobile,
    invitedBy: businessId,
  });
}

export async function resendBusinessTeamInvite(businessId: string, memberId: string) {
  const auth = await assertBusinessSession(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return resendTeamInvite({ businessId, memberId });
}

export async function revokeBusinessTeamMember(businessId: string, memberId: string) {
  const auth = await assertBusinessSession(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };
  return revokeTeamMember({ businessId, memberId });
}

export async function previewBusinessTeamInvite(token: string) {
  return getTeamInvitePreview(token);
}

export async function acceptBusinessTeamInvite(token: string, password: string) {
  return acceptTeamInvite({ token, password });
}

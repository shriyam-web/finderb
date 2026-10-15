import 'server-only';

import { getSessionBusinessId, getSessionTeamMemberId } from '@/lib/security/session';
import {
  TEAM_OWNER_ONLY,
  TEAM_TAB_LOCKED,
  canEditTeamTab,
  canViewTeamTab,
  ownerTeamAccess,
  type TeamAccessMap,
  type TeamTabKey,
} from '@/lib/businessTeam/teamAccess';
import { expireStaleInvites, getTeamMemberRecord } from '@/lib/businessTeam/teamInvites.server';

export type BusinessActor =
  | { ok: true; isOwner: true; teamMemberId: null; access: TeamAccessMap }
  | { ok: true; isOwner: false; teamMemberId: string; access: TeamAccessMap }
  | { ok: false; error: string };

export async function resolveBusinessActor(businessId: string): Promise<BusinessActor> {
  const sessionId = await getSessionBusinessId();
  if (!sessionId || sessionId !== businessId) {
    return { ok: false, error: 'Unauthorized' };
  }

  await expireStaleInvites(businessId);

  const teamMemberId = await getSessionTeamMemberId();
  if (!teamMemberId) {
    return { ok: true, isOwner: true, teamMemberId: null, access: ownerTeamAccess() };
  }

  const member = await getTeamMemberRecord(businessId, teamMemberId);
  if (!member || member.status !== 'active') {
    return { ok: false, error: 'This team login is no longer active. Ask the owner to invite you again.' };
  }

  return {
    ok: true,
    isOwner: false,
    teamMemberId: member.id,
    access: member.access,
  };
}

export async function assertBusinessOwner(
  businessId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const actor = await resolveBusinessActor(businessId);
  if (!actor.ok) return actor;
  if (!actor.isOwner) return { ok: false, error: TEAM_OWNER_ONLY };
  return { ok: true };
}

export async function assertBusinessTab(
  businessId: string,
  tab: TeamTabKey,
  mode: 'view' | 'edit' = 'view',
): Promise<{ ok: true; isOwner: boolean; access: TeamAccessMap } | { ok: false; error: string }> {
  const actor = await resolveBusinessActor(businessId);
  if (!actor.ok) return actor;
  const allowed =
    mode === 'edit'
      ? canEditTeamTab(actor.access, tab, actor.isOwner)
      : canViewTeamTab(actor.access, tab, actor.isOwner);
  if (!allowed) return { ok: false, error: TEAM_TAB_LOCKED };
  return { ok: true, isOwner: actor.isOwner, access: actor.access };
}

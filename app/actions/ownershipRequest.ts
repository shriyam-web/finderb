'use server';

import { ownershipDetailsLock, pendingOwnershipForViewer, recordOwnerOwnershipDecision, submitOwnershipRequest } from '@/lib/ownershipRequest.server';
import { assertBusinessOwner } from '@/lib/businessTeam/teamActor.server';
import { getSessionBusinessId, isBusinessSupportSession } from '@/lib/security/session';
import { getSession } from '@/app/actions/user';

export async function requestBusinessOwnership(input: {
  businessId: string;
  name: string;
  email: string;
  phone: string;
}) {
  return submitOwnershipRequest(input);
}

export async function ownershipRequestPending(businessId: string) {
  const session = await getSession();
  const user = session?.success ? session.user : null;
  if (!user?.id && !user?.email) return { pending: false };
  const pending = await pendingOwnershipForViewer(businessId, {
    userId: user?.id,
    email: user?.email,
  });
  return { pending };
}

export async function respondToOwnershipRequest(input: {
  businessId: string;
  requestId: string;
  decision: 'approved' | 'denied';
  note?: string;
}) {
  if (await isBusinessSupportSession()) {
    return { success: false as const, error: 'A support login cannot answer this request.' };
  }
  const owner = await assertBusinessOwner(input.businessId);
  if (!owner.ok) return { success: false as const, error: owner.error };
  return recordOwnerOwnershipDecision(input);
}

export async function ownershipDetailsHold(businessId: string) {
  const sessionId = await getSessionBusinessId();
  if (!sessionId || sessionId !== businessId.trim()) {
    return { locked: false as const, until: null, message: '' };
  }
  const lock = await ownershipDetailsLock(businessId);
  if (!lock.locked) return { locked: false as const, until: null, message: '' };
  return { locked: true as const, until: lock.until, message: lock.error };
}

export async function ownershipRequestDefaults() {
  const session = await getSession();
  const user = session?.success ? session.user : null;
  return {
    name: String(user?.fullName || ''),
    email: String(user?.email || ''),
    phone: String(user?.phone || ''),
  };
}

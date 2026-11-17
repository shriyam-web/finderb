'use server';

import { verifyBusinessKyb, type KybMethod } from '@/lib/kyb/verifyBusiness.server';
import { assertBusinessSession } from '@/lib/security/session';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

const METHODS = new Set<KybMethod>(['pan', 'udyam', 'gstin']);

export async function submitBusinessKyb(businessId: string, method: string, value: string) {
  if (!businessId) return { success: false as const, error: 'Business ID is required' };
  if (!METHODS.has(method as KybMethod)) {
    return { success: false as const, error: 'Choose PAN, Udyam, or GSTIN.' };
  }

  const auth = await assertBusinessSession(businessId);
  if (!auth.ok) return { success: false as const, error: auth.error };

  const limit = await enforceRateLimit('kyb', businessId);
  if (!limit.ok) return { success: false as const, error: limit.error };

  return verifyBusinessKyb(businessId, method as KybMethod, value);
}

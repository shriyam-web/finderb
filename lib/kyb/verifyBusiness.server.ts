import 'server-only';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { enforceRateLimitForKey } from '@/lib/security/rateLimit';
import { resolveBusinessActor } from '@/lib/businessTeam/teamActor.server';
import {
  cashfreeVerify,
  CashfreeKybError,
  type CashfreeGstinResult,
  type CashfreePanResult,
  type CashfreeUdyamResult,
} from '@/lib/kyb/cashfree.server';
import {
  anyNameMatches,
  businessNamesMatch,
  cashfreePersonName,
  maskPan,
  normalizeGstin,
  normalizePan,
  normalizeUdyam,
} from '@/lib/kyb/ids';

export type KybMethod = 'pan' | 'udyam' | 'gstin';

export type KybSnapshot = {
  kycStatus: string;
  kycMethod: string | null;
  kycLegalName: string | null;
  panMasked: string | null;
  udyamNumber: string | null;
  gstin: string | null;
  gstLegalName: string | null;
  gstStatus: string | null;
  verified: boolean;
  message: string;
};

type BusinessKybRow = {
  id: string;
  fullName: string | null;
  owner_name: string | null;
  businessName: string | null;
  displayName: string | null;
  kycStatus: string | null;
  panMasked: string | null;
  udyamNumber: string | null;
  gstin: string | null;
  gstLegalName: string | null;
  gstStatus: string | null;
  kycMethod: string | null;
  kycLegalName: string | null;
};

const KYB_COLUMNS =
  'id, fullName, owner_name, businessName, displayName, kycStatus, panMasked, udyamNumber, gstin, gstLegalName, gstStatus, kycMethod, kycLegalName';

function verifiedStatus(status: string | null | undefined): boolean {
  const value = (status || '').toLowerCase();
  return value === 'verified' || value === 'approved';
}

function namesOf(row: BusinessKybRow): string[] {
  return [row.fullName, row.owner_name, row.businessName, row.displayName].filter(
    (name): name is string => Boolean(name && name.trim()),
  );
}

function snapshotOf(row: BusinessKybRow, message: string): KybSnapshot {
  const verified = verifiedStatus(row.kycStatus);
  return {
    kycStatus: row.kycStatus || 'pending',
    kycMethod: row.kycMethod,
    kycLegalName: row.kycLegalName,
    panMasked: row.panMasked,
    udyamNumber: row.udyamNumber,
    gstin: row.gstin,
    gstLegalName: row.gstLegalName,
    gstStatus: row.gstStatus,
    verified,
    message,
  };
}

function storageError(message: string): string | null {
  if (/schema cache|could not find|column .* does not exist/i.test(message)) {
    return 'Business verification storage is not set up yet. Run supabase/business_kyb.sql in the FinderB database.';
  }
  return null;
}

function panNameAccepted(result: CashfreePanResult, candidates: string[]): boolean {
  const kind = (result.name_match_result || '').toUpperCase();
  if (kind === 'DIRECT_MATCH' || kind === 'GOOD_PARTIAL_MATCH') return true;
  const score = Number(result.name_match_score);
  if (Number.isFinite(score) && score >= 80) return true;
  return anyNameMatches(result.registered_name || '', candidates);
}

async function loadRow(businessId: string): Promise<BusinessKybRow> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Business verification is unavailable right now.');
  const { data, error } = await supabase.from('Business').select(KYB_COLUMNS).eq('id', businessId).maybeSingle();
  if (error) {
    const friendly = storageError(error.message || '');
    throw new Error(friendly || 'Could not load this business.');
  }
  if (!data) throw new Error('Business not found.');
  return data as BusinessKybRow;
}

async function saveRow(businessId: string, patch: Record<string, unknown>): Promise<BusinessKybRow> {
  const supabase = createServiceClient();
  if (!supabase) throw new Error('Business verification is unavailable right now.');
  const { data, error } = await supabase
    .from('Business')
    .update({ ...patch, updatedAt: new Date().toISOString() })
    .eq('id', businessId)
    .select(KYB_COLUMNS)
    .single();
  if (error || !data) {
    const friendly = storageError(error?.message || '');
    throw new Error(friendly || 'Could not save the verification result.');
  }
  revalidatePath('/business');
  revalidatePath(`/business/kyc/${businessId}`);
  return data as BusinessKybRow;
}

function verificationId(businessId: string): string {
  return `fb${businessId.replace(/[^a-zA-Z0-9]/g, '').slice(0, 12)}${Date.now().toString(36)}`.slice(0, 50);
}

export async function verifyBusinessKyb(
  businessId: string,
  method: KybMethod,
  rawValue: string,
): Promise<{ success: true } & KybSnapshot | { success: false; error: string }> {
  try {
    const actor = await resolveBusinessActor(businessId);
    if (!actor.ok) return { success: false, error: actor.error };
    if (!actor.isOwner) return { success: false, error: 'Only the business owner can verify this listing.' };

    const limit = enforceRateLimitForKey(`kyb:${businessId}`, 'kyb');
    if (!limit.allowed) {
      return {
        success: false,
        error: `Too many verification attempts. Please try again in ${limit.retryAfterSec} seconds.`,
      };
    }

    const row = await loadRow(businessId);
    const candidates = namesOf(row);
    if (!candidates.length) {
      return { success: false, error: 'Add the owner name and business name before verifying.' };
    }

    if (method === 'pan') return await verifyPan(row, rawValue, candidates);
    if (method === 'udyam') return await verifyUdyam(row, rawValue, candidates);
    return await attachGstin(row, rawValue, candidates);
  } catch (error) {
    if (error instanceof CashfreeKybError) return { success: false, error: error.message };
    const message = error instanceof Error ? error.message : 'Verification failed.';
    return { success: false, error: message };
  }
}

async function verifyPan(
  row: BusinessKybRow,
  rawValue: string,
  candidates: string[],
): Promise<{ success: true } & KybSnapshot | { success: false; error: string }> {
  const pan = normalizePan(rawValue);
  if (!pan) return { success: false, error: 'Enter a valid PAN, for example ABCDE1234F.' };
  const masked = maskPan(pan);
  if (verifiedStatus(row.kycStatus) && row.panMasked === masked) {
    return {
      success: true,
      ...snapshotOf(row, 'This PAN is already verified for the listing.'),
    };
  }

  const providedName = cashfreePersonName(row.fullName || row.owner_name || row.businessName || '');
  const result = await cashfreeVerify<CashfreePanResult>('/pan', { pan, name: providedName });
  const registered = (result.registered_name || '').trim();
  const panValid = result.valid === true && (result.pan_status || 'VALID').toUpperCase() === 'VALID';
  const matched = panValid && panNameAccepted(result, candidates);
  if (!matched) {
    if (!verifiedStatus(row.kycStatus)) {
      await saveRow(row.id, { kycStatus: 'rejected' });
    }
    return {
      success: false,
      error: panValid
        ? `This PAN is valid${registered ? ` for ${registered}` : ''}, but that name does not match the owner or business on FinderB.`
        : 'This PAN could not be verified. Check the number and try again.',
    };
  }

  const saved = await saveRow(row.id, {
    kycStatus: 'verified',
    kycMethod: 'pan',
    kycLegalName: registered || providedName,
    kycVerifiedAt: new Date().toISOString(),
    kycReferenceId: result.reference_id != null ? String(result.reference_id) : null,
    panMasked: masked,
    isFinderBVerified: true,
  });
  return {
    success: true,
    ...snapshotOf(saved, `Verified with PAN as ${saved.kycLegalName}. The FinderB tick is now on.`),
  };
}

async function verifyUdyam(
  row: BusinessKybRow,
  rawValue: string,
  candidates: string[],
): Promise<{ success: true } & KybSnapshot | { success: false; error: string }> {
  const udyam = normalizeUdyam(rawValue);
  if (!udyam) return { success: false, error: 'Enter a Udyam number like UDYAM-UP-43-1234567.' };
  if (verifiedStatus(row.kycStatus) && (row.udyamNumber || '').toUpperCase() === udyam) {
    return { success: true, ...snapshotOf(row, 'This Udyam registration is already verified for the listing.') };
  }

  const result = await cashfreeVerify<CashfreeUdyamResult>('/udyam', {
    verification_id: verificationId(row.id),
    udyam,
  });
  const status = (result.status || '').toUpperCase();
  const enterprise = (result.enterprise_name || '').trim();
  if (status === 'UDYAM_IS_CANCELLED') {
    return { success: false, error: 'This Udyam registration is cancelled, so it cannot verify the listing.' };
  }
  if (status !== 'SUCCESS' || !enterprise) {
    if (!verifiedStatus(row.kycStatus)) await saveRow(row.id, { kycStatus: 'rejected' });
    return { success: false, error: 'This Udyam number could not be found. Check it and try again.' };
  }
  const matched = candidates.some((name) => businessNamesMatch(enterprise, name));
  if (!matched) {
    if (!verifiedStatus(row.kycStatus)) await saveRow(row.id, { kycStatus: 'rejected' });
    return {
      success: false,
      error: `This Udyam number is active for ${enterprise}, but that name does not match the business on FinderB.`,
    };
  }

  const saved = await saveRow(row.id, {
    kycStatus: 'verified',
    kycMethod: 'udyam',
    kycLegalName: enterprise,
    kycVerifiedAt: new Date().toISOString(),
    kycReferenceId: result.reference_id != null ? String(result.reference_id) : null,
    udyamNumber: result.udyam_number || udyam,
    isFinderBVerified: true,
  });
  return {
    success: true,
    ...snapshotOf(saved, `Verified with Udyam as ${saved.kycLegalName}. The FinderB tick is now on.`),
  };
}

async function attachGstin(
  row: BusinessKybRow,
  rawValue: string,
  candidates: string[],
): Promise<{ success: true } & KybSnapshot | { success: false; error: string }> {
  const gstin = normalizeGstin(rawValue);
  if (!gstin) return { success: false, error: 'Enter a valid 15-character GSTIN.' };
  if ((row.gstin || '').toUpperCase() === gstin && (row.gstStatus || '').toLowerCase() === 'active') {
    return { success: true, ...snapshotOf(row, 'This GSTIN is already saved on the listing.') };
  }

  const result = await cashfreeVerify<CashfreeGstinResult>('/gstin', {
    GSTIN: gstin,
    business_name: cashfreePersonName(row.businessName || row.displayName || ''),
  });
  const legal = (result.legal_name_of_business || '').trim();
  const trade = (result.trade_name_of_business || '').trim();
  const active = (result.gst_in_status || '').toLowerCase() === 'active';
  if (!active) {
    return { success: false, error: 'This GSTIN is not active, so it was not saved.' };
  }
  const matched = anyNameMatches(legal, candidates) || anyNameMatches(trade, candidates);
  if (!matched) {
    const shown = trade || legal || 'another business';
    return {
      success: false,
      error: `This GSTIN is active for ${shown}, but that name does not match the listing.`,
    };
  }

  const saved = await saveRow(row.id, {
    gstin,
    gstLegalName: legal || trade,
    gstStatus: 'Active',
  });
  const extra = verifiedStatus(saved.kycStatus)
    ? 'GSTIN saved on the verified listing.'
    : 'GSTIN saved. The verified tick still needs a matching PAN or Udyam registration.';
  return { success: true, ...snapshotOf(saved, extra) };
}

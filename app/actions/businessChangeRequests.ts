'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

import {
  CATEGORY_CHANGE_FIELD,
  LEGAL_BUSINESS_NAME_FIELD,
  type BusinessChangeRequest,
  type BusinessChangeRequestField,
} from '@/lib/businessChangeRequest';
import { assertBusinessSession } from '@/lib/security/session';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';

async function loadCurrentValue(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
  field: BusinessChangeRequestField,
) {
  const column = field === CATEGORY_CHANGE_FIELD ? 'category' : 'businessName';
  const { data, error } = await supabase
    .from('Business')
    .select(column)
    .eq('id', businessId)
    .maybeSingle();

  if (error || !data) return null;
  return String((data as Record<string, unknown>)[column] || '').trim();
}

export async function getPendingChangeRequest(businessId: string, field: BusinessChangeRequestField) {
  try {
    if (!businessId) {
      return { success: false as const, error: 'Business ID is required' };
    }

    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createClient(await cookies());
    const { data, error } = await supabase
      .from('business_change_requests')
      .select('*')
      .eq('business_id', businessId)
      .eq('field', field)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return {
      success: true as const,
      request: (data as BusinessChangeRequest | null) ?? null,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not load change request';
    console.error('Get Pending Change Request Error:', error);
    return { success: false as const, error: msg };
  }
}

export async function getPendingCategoryChangeRequest(businessId: string) {
  return getPendingChangeRequest(businessId, CATEGORY_CHANGE_FIELD);
}

export async function submitChangeRequest(params: {
  businessId: string;
  field: BusinessChangeRequestField;
  requestedValue: string;
  merchantNote?: string;
}) {
  try {
    const writeLimit = await enforceRateLimit('write', `change-request:${params.field}:${params.businessId}`);
    if (!writeLimit.ok) {
      return { success: false as const, error: writeLimit.error };
    }

    const businessId = params.businessId?.trim();
    const requestedValue = params.requestedValue?.trim();
    const merchantNote = params.merchantNote?.trim() || null;

    if (!businessId || !requestedValue) {
      return { success: false as const, error: 'Please provide the requested value.' };
    }

    const auth = await assertBusinessSession(businessId);
    if (!auth.ok) {
      return { success: false as const, error: auth.error };
    }

    const supabase = createClient(await cookies());
    const currentValue = await loadCurrentValue(supabase, businessId, params.field);

    if (!currentValue) {
      return { success: false as const, error: 'Current value is not set.' };
    }

    if (currentValue.toLowerCase() === requestedValue.toLowerCase()) {
      return {
        success: false as const,
        error: 'Choose a value that is different from your current one.',
      };
    }

    const { data: existing } = await supabase
      .from('business_change_requests')
      .select('id')
      .eq('business_id', businessId)
      .eq('field', params.field)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) {
      return {
        success: false as const,
        error: 'You already have a pending change request for this field. Wait for admin review.',
      };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('business_change_requests')
      .insert({
        business_id: businessId,
        field: params.field,
        current_value: currentValue,
        requested_value: requestedValue,
        status: 'pending',
        merchant_note: merchantNote,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      success: true as const,
      request: data as BusinessChangeRequest,
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Could not submit change request';
    console.error('Submit Change Request Error:', error);
    return { success: false as const, error: msg };
  }
}

export async function submitCategoryChangeRequest(params: {
  businessId: string;
  requestedCategory: string;
  merchantNote?: string;
}) {
  return submitChangeRequest({
    businessId: params.businessId,
    field: CATEGORY_CHANGE_FIELD,
    requestedValue: params.requestedCategory,
    merchantNote: params.merchantNote,
  });
}

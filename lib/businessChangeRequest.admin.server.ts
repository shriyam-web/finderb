import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import {
  CHANGE_REQUEST_BUSINESS_COLUMN,
  type BusinessChangeRequest,
  type BusinessChangeRequestField,
} from '@/lib/businessChangeRequest';

export type AdminChangeRequestRow = BusinessChangeRequest & {
  business_name: string;
  display_name: string | null;
  city: string | null;
  slug: string | null;
};

const FIELD_COLUMNS = CHANGE_REQUEST_BUSINESS_COLUMN;

function isChangeField(value: string): value is BusinessChangeRequestField {
  return value in FIELD_COLUMNS;
}

export async function listAdminChangeRequests(status = 'pending') {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  let query = supabase
    .from('business_change_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[admin change requests]', error);
    return { success: false as const, error: 'Could not load change requests.' };
  }

  const rows = (data || []) as BusinessChangeRequest[];
  const businessIds = [...new Set(rows.map((row) => row.business_id).filter(Boolean))];
  const businesses = new Map<
    string,
    { businessName?: string; displayName?: string; city?: string | null; slug?: string | null }
  >();
  if (businessIds.length) {
    const { data: bizRows } = await supabase
      .from('Business')
      .select('id, businessName, displayName, city, slug')
      .in('id', businessIds);
    for (const row of bizRows || []) {
      businesses.set(String(row.id), row);
    }
  }

  return {
    success: true as const,
    rows: rows.map((row) => {
      const business = businesses.get(row.business_id);
      return {
        ...row,
        business_name: business?.businessName || 'Business',
        display_name: business?.displayName || null,
        city: business?.city || null,
        slug: business?.slug || null,
      } satisfies AdminChangeRequestRow;
    }),
  };
}

export async function moderateChangeRequest(input: {
  requestId: string;
  action: 'approve' | 'reject';
  adminId?: string;
  adminNote?: string;
}) {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Database is not available.' };

  const requestId = input.requestId.trim();
  if (!requestId) return { success: false as const, error: 'Missing request.' };

  const { data: request, error: loadError } = await supabase
    .from('business_change_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle();
  if (loadError || !request) {
    return { success: false as const, error: 'Change request not found.' };
  }
  if (request.status !== 'pending') {
    return { success: false as const, error: 'This request has already been reviewed.' };
  }
  if (!isChangeField(String(request.field))) {
    return { success: false as const, error: 'Unknown change request field.' };
  }

  const now = new Date().toISOString();
  const adminNote = input.adminNote?.trim() || null;

  if (input.action === 'approve') {
    const column = FIELD_COLUMNS[request.field as BusinessChangeRequestField];
    const { error: updateError } = await supabase
      .from('Business')
      .update({
        [column]: String(request.requested_value || '').trim(),
        updatedAt: now,
      })
      .eq('id', request.business_id);
    if (updateError) {
      console.error('[approve change request]', updateError);
      return { success: false as const, error: 'Could not apply this change.' };
    }
  }

  const patch: Record<string, unknown> = {
    status: input.action === 'approve' ? 'approved' : 'rejected',
    admin_note: adminNote,
    reviewed_at: now,
    updated_at: now,
  };
  if (input.adminId) patch.reviewed_by = input.adminId;

  const { error: reviewError } = await supabase
    .from('business_change_requests')
    .update(patch)
    .eq('id', requestId);
  if (reviewError) {
    const { reviewed_by: _ignored, ...withoutReviewer } = patch;
    const { error: retryError } = await supabase
      .from('business_change_requests')
      .update(withoutReviewer)
      .eq('id', requestId);
    if (retryError) {
      console.error('[review change request]', retryError);
      return { success: false as const, error: 'The listing was updated but the request status could not be saved.' };
    }
  }

  return { success: true as const };
}

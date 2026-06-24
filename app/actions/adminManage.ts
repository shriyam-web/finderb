'use server';

import { revalidatePath } from 'next/cache';
import { createServiceClient } from '@/lib/supabase/service';
import { auditAdminMutation, requireAdminMutation } from '@/lib/admin/auditContext.server';
import {
  getAdminResourceConfig,
  type AdminResourceKey,
} from '@/lib/admin/resources';
import { assertAdminSession } from '@/lib/security/session';
import { getAdminSession } from '@/app/actions/admin';
import { isControllerAdmin } from '@/lib/admin/roles';

const PAGE_SIZE = 25;

function revalidateAdminResource(resource: AdminResourceKey) {
  revalidatePath('/admin/manage');
  revalidatePath(`/admin/manage/${resource}`);
  revalidatePath('/admin/audit-logs');
}

function displayLabel(row: Record<string, unknown>, titleField: string, subtitleField?: string) {
  const title = String(row[titleField] ?? 'Record');
  const subtitle = subtitleField ? row[subtitleField] : null;
  return subtitle ? `${title} (${String(subtitle)})` : title;
}

export async function getAdminPermissions() {
  const session = await getAdminSession();
  if (!session) {
    return { success: false as const, error: 'Unauthorized' };
  }

  const isController = isControllerAdmin(session.role, session.email);
  return {
    success: true as const,
    isController,
    email: session.email,
    role: session.role,
    allowedTabs: Array.isArray(session.allowed_tabs) ? session.allowed_tabs : [],
  };
}

export async function adminListResource(
  resourceKey: string,
  filters: { page?: number; search?: string } = {}
) {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return { success: false as const, error: auth.error };
  }

  const config = getAdminResourceConfig(resourceKey);
  if (!config) {
    return { success: false as const, error: 'Unknown resource' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  const search = filters.search?.trim();

  let query = supabase
    .from(config.table)
    .select('*', { count: 'exact' })
    .order(config.orderColumn, { ascending: false })
    .range(from, to);

  if (search) {
    const searchColumn = config.subtitleField ?? config.titleField;
    query = query.or(`${config.titleField}.ilike.%${search}%,${searchColumn}.ilike.%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) {
    console.error(`[admin] list ${resourceKey} failed:`, error);
    return { success: false as const, error: `Could not load ${config.label.toLowerCase()}` };
  }

  const total = count ?? 0;
  return {
    success: true as const,
    resource: config,
    rows: (data ?? []) as Record<string, unknown>[],
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  };
}

export async function adminCreateResource(resourceKey: string, payload: Record<string, unknown>) {
  const gate = await requireAdminMutation();
  if (!gate.ok) {
    return { success: false as const, error: gate.error };
  }

  const config = getAdminResourceConfig(resourceKey);
  if (!config) {
    return { success: false as const, error: 'Unknown resource' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const { data, error } = await supabase.from(config.table).insert(payload).select('*').single();
  if (error) {
    console.error(`[admin] create ${resourceKey} failed:`, error);
    return { success: false as const, error: error.message || 'Create failed' };
  }

  const row = data as Record<string, unknown>;
  const label = displayLabel(row, config.titleField, config.subtitleField);

  await auditAdminMutation(gate.session, {
    action: 'create',
    resourceType: config.resourceType,
    resourceId: String(row.id),
    summary: `Created ${config.label.toLowerCase().slice(0, -1)}: ${label}`,
    metadata: { fields: Object.keys(payload) },
  });

  revalidateAdminResource(config.key);
  return { success: true as const, row };
}

export async function adminUpdateResource(
  resourceKey: string,
  id: string,
  payload: Record<string, unknown>
) {
  const gate = await requireAdminMutation();
  if (!gate.ok) {
    return { success: false as const, error: gate.error };
  }

  const config = getAdminResourceConfig(resourceKey);
  if (!config || !id) {
    return { success: false as const, error: 'Unknown resource or missing id' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const { data: before } = await supabase.from(config.table).select('*').eq('id', id).maybeSingle();

  const { data, error } = await supabase
    .from(config.table)
    .update(payload)
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error(`[admin] update ${resourceKey} failed:`, error);
    return { success: false as const, error: error.message || 'Update failed' };
  }

  const row = data as Record<string, unknown>;
  const label = displayLabel(row, config.titleField, config.subtitleField);

  await auditAdminMutation(gate.session, {
    action: 'update',
    resourceType: config.resourceType,
    resourceId: id,
    summary: `Updated ${config.label.toLowerCase().slice(0, -1)}: ${label}`,
    metadata: { changedFields: Object.keys(payload), previous: before ?? null },
  });

  revalidateAdminResource(config.key);
  return { success: true as const, row };
}

export async function adminDeleteResource(resourceKey: string, id: string) {
  const gate = await requireAdminMutation();
  if (!gate.ok) {
    return { success: false as const, error: gate.error };
  }

  const config = getAdminResourceConfig(resourceKey);
  if (!config || !id) {
    return { success: false as const, error: 'Unknown resource or missing id' };
  }

  const supabase = createServiceClient();
  if (!supabase) {
    return { success: false as const, error: 'Admin service is not configured' };
  }

  const { data: before, error: fetchError } = await supabase
    .from(config.table)
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (fetchError || !before) {
    return { success: false as const, error: 'Record not found' };
  }

  const row = before as Record<string, unknown>;
  const label = displayLabel(row, config.titleField, config.subtitleField);

  const { error } = await supabase.from(config.table).delete().eq('id', id);
  if (error) {
    console.error(`[admin] delete ${resourceKey} failed:`, error);
    return { success: false as const, error: error.message || 'Delete failed' };
  }

  await auditAdminMutation(gate.session, {
    action: 'delete',
    resourceType: config.resourceType,
    resourceId: id,
    summary: `Deleted ${config.label.toLowerCase().slice(0, -1)}: ${label}`,
    metadata: { deleted: row },
  });

  revalidateAdminResource(config.key);
  return { success: true as const };
}

export async function adminDeleteResourceBatch(resourceKey: string, ids: string[]) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  if (!uniqueIds.length) {
    return { success: false as const, error: 'No records selected' };
  }

  let deleted = 0;
  for (const id of uniqueIds) {
    const result = await adminDeleteResource(resourceKey, id);
    if (result.success) deleted += 1;
  }

  return { success: true as const, deleted, total: uniqueIds.length };
}

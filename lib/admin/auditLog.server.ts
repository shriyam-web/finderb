import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { getAdminRequestMeta } from '@/lib/admin/loginLogs.server';

export type AdminAuditAction = 'create' | 'update' | 'delete';

export type RecordAdminAuditLogInput = {
  adminId: string;
  adminEmail: string;
  adminRole: string;
  action: AdminAuditAction;
  resourceType: string;
  resourceId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
};

/**
 * Call after a successful admin-panel mutation (create / update / delete).
 * Example:
 *   await recordAdminAuditLog({
 *     adminId: auth.adminId,
 *     adminEmail: session.email,
 *     adminRole: session.role,
 *     action: 'update',
 *     resourceType: 'merchant',
 *     resourceId: businessId,
 *     summary: `Disabled merchant ${businessName}`,
 *     metadata: { previousStatus: 'Active', nextStatus: 'Disabled' },
 *   });
 */
export async function recordAdminAuditLog(input: RecordAdminAuditLogInput) {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { ip, userAgent } = await getAdminRequestMeta();

  const { error } = await supabase.from('admin_audit_logs').insert({
    admin_id: input.adminId,
    admin_email: input.adminEmail.toLowerCase().trim(),
    admin_role: input.adminRole,
    action: input.action,
    resource_type: input.resourceType,
    resource_id: input.resourceId ?? null,
    summary: input.summary,
    metadata: input.metadata ?? null,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error('[admin] failed to record audit log:', error);
  }
}

import 'server-only';

import { cookies } from 'next/headers';
import { createClient } from '@/utils/supabase/server';
import { recordAdminAuditLog, type AdminAuditAction } from '@/lib/admin/auditLog.server';
import { assertAdminSession, getSessionAdminId } from '@/lib/security/session';

type AdminSession = {
  id: string;
  email: string;
  role: string;
};

async function getAdminSessionForAudit(): Promise<AdminSession | null> {
  const adminId = await getSessionAdminId();
  if (!adminId) return null;

  const supabase = createClient(await cookies());
  const { data, error } = await supabase
    .from('admins')
    .select('id, email, role')
    .eq('id', adminId)
    .maybeSingle();

  if (error || !data) return null;
  return {
    id: String(data.id),
    email: String(data.email),
    role: String(data.role ?? 'admin'),
  };
}

export async function requireAdminMutation() {
  const auth = await assertAdminSession();
  if (!auth.ok) {
    return { ok: false as const, error: auth.error };
  }

  const session = await getAdminSessionForAudit();
  if (!session) {
    return { ok: false as const, error: 'Unauthorized' };
  }

  return { ok: true as const, auth, session };
}

export async function auditAdminMutation(
  session: AdminSession,
  input: {
    action: AdminAuditAction;
    resourceType: string;
    resourceId?: string | null;
    summary: string;
    metadata?: Record<string, unknown> | null;
  }
) {
  await recordAdminAuditLog({
    adminId: session.id,
    adminEmail: session.email,
    adminRole: session.role,
    action: input.action,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    summary: input.summary,
    metadata: input.metadata,
  });
}

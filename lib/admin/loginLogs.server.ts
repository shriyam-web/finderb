import 'server-only';

import { headers } from 'next/headers';
import { createServiceClient } from '@/lib/supabase/service';

export async function getAdminRequestMeta() {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() || headerList.get('x-real-ip') || null;
  const userAgent = headerList.get('user-agent') || null;
  return { ip, userAgent };
}

export async function recordAdminLoginLog(params: {
  adminId: string;
  email: string;
  success: boolean;
}) {
  const supabase = createServiceClient();
  if (!supabase) return;

  const { ip, userAgent } = await getAdminRequestMeta();

  const { error } = await supabase.from('admin_login_logs').insert({
    admin_id: params.adminId,
    email: params.email.toLowerCase().trim(),
    success: params.success,
    ip_address: ip,
    user_agent: userAgent,
  });

  if (error) {
    console.error('[admin] failed to record login log:', error);
  }
}

import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';

const REASON_MIN = 8;
const REASON_MAX = 1000;

type ReportRow = {
  id: string;
  business_id: string;
  business_name: string;
  business_slug: string | null;
  business_city: string | null;
  reporter_user_id: string;
  reporter_name: string | null;
  reporter_email: string | null;
  reason: string;
  created_at: string;
};

export async function submitBusinessReport(input: {
  businessId: string;
  reason: string;
  userId: string;
}) {
  const businessId = input.businessId.trim();
  const reason = input.reason.trim();
  const userId = input.userId.trim();
  if (!businessId) return { success: false as const, error: 'Choose a business to report.' };
  if (!userId) return { success: false as const, error: 'Sign in to report this business.' };
  if (reason.length < REASON_MIN) {
    return { success: false as const, error: 'Write a short reason for this report.' };
  }

  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not send this report.' };

  const { data: business, error: businessError } = await supabase
    .from('Business')
    .select('id, businessName, displayName, slug, city, status')
    .eq('id', businessId)
    .maybeSingle();
  if (businessError || !business || business.status !== 'Active') {
    return { success: false as const, error: 'This business is not listed right now.' };
  }

  const { data: reporter } = await supabase
    .from('User')
    .select('id, fullName, email')
    .eq('id', userId)
    .maybeSingle();
  if (!reporter) return { success: false as const, error: 'Sign in to report this business.' };

  const businessName = String(business.displayName || business.businessName || 'Business').trim();
  const { error } = await supabase.from('business_reports').insert({
    business_id: business.id,
    business_name: businessName,
    business_slug: business.slug || null,
    business_city: business.city || null,
    reporter_user_id: reporter.id,
    reporter_name: String(reporter.fullName || '').trim() || null,
    reporter_email: String(reporter.email || '').trim() || null,
    reason: reason.slice(0, REASON_MAX),
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false as const, error: 'You already reported this business.' };
    }
    return {
      success: false as const,
      error: 'Could not send this report. Run supabase/business_reports.sql if this is the first time.',
    };
  }

  return { success: true as const };
}

export async function listBusinessReports() {
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not load reports.', rows: [] };
  const { data, error } = await supabase
    .from('business_reports')
    .select(
      'id, business_id, business_name, business_slug, business_city, reporter_user_id, reporter_name, reporter_email, reason, created_at'
    )
    .order('created_at', { ascending: false })
    .limit(300);
  if (error) return { success: false as const, error: 'Could not load reports.', rows: [] };

  const rows = (data || []) as ReportRow[];
  const counts = new Map<string, number>();
  for (const row of rows) {
    counts.set(row.business_id, (counts.get(row.business_id) || 0) + 1);
  }

  return {
    success: true as const,
    rows: rows.map((row) => ({
      id: row.id,
      businessId: row.business_id,
      businessName: row.business_name,
      businessSlug: row.business_slug,
      businessCity: row.business_city,
      reporterName: row.reporter_name || 'User',
      reporterEmail: row.reporter_email || '',
      reason: row.reason,
      createdAt: row.created_at,
      reportCount: counts.get(row.business_id) || 1,
    })),
  };
}

export async function deleteBusinessReport(reportId: string) {
  const id = reportId.trim();
  if (!id) return { success: false as const, error: 'Choose a report.' };
  const supabase = createServiceClient();
  if (!supabase) return { success: false as const, error: 'Could not remove this report.' };
  const { data, error } = await supabase
    .from('business_reports')
    .delete()
    .eq('id', id)
    .select('id');
  if (error) return { success: false as const, error: 'Could not remove this report.' };
  if (!data?.length) return { success: false as const, error: 'Report not found.' };
  return { success: true as const };
}

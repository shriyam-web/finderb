import { loadBadgeReports, loadMonthLeaderRows } from '@/lib/businessBadgeState';
import { activePublicBadges, type PublicBadge } from '@/lib/businessBadges';
import { averageLeadResponseMs, formatResponseDuration } from '@/lib/leadRead';
import { getPublicSupabase } from '@/lib/supabase/public';

export type PublicBusinessSignals = {
  bestInCategory: boolean;
  averageResponse: string | null;
  badges: PublicBadge[];
};

function completionSource(business: Record<string, unknown>): Record<string, unknown> {
  return {
    ...business,
    ownerName: business.ownerName || business.owner_name,
    ownerMobile: business.ownerMobile || business.owner_mobile,
  };
}

export async function loadPublicBusinessSignals(
  business: Record<string, unknown>,
): Promise<PublicBusinessSignals> {
  const empty: PublicBusinessSignals = { bestInCategory: false, averageResponse: null, badges: [] };
  const businessId = String(business.id || '').trim();
  if (!businessId) return empty;

  let averageResponseMs: number | null = null;
  let leads: { created_at?: string | null; merchant_read_at?: string | null }[] = [];

  try {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('created_at, merchant_read_at')
      .eq('business_id', businessId);
    if (!error && data) {
      leads = data;
      averageResponseMs = averageLeadResponseMs(data);
    }
  } catch {
    averageResponseMs = null;
  }

  let badges: PublicBadge[] = [];
  let bestInCategory = false;
  try {
    const reports = await loadBadgeReports(completionSource(business), { leads });
    bestInCategory = reports.some((badge) => badge.id === 'bestInCategory' && badge.active);
    badges = activePublicBadges(reports).filter((badge) => badge.id !== 'bestInCategory');
  } catch {
    badges = [];
  }

  return {
    bestInCategory,
    averageResponse: averageResponseMs == null ? null : formatResponseDuration(averageResponseMs),
    badges,
  };
}

const LIST_LIMIT = 40;

export async function loadPublicSignalsForIds(
  ids: string[],
): Promise<Record<string, PublicBusinessSignals>> {
  const unique = [...new Set(ids.map((id) => id.trim()).filter(Boolean))].slice(0, LIST_LIMIT);
  const out: Record<string, PublicBusinessSignals> = {};
  if (!unique.length) return out;

  const supabase = getPublicSupabase();
  const { data: rows, error } = await supabase.from('Business').select('*').in('id', unique);
  if (error || !rows?.length) return out;

  const active = rows.filter((row) => String(row.status || '').toLowerCase() === 'active');
  const leadsById = new Map<string, { created_at?: string | null; merchant_read_at?: string | null }[]>();
  let from = 0;
  for (let hop = 0; hop < 8; hop += 1) {
    const { data, error: leadError } = await supabase
      .from('leads')
      .select('business_id, created_at, merchant_read_at')
      .in('business_id', unique)
      .range(from, from + 999);
    if (leadError || !data?.length) break;
    for (const lead of data) {
      const id = String((lead as { business_id?: string }).business_id || '');
      if (!id) continue;
      const list = leadsById.get(id) || [];
      list.push(lead);
      leadsById.set(id, list);
    }
    if (data.length < 1000) break;
    from += 1000;
  }

  const groups = new Map<string, { category: string; city: string }>();
  for (const row of active) {
    const category = String(row.category || '').trim();
    const city = String(row.city || '').trim();
    if (!category || !city) continue;
    groups.set(`${category}\n${city}`, { category, city });
  }

  const boards = new Map<string, Awaited<ReturnType<typeof loadMonthLeaderRows>>>();
  await Promise.all(
    [...groups.entries()].map(async ([key, group]) => {
      try {
        boards.set(key, await loadMonthLeaderRows(group.category, group.city));
      } catch {
        boards.set(key, []);
      }
    }),
  );

  await Promise.all(
    active.map(async (row) => {
      const id = String(row.id || '');
      if (!id) return;
      const category = String(row.category || '').trim();
      const city = String(row.city || '').trim();
      const board = boards.get(`${category}\n${city}`) || [];
      let monthViews = 0;
      let monthLeads = 0;
      let topViews = 0;
      let topLeads = 0;
      for (const item of board) {
        if (item.views > topViews) topViews = item.views;
        if (item.leads > topLeads) topLeads = item.leads;
        if (item.business_id === id) {
          monthViews = item.views;
          monthLeads = item.leads;
        }
      }
      const leads = leadsById.get(id) || [];
      try {
        const reports = await loadBadgeReports(completionSource(row as Record<string, unknown>), {
          leads,
          rank: { monthViews, monthLeads, topViews, topLeads },
        });
        const averageMs = averageLeadResponseMs(leads);
        out[id] = {
          bestInCategory: reports.some((badge) => badge.id === 'bestInCategory' && badge.active),
          averageResponse: averageMs == null ? null : formatResponseDuration(averageMs),
          badges: activePublicBadges(reports).filter((badge) => badge.id !== 'bestInCategory'),
        };
      } catch {
        out[id] = { bestInCategory: false, averageResponse: null, badges: [] };
      }
    }),
  );

  return out;
}

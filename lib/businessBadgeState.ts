import 'server-only';

import { getProfileCompletion } from '@/lib/dashboard/profileCompletion';
import { getBusinessPublicRatingStats } from '@/lib/businessReviews';
import {
  activePublicBadges,
  buildBadgeReports,
  listingLiveInstant,
  parseBadgeOverrides,
  startOfMonthIstIso,
  type BadgeReport,
  type PublicBadge,
} from '@/lib/businessBadges';
import { averageLeadResponseMs } from '@/lib/leadRead';
import { getPublicSupabase } from '@/lib/supabase/public';

type LeadSample = { created_at?: string | null; merchant_read_at?: string | null };

type MonthRank = {
  monthViews: number;
  monthLeads: number;
  topViews: number;
  topLeads: number;
};

const EMPTY_RANK: MonthRank = { monthViews: 0, monthLeads: 0, topViews: 0, topLeads: 0 };

function text(value: unknown): string {
  return String(value || '').trim();
}

function repliedSamples(leads: LeadSample[]): { count: number; averageMs: number | null } {
  const averageMs = averageLeadResponseMs(leads);
  const count = leads.filter((lead) => {
    if (!lead.created_at || !lead.merchant_read_at) return false;
    const created = Date.parse(lead.created_at);
    const read = Date.parse(lead.merchant_read_at);
    return Number.isFinite(created) && Number.isFinite(read) && read >= created;
  }).length;
  return { count, averageMs };
}

async function rankThisMonth(
  businessId: string,
  category: string,
  city: string,
): Promise<MonthRank> {
  if (!category || !city) return EMPTY_RANK;
  const supabase = getPublicSupabase();
  const since = startOfMonthIstIso();

  const { data: rpcRows, error: rpcError } = await supabase.rpc('badge_month_leaders', {
    p_city: city,
    p_category: category,
    p_since: since,
  });

  if (!rpcError && Array.isArray(rpcRows)) {
    return rankFromRows(
      businessId,
      rpcRows as Array<{ business_id?: string; views?: number; leads?: number }>,
    );
  }

  const { data: peers, error: peerError } = await supabase
    .from('Business')
    .select('id')
    .ilike('status', 'active')
    .ilike('city', city)
    .ilike('category', category)
    .limit(200);
  if (peerError || !peers?.length) return EMPTY_RANK;

  const ids = peers.map((row) => String(row.id));
  if (!ids.includes(businessId)) ids.push(businessId);
  const views = await countByBusiness('profile_views', 'viewed_at', ids, since);
  const leads = await countByBusiness('leads', 'created_at', ids, since);
  return rankFromRows(
    businessId,
    ids.map((id) => ({ business_id: id, views: views.get(id) || 0, leads: leads.get(id) || 0 })),
  );
}

function rankFromRows(
  businessId: string,
  rows: Array<{ business_id?: string; views?: number; leads?: number }>,
): MonthRank {
  let monthViews = 0;
  let monthLeads = 0;
  let topViews = 0;
  let topLeads = 0;
  for (const row of rows) {
    const views = Number(row.views) || 0;
    const leads = Number(row.leads) || 0;
    if (views > topViews) topViews = views;
    if (leads > topLeads) topLeads = leads;
    if (String(row.business_id || '') === businessId) {
      monthViews = views;
      monthLeads = leads;
    }
  }
  return { monthViews, monthLeads, topViews, topLeads };
}

async function countByBusiness(
  table: 'profile_views' | 'leads',
  timeColumn: 'viewed_at' | 'created_at',
  ids: string[],
  since: string,
): Promise<Map<string, number>> {
  const totals = new Map<string, number>();
  const supabase = getPublicSupabase();
  let from = 0;
  const page = 1000;
  for (let hop = 0; hop < 20; hop += 1) {
    const { data, error } = await supabase
      .from(table)
      .select('business_id')
      .in('business_id', ids)
      .gte(timeColumn, since)
      .range(from, from + page - 1);
    if (error || !data?.length) break;
    for (const row of data) {
      const id = String((row as { business_id?: string }).business_id || '');
      if (!id) continue;
      totals.set(id, (totals.get(id) || 0) + 1);
    }
    if (data.length < page) break;
    from += page;
  }
  return totals;
}

async function badgeSource(business: Record<string, unknown>): Promise<Record<string, unknown>> {
  const businessId = text(business.id);
  if (!businessId) return business;
  if ('badgeOverrides' in business || 'listingLiveAt' in business) return business;
  const supabase = getPublicSupabase();
  const columns = 'id, category, city, status, createdAt, listingLiveAt, badgeOverrides, review';
  const { data, error } = await supabase.from('Business').select(columns).eq('id', businessId).maybeSingle();
  if (!error && data) return { ...business, ...data };
  if (error && /listingLiveAt|badgeOverrides/i.test(error.message || '')) {
    const basic = await supabase
      .from('Business')
      .select('id, category, city, status, createdAt, review')
      .eq('id', businessId)
      .maybeSingle();
    if (!basic.error && basic.data) return { ...business, ...basic.data };
  }
  return business;
}

export async function loadBadgeReports(
  business: Record<string, unknown>,
  known?: { leads?: LeadSample[] },
): Promise<BadgeReport[]> {
  const completionPercent = getProfileCompletion({
    ...business,
    ownerName: business.ownerName || business.owner_name,
    ownerMobile: business.ownerMobile || business.owner_mobile,
  }).percentage;
  business = await badgeSource(business);
  const businessId = text(business.id);
  const category = text(business.category);
  const city = text(business.city);
  const { rating, reviewCount } = getBusinessPublicRatingStats(business.review);

  let leads = known?.leads;
  if (!leads && businessId) {
    try {
      const supabase = getPublicSupabase();
      const { data, error } = await supabase
        .from('leads')
        .select('created_at, merchant_read_at')
        .eq('business_id', businessId);
      leads = error || !data ? [] : data;
    } catch {
      leads = [];
    }
  }

  const reply = repliedSamples(leads || []);
  let rank = EMPTY_RANK;
  try {
    if (businessId) rank = await rankThisMonth(businessId, category, city);
  } catch {
    rank = EMPTY_RANK;
  }

  return buildBadgeReports({
    repliedCount: reply.count,
    averageResponseMs: reply.averageMs,
    rating,
    reviewCount,
    ...rank,
    category,
    city,
    liveAt: listingLiveInstant(business),
    completionPercent,
    overrides: parseBadgeOverrides(business.badgeOverrides),
  });
}

export async function loadPublicBadges(
  business: Record<string, unknown>,
  known?: { leads?: LeadSample[] },
): Promise<PublicBadge[]> {
  const reports = await loadBadgeReports(business, known);
  return activePublicBadges(reports);
}

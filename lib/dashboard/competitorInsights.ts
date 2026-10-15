import type { SupabaseClient } from '@supabase/supabase-js';
import { getProfileCompletion } from '@/lib/dashboard/profileCompletion';
import { escapeIlikePattern } from '@/lib/searchMatch';

export const COMPETITOR_COMPLETION_SELECT =
  'id, businessName, displayName, category, publicPhone, owner_name, owner_mobile, businessAddress, city, state, country, about, profilePictureUrl, images, timings, yearsInBusiness, website, facebookUrl, instagramUrl, youtubeUrl, whatsappNumber, latitude, longitude, paymentModes, keywords';

export function averageCompletionPercent(rows: Record<string, unknown>[]): number | null {
  if (!rows.length) return null;
  const percents = rows.map(
    (row) =>
      getProfileCompletion({
        ...row,
        ownerName: row.ownerName || row.owner_name,
        ownerMobile: row.ownerMobile || row.owner_mobile,
      }).percentage,
  );
  return Math.round(percents.reduce((sum, value) => sum + value, 0) / percents.length);
}

export function competitorCategoryNeedles(category: string): string[] {
  const raw = String(category || '').trim();
  if (!raw) return [];
  const leaf = raw.split(/\s*[›>/|]\s*/).pop()?.trim() || raw;
  const needles = [raw];
  if (leaf && leaf.toLowerCase() !== raw.toLowerCase()) needles.push(leaf);
  return needles;
}

/** Other live listings in the same category (exact, then a looser leaf match). */
export async function loadCompetitorAverageFromClient(
  supabase: SupabaseClient | null,
  businessId: string,
  category: string,
): Promise<number | null> {
  if (!supabase || !category.trim() || !businessId) return null;

  const needles = competitorCategoryNeedles(category);
  const seen = new Set<string>();
  const rows: Record<string, unknown>[] = [];

  const take = (data: Record<string, unknown>[] | null | undefined) => {
    for (const row of data || []) {
      const id = String(row.id || '');
      if (!id || id === businessId || seen.has(id)) continue;
      seen.add(id);
      rows.push(row);
    }
  };

  const { data: exact } = await supabase
    .from('Business')
    .select(COMPETITOR_COMPLETION_SELECT)
    .eq('category', needles[0])
    .neq('id', businessId)
    .in('status', ['Active', 'active'])
    .limit(200);
  take(exact as Record<string, unknown>[]);

  if (rows.length < 8) {
    for (const needle of needles) {
      const { data } = await supabase
        .from('Business')
        .select(COMPETITOR_COMPLETION_SELECT)
        .ilike('category', `%${escapeIlikePattern(needle)}%`)
        .neq('id', businessId)
        .in('status', ['Active', 'active'])
        .limit(200);
      take(data as Record<string, unknown>[]);
      if (rows.length >= 40) break;
    }
  }

  return averageCompletionPercent(rows);
}

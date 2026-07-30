import { isSupabaseConfigured, supabase } from './supabase';
import { mapMerchantRow, merchantHasPublicPhoto, rankMerchants, type Merchant } from './merchants';

export async function fetchFeaturedMerchants(limit = 12): Promise<{
  merchants: Merchant[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return {
      merchants: [],
      error: 'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_* to mobile/.env',
    };
  }

  const { data, error } = await supabase
    .from('Business')
    .select(
      'id, slug, businessName, displayName, category, location, city, about, profilePictureUrl, images, publicPhone, mobile, review, isFinderBVerified, hasVerifiedBadge, discountRange, status',
    )
    .eq('status', 'Active')
    .or('isFinderBVerified.eq.true,hasVerifiedBadge.eq.true')
    .limit(60);

  if (error) {
    return { merchants: [], error: error.message };
  }

  const mapped = (data ?? []).map((row) =>
    mapMerchantRow(row as Record<string, unknown>),
  );
  return { merchants: rankMerchants(mapped).slice(0, limit) };
}

export async function fetchMerchantBySlugOrId(slugOrId: string): Promise<{
  merchant: Merchant | null;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { merchant: null, error: 'Supabase is not configured' };
  }

  const key = slugOrId.trim();
  if (!key) return { merchant: null, error: 'Missing merchant id' };

  const selectCols =
    'id, slug, businessName, displayName, category, location, city, about, profilePictureUrl, images, publicPhone, mobile, review, isFinderBVerified, hasVerifiedBadge, discountRange, status, businessAddress, website, timings';

  // Prefer slug first (canonical).
  const bySlug = await supabase
    .from('Business')
    .select(selectCols)
    .eq('slug', key)
    .eq('status', 'Active')
    .maybeSingle();

  if (bySlug.data) {
    const merchant = mapMerchantRow(bySlug.data as Record<string, unknown>);
    if (!merchantHasPublicPhoto(merchant)) {
      return { merchant: null, error: 'Merchant not found' };
    }
    return { merchant };
  }

  const byId = await supabase
    .from('Business')
    .select(selectCols)
    .eq('id', key)
    .eq('status', 'Active')
    .maybeSingle();

  if (byId.data) {
    const merchant = mapMerchantRow(byId.data as Record<string, unknown>);
    if (!merchantHasPublicPhoto(merchant)) {
      return { merchant: null, error: 'Merchant not found' };
    }
    return { merchant };
  }

  return {
    merchant: null,
    error: bySlug.error?.message || byId.error?.message || 'Merchant not found',
  };
}

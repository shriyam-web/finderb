import 'server-only';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

function dbClient() {
  return createServiceClient();
}

function asIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((id) => String(id || '').trim()).filter(Boolean))];
}

export async function getFavoriteIdsForUser(userId: string): Promise<string[]> {
  const supabase = dbClient() ?? createClient(await cookies());
  const { data } = await supabase
    .from('User')
    .select('favorites')
    .eq('id', userId)
    .maybeSingle();
  return asIdList(data?.favorites);
}

export async function toggleFavoriteForUser(
  userId: string,
  businessId: string
): Promise<
  | { success: true; saved: boolean; favoriteIds: string[] }
  | { success: false; error: string }
> {
  const id = businessId.trim();
  if (!id) {
    return { success: false, error: 'Business ID is required.' };
  }

  const supabase = dbClient() ?? createClient(await cookies());
  const { data: business } = await supabase
    .from('Business')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (!business) {
    return { success: false, error: 'Business not found.' };
  }

  const current = await getFavoriteIdsForUser(userId);
  const saved = current.includes(id);
  const next = saved ? current.filter((item) => item !== id) : [id, ...current].slice(0, 200);

  const { error } = await supabase
    .from('User')
    .update({ favorites: next, updatedAt: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('[favorites] update failed', error);
    return { success: false, error: 'Could not update favourites.' };
  }

  return { success: true, saved: !saved, favoriteIds: next };
}

import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSupabaseConfigured, supabase } from './supabase';

export type DestinationRating = {
  placeId: string;
  rating: number;
  vibes: string[];
  note: string;
  updatedAt: string;
};

export type DestinationEngagement = {
  averageRating: number;
  ratingCount: number;
  userRating: number | null;
  userVibes: string[];
  userNote: string;
};

const LOCAL_PREFIX = '@finderb/destination-rating:';

function localKey(placeId: string, userId: string) {
  return `${LOCAL_PREFIX}${placeId}:${userId}`;
}

export const DESTINATION_VIBES = [
  { id: 'scenic', label: 'Scenic', emoji: '🌄' },
  { id: 'peaceful', label: 'Peaceful', emoji: '🌿' },
  { id: 'family', label: 'Family-friendly', emoji: '👨‍👩‍👧' },
  { id: 'hidden', label: 'Hidden gem', emoji: '💎' },
  { id: 'crowded', label: 'Crowded', emoji: '👥' },
  { id: 'worth', label: 'Worth the trip', emoji: '✨' },
  { id: 'photo', label: 'Photo spots', emoji: '📷' },
  { id: 'food', label: 'Great food nearby', emoji: '🍲' },
] as const;

export async function fetchDestinationEngagement(
  placeId: string,
  userId?: string | null,
): Promise<DestinationEngagement> {
  let userRating: number | null = null;
  let userVibes: string[] = [];
  let userNote = '';

  if (userId) {
    try {
      const raw = await AsyncStorage.getItem(localKey(placeId, userId));
      if (raw) {
        const parsed = JSON.parse(raw) as DestinationRating;
        userRating = parsed.rating || null;
        userVibes = Array.isArray(parsed.vibes) ? parsed.vibes : [];
        userNote = parsed.note || '';
      }
    } catch {
      /* ignore */
    }
  }

  if (!isSupabaseConfigured || !supabase) {
    return {
      averageRating: userRating || 0,
      ratingCount: userRating ? 1 : 0,
      userRating,
      userVibes,
      userNote,
    };
  }

  const { data, error } = await supabase
    .from('tourist_place_ratings')
    .select('rating, user_key, vibes, note')
    .eq('place_id', placeId);

  if (error || !data) {
    return {
      averageRating: userRating || 0,
      ratingCount: userRating ? 1 : 0,
      userRating,
      userVibes,
      userNote,
    };
  }

  const ratings = data
    .map((row) => Number(row.rating))
    .filter((n) => Number.isFinite(n) && n > 0);
  const avg = ratings.length
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : userRating || 0;

  if (userId) {
    const mine = data.find((row) => row.user_key === userId);
    if (mine) {
      userRating = Number(mine.rating) || userRating;
      userVibes = Array.isArray(mine.vibes)
        ? (mine.vibes as string[])
        : typeof mine.vibes === 'string'
          ? (() => {
              try {
                return JSON.parse(mine.vibes as string) as string[];
              } catch {
                return userVibes;
              }
            })()
          : userVibes;
      userNote = typeof mine.note === 'string' ? mine.note : userNote;
    }
  }

  return {
    averageRating: avg,
    ratingCount: ratings.length,
    userRating,
    userVibes,
    userNote,
  };
}

export async function submitDestinationRating(input: {
  placeId: string;
  userId: string;
  rating: number;
  vibes: string[];
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const payload: DestinationRating = {
    placeId: input.placeId,
    rating,
    vibes: input.vibes,
    note: (input.note || '').trim(),
    updatedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(
    localKey(input.placeId, input.userId),
    JSON.stringify(payload),
  );

  if (!isSupabaseConfigured || !supabase) {
    return { ok: true };
  }

  const { error } = await supabase.from('tourist_place_ratings').upsert(
    {
      place_id: input.placeId,
      user_key: input.userId,
      rating,
      vibes: input.vibes,
      note: payload.note || null,
      updated_at: payload.updatedAt,
    },
    { onConflict: 'place_id,user_key' },
  );

  if (error) {
    return { ok: true };
  }
  return { ok: true };
}

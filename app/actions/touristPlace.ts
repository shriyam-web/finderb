'use server';

import { getPublicSupabase } from '@/lib/supabase/public';
import { geocodePlaceQuery } from '@/app/actions/location';
import { distanceKmFromUser, type TouristPlaceLike } from '@/lib/touristPlaceSort';
import { formatDistanceFromUser } from '@/lib/geo';
import { mapTouristPlaceRow, type TouristPlaceTravelPartner } from '@/lib/touristPlaceImage';
import { isLegacyTouristPlaceId } from '@/lib/touristPlaceSlug';
import { ensureTouristPlaceSlug } from '@/lib/touristPlaceSlug.server';

const geocodeCache = new Map<string, { lat: number; lng: number } | null>();

async function coordsForLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const key = location.trim().toLowerCase();
  if (geocodeCache.has(key)) {
    return geocodeCache.get(key) ?? null;
  }

  const query = key.includes('india') ? location.trim() : `${location.trim()}, India`;
  const result = await geocodePlaceQuery(query);
  const coords = result ? { lat: result.latitude, lng: result.longitude } : null;
  geocodeCache.set(key, coords);
  return coords;
}

export async function getTouristPlaces() {
  try {
    const supabase = getPublicSupabase();

    const { data: places, error } = await supabase
      .from('tourist_places')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const mappedPlaces = (places ?? []).map(mapTouristPlaceRow);

    return { success: true, touristPlaces: mappedPlaces };
  } catch (error: any) {
    console.error('Get Tourist Places Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function sortTouristPlacesByUserCoords<T extends TouristPlaceLike>(
  places: T[],
  userLat: number,
  userLng: number
) {
  try {
    if (!places.length) {
      return { success: true, touristPlaces: [] as T[] };
    }

    const user = { lat: userLat, lng: userLng };
    const uniqueLocations = [...new Set(places.map((p) => p.location.trim()).filter(Boolean))];

    await Promise.all(uniqueLocations.map((loc) => coordsForLocation(loc)));

    const enriched = await Promise.all(
      places.map(async (place) => {
        const coords = await coordsForLocation(place.location);
        if (!coords) {
          return { ...place, distanceKm: Number.POSITIVE_INFINITY };
        }

        const distanceKm = distanceKmFromUser(user, coords);
        const distance =
          formatDistanceFromUser(user, coords.lat, coords.lng) ?? place.distance ?? 'Nearby';

        return { ...place, distance, distanceKm };
      })
    );

    enriched.sort((a, b) => a.distanceKm - b.distanceKm);

    const touristPlaces = enriched.map(({ distanceKm: _distanceKm, ...place }) => place);

    return { success: true, touristPlaces };
  } catch (error: any) {
    console.error('Sort Tourist Places Error:', error);
    return { success: false, error: error.message || 'Failed to sort places' };
  }
}

export async function getTouristPlaceBySlugOrId(slugOrId: string) {
  try {
    if (!slugOrId?.trim()) {
      return { success: false, error: 'Tourist place identifier is required' };
    }

    const identifier = slugOrId.trim();
    const supabase = getPublicSupabase();

    const { data: bySlug, error: slugError } = await supabase
      .from('tourist_places')
      .select('*')
      .eq('slug', identifier)
      .maybeSingle();

    if (slugError) throw slugError;

    let place = bySlug;

    if (!place && isLegacyTouristPlaceId(identifier)) {
      const { data: byId, error: idError } = await supabase
        .from('tourist_places')
        .select('*')
        .eq('id', identifier)
        .maybeSingle();

      if (idError) throw idError;
      place = byId;
    }

    if (!place) {
      return { success: false, error: 'Tourist place not found' };
    }

    const slug = await ensureTouristPlaceSlug(place);
    const touristPlace = mapTouristPlaceRow({ ...place, slug });
    const partners = await fetchTravelPartnersForPlace(supabase, place.id);

    return { success: true, touristPlace, travelPartners: partners };
  } catch (error: any) {
    console.error('Get Tourist Place Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

async function fetchTravelPartnersForPlace(
  supabase: ReturnType<typeof getPublicSupabase>,
  placeId: string
): Promise<TouristPlaceTravelPartner[]> {
  try {
    const { data: tags, error: tagError } = await supabase
      .from('tourist_place_merchants')
      .select('business_id, note, sort_order')
      .eq('tourist_place_id', placeId)
      .order('sort_order', { ascending: true });

    if (tagError || !tags?.length) {
      if (tagError && !tagError.message.includes('does not exist')) {
        console.error('[touristPlace] partners fetch failed:', tagError.message);
      }
      return [];
    }

    const businessIds = tags.map((t) => String(t.business_id));
    const { data: businesses, error: bizError } = await supabase
      .from('Business')
      .select(
        'id, businessName, category, city, slug, profilePictureUrl, rating, status, images'
      )
      .in('id', businessIds)
      .eq('status', 'Active');

    if (bizError || !businesses?.length) {
      if (bizError) console.error('[touristPlace] partner businesses failed:', bizError.message);
      return [];
    }

    const byId = new Map(businesses.map((b) => [String(b.id), b]));
    const noteById = new Map(tags.map((t) => [String(t.business_id), t.note as string | null]));

    return businessIds
      .map((id) => {
        const row = byId.get(id);
        if (!row) return null;
        return {
          id: String(row.id),
          businessName: String(row.businessName || 'Travel partner'),
          category: String(row.category || 'Tour & Travels'),
          city: (row.city as string | null) ?? null,
          slug: (row.slug as string | null) ?? null,
          profilePictureUrl: (row.profilePictureUrl as string | null) ?? null,
          rating: row.rating != null ? Number(row.rating) : null,
          note: noteById.get(id) ?? null,
        } satisfies TouristPlaceTravelPartner;
      })
      .filter((p): p is TouristPlaceTravelPartner => p !== null);
  } catch (error) {
    console.error('[touristPlace] partners unexpected error:', error);
    return [];
  }
}

/** Public helper if callers only need partners for an already-loaded place. */
export async function getTouristPlaceTravelPartners(placeId: string) {
  try {
    if (!placeId) return { success: true as const, travelPartners: [] as TouristPlaceTravelPartner[] };
    const supabase = getPublicSupabase();
    const travelPartners = await fetchTravelPartnersForPlace(supabase, placeId);
    return { success: true as const, travelPartners };
  } catch (error: any) {
    return { success: false as const, error: error.message || 'Failed to load travel partners' };
  }
}

/** @deprecated Use getTouristPlaceBySlugOrId */
export async function getTouristPlace(id: string) {
  return getTouristPlaceBySlugOrId(id);
}

export async function getNearbyTouristPlaces(
  currentId: string,
  userLat?: number | null,
  userLng?: number | null,
  limit = 3
) {
  try {
    const supabase = getPublicSupabase();

    const { data: places, error } = await supabase
      .from('tourist_places')
      .select('*')
      .neq('id', currentId);

    if (error) {
      throw error;
    }

    let mapped = (places ?? []).map(mapTouristPlaceRow);

    if (userLat != null && userLng != null && mapped.length > 0) {
      const sorted = await sortTouristPlacesByUserCoords(mapped, userLat, userLng);
      if (sorted.success && sorted.touristPlaces) {
        mapped = sorted.touristPlaces;
      }
    }

    return {
      success: true,
      touristPlaces: mapped.slice(0, limit),
    };
  } catch (error: any) {
    console.error('Get Nearby Tourist Places Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

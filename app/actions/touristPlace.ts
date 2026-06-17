'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { geocodePlaceQuery } from '@/app/actions/location';
import { distanceKmFromUser, type TouristPlaceLike } from '@/lib/touristPlaceSort';
import { formatDistanceFromUser } from '@/lib/geo';
import { mapTouristPlaceRow } from '@/lib/touristPlaceImage';

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
    const supabase = createClient(await cookies());

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

export async function getTouristPlace(id: string) {
  try {
    const supabase = createClient(await cookies());

    const { data: place, error } = await supabase
      .from('tourist_places')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    return { success: true, touristPlace: mapTouristPlaceRow(place) };
  } catch (error: any) {
    console.error('Get Tourist Place Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

export async function getNearbyTouristPlaces(
  currentId: string,
  userLat?: number | null,
  userLng?: number | null,
  limit = 3
) {
  try {
    const supabase = createClient(await cookies());

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

import { safeUserError } from './safeError';
import { SITE_URL, isSupabaseConfigured, supabase } from './supabase';
import { formatDistanceFromUser, getDistanceKm, type Coords } from './geo';
import { geocodePlaceQuery } from './geocodePlace';

const FALLBACK_IMAGE = '';

export type TouristPlace = {
  id: string;
  slug: string | null;
  name: string;
  location: string;
  description: string | null;
  category: string | null;
  image: string;
  rating: number;
  /** Display label e.g. "2.4 km", "Near Agra" */
  distanceLabel?: string | null;
  /** Sort key — lower is closer */
  proximityScore?: number;
  latitude?: number | null;
  longitude?: number | null;
  bestTime?: string | null;
  visitDuration?: string | null;
  entryFee?: string | null;
  howToReach?: string | null;
  highlights?: string | null;
  tips?: string | null;
};

export type TouristLocationContext = {
  city?: string | null;
  state?: string | null;
  coords?: Coords | null;
};

function resolveImageUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return FALLBACK_IMAGE;
  const value = raw.trim();

  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (value.startsWith('http://')) {
      return `https://${value.slice('http://'.length)}`;
    }
    return value;
  }

  const supabaseBase = (process.env.EXPO_PUBLIC_SUPABASE_URL || '').replace(
    /\/$/,
    '',
  );
  if (!supabaseBase) return FALLBACK_IMAGE;

  if (value.startsWith('/storage/')) return `${supabaseBase}${value}`;
  if (value.startsWith('storage/')) return `${supabaseBase}/${value}`;

  if (value.includes('/object/public/')) {
    return value.startsWith('/')
      ? `${supabaseBase}${value}`
      : `${supabaseBase}/${value}`;
  }

  const cleaned = value
    .replace(/^\/+/, '')
    .split('/')
    .map((part) => {
      try {
        return encodeURIComponent(decodeURIComponent(part));
      } catch {
        return encodeURIComponent(part);
      }
    })
    .join('/');
  return `${supabaseBase}/storage/v1/object/public/${cleaned}`;
}

function slugify(name: string, location?: string | null): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  if (!base) return 'place';
  const loc = (location || '').split(',')[0]?.trim() || '';
  const locPart = loc
    ? loc
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    : '';
  if (!locPart || base.includes(locPart)) return base.slice(0, 96);
  return `${base}-${locPart}`.slice(0, 96);
}

export function resolveTouristPlaceSlug(place: TouristPlace): string {
  const persisted = place.slug?.trim();
  if (persisted) return persisted;
  return slugify(place.name, place.location);
}

export function touristPlaceWebPath(place: TouristPlace): string {
  return `${SITE_URL}/tourist-places/${resolveTouristPlaceSlug(place)}`;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function locationParts(location: string): string[] {
  return location
    .split(/[,|]/)
    .map((part) => normalize(part))
    .filter(Boolean);
}

/** Lower score = closer to the user (city / state text match). */
export function scorePlaceProximity(
  placeLocation: string,
  ctx: TouristLocationContext,
): number {
  const parts = locationParts(placeLocation);
  const haystack = normalize(placeLocation);
  const city = ctx.city ? normalize(ctx.city) : null;
  const state = ctx.state ? normalize(ctx.state) : null;

  if (city && parts.some((p) => p === city || p.includes(city) || city.includes(p))) {
    return 0;
  }
  if (city && haystack.includes(city)) {
    return 1;
  }
  if (state && parts.some((p) => p === state || p.includes(state))) {
    return 2;
  }
  if (state && haystack.includes(state)) {
    return 3;
  }
  return 50;
}

function distanceLabelForScore(
  score: number,
  ctx: TouristLocationContext,
): string | null {
  if (score === 0 || score === 1) {
    return ctx.city ? `Near ${ctx.city}` : 'Near you';
  }
  if (score === 2 || score === 3) {
    return ctx.state ? `In ${ctx.state}` : 'Nearby';
  }
  return null;
}

function mapRow(row: Record<string, unknown>): TouristPlace {
  const lat =
    typeof row.latitude === 'number'
      ? row.latitude
      : typeof row.lat === 'number'
        ? row.lat
        : null;
  const lng =
    typeof row.longitude === 'number'
      ? row.longitude
      : typeof row.lng === 'number'
        ? row.lng
        : null;

  return {
    id: String(row.id),
    slug: (row.slug as string | null) ?? null,
    name: String(row.name || '').trim() || 'Place',
    location: String(row.location || '').trim() || 'India',
    description: (row.description as string | null) || null,
    category: (row.category as string | null) || null,
    image: resolveImageUrl(
      (row.image_url as string | null) ?? (row.image as string | null),
    ),
    rating:
      typeof row.rating === 'number' && Number.isFinite(row.rating)
        ? row.rating
        : 4.8,
    latitude: lat,
    longitude: lng,
    bestTime: (row.best_time as string | null) || null,
    visitDuration: (row.visit_duration as string | null) || null,
    entryFee: (row.entry_fee as string | null) || null,
    howToReach: (row.how_to_reach as string | null) || null,
    highlights: (row.highlights as string | null) || null,
    tips: (row.tips as string | null) || null,
  };
}

const TOURIST_SELECT =
  'id, name, location, description, category, image_url, slug, created_at, best_time, visit_duration, entry_fee, how_to_reach, highlights, tips';

export function splitTouristLines(raw?: string | null): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/\r?\n|•|●|;|\|(?=\s)/)
    .map((line) => line.replace(/^[-–—*\d.)\s]+/, '').trim())
    .filter(Boolean);
}

export function sortTouristPlacesByDistance<T extends TouristPlace>(
  places: T[],
  ctx: TouristLocationContext,
): T[] {
  if (!ctx.city && !ctx.state && !ctx.coords) return places;

  return [...places]
    .map((place) => {
      const proximityScore = scorePlaceProximity(place.location, ctx);
      return {
        ...place,
        proximityScore,
        distanceLabel:
          place.distanceLabel || distanceLabelForScore(proximityScore, ctx),
      };
    })
    .sort((a, b) => (a.proximityScore ?? 50) - (b.proximityScore ?? 50));
}

async function enrichWithGeoDistance<T extends TouristPlace>(
  places: T[],
  user: Coords,
): Promise<T[]> {
  const unique = [...new Set(places.map((p) => p.location.trim()).filter(Boolean))];
  const coordMap = new Map<string, Coords | null>();

  await Promise.all(
    unique.map(async (loc) => {
      const coords = await geocodePlaceQuery(loc);
      coordMap.set(loc, coords);
    }),
  );

  return [...places]
    .map((place) => {
      const fromRow =
        place.latitude != null &&
        place.longitude != null &&
        !(place.latitude === 0 && place.longitude === 0)
          ? { lat: place.latitude, lng: place.longitude }
          : null;
      const coords = fromRow || coordMap.get(place.location.trim()) || null;
      if (!coords) {
        return {
          ...place,
          proximityScore: 50,
          distanceLabel: place.distanceLabel ?? null,
        };
      }
      const km = getDistanceKm(user.lat, user.lng, coords.lat, coords.lng);
      return {
        ...place,
        latitude: coords.lat,
        longitude: coords.lng,
        proximityScore: km,
        distanceLabel: formatDistanceFromUser(user, coords.lat, coords.lng),
      };
    })
    .sort((a, b) => (a.proximityScore ?? 1e9) - (b.proximityScore ?? 1e9));
}

export async function fetchTouristPlaces(
  limit = 8,
  locationCtx?: TouristLocationContext,
): Promise<{
  places: TouristPlace[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { places: [], error: 'Supabase is not configured.' };
  }

  try {
    let { data, error } = await supabase
      .from('tourist_places')
      .select(TOURIST_SELECT)
      .order('created_at', { ascending: false })
      .limit(80);

    // Older DBs may not have the richer detail columns yet.
    if (error) {
      const fallback = await supabase
        .from('tourist_places')
        .select(
          'id, name, location, description, category, image_url, slug, created_at',
        )
        .order('created_at', { ascending: false })
        .limit(80);
      data = (fallback.data || null) as typeof data;
      error = fallback.error;
    }

    if (error) {
      return { places: [], error: safeUserError(error, 'Could not load destinations.') };
    }

    let places = (data || []).map((row) =>
      mapRow(row as Record<string, unknown>),
    );

    if (locationCtx?.coords) {
      places = await enrichWithGeoDistance(places, locationCtx.coords);
    } else if (locationCtx?.city || locationCtx?.state) {
      places = sortTouristPlacesByDistance(places, locationCtx);
    }

    return { places: places.slice(0, limit) };
  } catch (error) {
    return {
      places: [],
      error: safeUserError(error, 'Could not load destinations.'),
    };
  }
}

export async function fetchTouristPlaceBySlugOrId(slugOrId: string): Promise<{
  place: TouristPlace | null;
  nearby: TouristPlace[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { place: null, nearby: [], error: 'Supabase is not configured.' };
  }

  const key = slugOrId.trim();
  if (!key) return { place: null, nearby: [], error: 'Missing place id' };

  try {
    let row: Record<string, unknown> | null = null;

    const bySlug = await supabase
      .from('tourist_places')
      .select(TOURIST_SELECT)
      .eq('slug', key)
      .maybeSingle();

    if (bySlug.error) {
      const fallback = await supabase
        .from('tourist_places')
        .select(
          'id, name, location, description, category, image_url, slug, created_at',
        )
        .eq('slug', key)
        .maybeSingle();
      if (fallback.data) row = fallback.data as Record<string, unknown>;
    } else if (bySlug.data) {
      row = bySlug.data as Record<string, unknown>;
    }

    if (!row) {
      const byId = await supabase
        .from('tourist_places')
        .select(TOURIST_SELECT)
        .eq('id', key)
        .maybeSingle();

      if (byId.error) {
        const fallback = await supabase
          .from('tourist_places')
          .select(
            'id, name, location, description, category, image_url, slug, created_at',
          )
          .eq('id', key)
          .maybeSingle();
        if (fallback.data) row = fallback.data as Record<string, unknown>;
      } else if (byId.data) {
        row = byId.data as Record<string, unknown>;
      }
    }

    if (!row) {
      return { place: null, nearby: [], error: 'Destination not found' };
    }

    const place = mapRow(row);

    const nearbyRes = await supabase
      .from('tourist_places')
      .select(
        'id, name, location, description, category, image_url, slug, created_at',
      )
      .neq('id', place.id)
      .order('created_at', { ascending: false })
      .limit(6);

    const nearby = (nearbyRes.data || [])
      .map((item) => mapRow(item as Record<string, unknown>))
      .filter((item) => item.image)
      .slice(0, 4);

    return { place, nearby };
  } catch (error) {
    return {
      place: null,
      nearby: [],
      error:
        safeUserError(error, 'Could not load destination.'),
    };
  }
}

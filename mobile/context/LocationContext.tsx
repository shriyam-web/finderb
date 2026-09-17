import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { lookupCityCoords } from '../lib/cityCoords';
import { geocodePlaceQuery } from '../lib/geocodePlace';
import {
  clearStoredLocation,
  loadStoredLocation,
  saveStoredLocation,
  type StoredUserLocation,
} from '../lib/locationStorage';
import type { UserCoords } from '../hooks/useUserLocation';

export type LocationSource = 'gps' | 'manual' | 'none';

export type AppLocationState = {
  status: 'idle' | 'requesting' | 'detecting' | 'ready' | 'denied' | 'error';
  coords: UserCoords | null;
  /** Broader city e.g. Noida */
  city: string | null;
  /** Locality / sector / neighbourhood when available */
  area: string | null;
  region: string | null;
  label: string;
  shortLabel: string;
  source: LocationSource;
  error: string | null;
  /** Re-detect GPS (clears manual override). */
  refresh: () => Promise<void>;
  /** Keep current source; re-run GPS only if source is gps. */
  useDeviceLocation: () => Promise<void>;
  setManualLocation: (input: {
    city: string;
    region?: string | null;
  }) => Promise<void>;
};

const LocationContext = createContext<AppLocationState | null>(null);

function isGenericPlaceName(value: string): boolean {
  const v = value.trim().toLowerCase();
  return (
    !v ||
    v === 'unnamed road' ||
    v === 'unnamed' ||
    v === 'india' ||
    v.includes('plus code')
  );
}

/**
 * Prefer sector / locality / street for the chip; keep city for sorting context.
 */
function pickPlaceParts(place: Location.LocationGeocodedAddress): {
  area: string | null;
  city: string | null;
  region: string | null;
} {
  const city =
    place.city?.trim() ||
    place.subregion?.trim() ||
    place.district?.trim() ||
    null;
  const region = place.region?.trim() || place.country?.trim() || null;

  const candidates = [
    place.district,
    place.name,
    place.street,
    place.subregion,
  ]
    .map((v) => v?.trim() || '')
    .filter((v) => v && !isGenericPlaceName(v));

  const area =
    candidates.find((c) => {
      if (!city) return true;
      const cl = city.toLowerCase();
      const vl = c.toLowerCase();
      // Skip if it's just the city name again
      if (vl === cl) return false;
      return true;
    }) || null;

  return {
    area,
    city: city || area,
    region,
  };
}

function formatLabel(
  area: string | null,
  city: string | null,
  region: string | null,
): string {
  if (area && city && area.toLowerCase() !== city.toLowerCase()) {
    return `${area}, ${city}`;
  }
  if (city && region && !city.toLowerCase().includes(region.toLowerCase())) {
    return `${city}, ${region}`;
  }
  return area || city || region || 'Your area';
}

function shortFrom(
  area: string | null,
  city: string | null,
  region: string | null,
  fallback: string,
): string {
  return area || city || region || fallback;
}

export function LocationProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AppLocationState['status']>('idle');
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [area, setArea] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [source, setSource] = useState<LocationSource>('none');
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const requestId = useRef(0);
  const sourceRef = useRef<LocationSource>('none');

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  const persist = useCallback(async (next: StoredUserLocation) => {
    await saveStoredLocation(next);
  }, []);

  const applyReady = useCallback(
    async (input: {
      city: string | null;
      area?: string | null;
      region: string | null;
      coords: UserCoords | null;
      source: 'gps' | 'manual';
    }) => {
      setCity(input.city);
      setArea(input.area ?? null);
      setRegion(input.region);
      setCoords(input.coords);
      setSource(input.source);
      setStatus('ready');
      setError(null);
      await persist({
        source: input.source,
        city: input.city,
        area: input.area ?? null,
        region: input.region,
        coords: input.coords,
        updatedAt: Date.now(),
      });
    },
    [persist],
  );

  const detectGps = useCallback(async () => {
    const id = ++requestId.current;
    setStatus('requesting');
    setError(null);

    try {
      const current = await Location.getForegroundPermissionsAsync();
      let granted = current.granted;
      if (!granted) {
        const asked = await Location.requestForegroundPermissionsAsync();
        granted = asked.granted;
      }

      if (!granted) {
        if (id !== requestId.current) return;
        setStatus('denied');
        setError('Location permission denied');
        if (sourceRef.current !== 'manual') {
          setCoords(null);
          setCity(null);
          setArea(null);
          setRegion(null);
          setSource('none');
        }
        return;
      }

      if (id !== requestId.current) return;
      setStatus('detecting');

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (id !== requestId.current) return;

      const nextCoords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      const places = await Location.reverseGeocodeAsync({
        latitude: nextCoords.lat,
        longitude: nextCoords.lng,
      });
      if (id !== requestId.current) return;

      const picked = places[0]
        ? pickPlaceParts(places[0])
        : { area: null, city: null, region: null };
      await applyReady({
        city: picked.city,
        area: picked.area,
        region: picked.region,
        coords: nextCoords,
        source: 'gps',
      });
    } catch (err) {
      if (id !== requestId.current) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not detect location');
    }
  }, [applyReady]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadStoredLocation();
      if (cancelled) return;

      if (stored?.source === 'manual' && stored.city) {
        setCity(stored.city);
        setArea(stored.area ?? null);
        setRegion(stored.region);
        setCoords(stored.coords);
        setSource('manual');
        setStatus('ready');
        setHydrated(true);
        // Still prompt for location permission on first install / if missing,
        // so nearby features work when the user later switches to GPS.
        const perm = await Location.getForegroundPermissionsAsync();
        if (!cancelled && !perm.granted && perm.canAskAgain !== false) {
          await Location.requestForegroundPermissionsAsync();
        }
        return;
      }

      if (stored?.source === 'gps' && stored.coords) {
        setCity(stored.city);
        setArea(stored.area ?? null);
        setRegion(stored.region);
        setCoords(stored.coords);
        setSource('gps');
        setStatus('ready');
      }

      setHydrated(true);
      // Always (re)fetch GPS on open — core discovery depends on fresh location.
      await detectGps();
    })();

    return () => {
      cancelled = true;
    };
  }, [detectGps]);

  // Refetch GPS whenever the app returns to the foreground (unless manual city).
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next !== 'active') return;
      if (sourceRef.current === 'manual') return;
      void detectGps();
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [detectGps]);

  const setManualLocation = useCallback(
    async (input: { city: string; region?: string | null }) => {
      const cityName = input.city.trim();
      if (!cityName) return;

      setStatus('detecting');
      setError(null);

      const regionName = input.region?.trim() || null;
      let nextCoords =
        lookupCityCoords(cityName) ||
        (await geocodePlaceQuery(
          regionName ? `${cityName}, ${regionName}` : cityName,
        ));

      await applyReady({
        city: cityName,
        area: null,
        region: regionName,
        coords: nextCoords,
        source: 'manual',
      });
    },
    [applyReady],
  );

  const useDeviceLocation = useCallback(async () => {
    await clearStoredLocation();
    setSource('none');
    await detectGps();
  }, [detectGps]);

  const refresh = useCallback(async () => {
    if (sourceRef.current === 'manual') {
      // Keep manual city; just re-geocode in case coords were missing.
      if (city) {
        await setManualLocation({ city, region });
      }
      return;
    }
    await detectGps();
  }, [city, detectGps, region, setManualLocation]);

  const label =
    status === 'requesting' || status === 'detecting'
      ? 'Detecting…'
      : status === 'denied'
        ? 'Set location'
        : status === 'error'
          ? 'Tap to set'
          : formatLabel(area, city, region);

  const shortLabel =
    status === 'requesting' || status === 'detecting'
      ? 'Detecting…'
      : status === 'denied' || status === 'error' || (!area && !city && !region)
        ? 'Set location'
        : shortFrom(area, city, region, 'Set location');

  const value = useMemo<AppLocationState>(
    () => ({
      status: hydrated ? status : 'detecting',
      coords,
      city,
      area,
      region,
      label,
      shortLabel,
      source,
      error,
      refresh,
      useDeviceLocation,
      setManualLocation,
    }),
    [
      area,
      city,
      coords,
      error,
      hydrated,
      label,
      region,
      refresh,
      setManualLocation,
      shortLabel,
      source,
      status,
      useDeviceLocation,
    ],
  );

  return (
    <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
  );
}

export function useAppLocation(): AppLocationState {
  const ctx = useContext(LocationContext);
  if (!ctx) {
    throw new Error('useAppLocation must be used within LocationProvider');
  }
  return ctx;
}

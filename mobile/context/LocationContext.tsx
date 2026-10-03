import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';
import * as Location from 'expo-location';
import { lookupCityCoords, lookupCityCoordsExact } from '../lib/cityCoords';
import { fetchApproxLocation } from '../lib/approxLocation';
import { markLocationPermissionSettled, requestLocationPermission } from '../lib/permissionGate';
import { nearestKnownCity, networkPlaceName, type PlaceName } from '../lib/placeName';
import { setListingOrigin } from '../lib/api';
import { geocodePlaceQuery } from '../lib/geocodePlace';
import {
  clearStoredLocation,
  loadStoredLocation,
  saveStoredLocation,
  type StoredUserLocation,
} from '../lib/locationStorage';
import type { UserCoords } from '../hooks/useUserLocation';

/** `approx` is a network-based city used while device location is unavailable. */
export type LocationSource = 'gps' | 'manual' | 'approx' | 'none';

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

/**
 * System location dialogs pause the app; resuming must not re-trigger them,
 * or declining the dialog reopens it in a loop.
 */
const FOREGROUND_REFRESH_MIN_MS = 2 * 60 * 1000;

/** The OS-wide last fix shows nearby businesses instantly while a fresh fix loads. */
const LAST_KNOWN_MAX_AGE_MS = 30 * 60 * 1000;

/** Without any fix by then, rank by the network city until GPS answers. */
const APPROX_AFTER_MS = 6000;

/** One-shot reads can stall indefinitely on some Android phones; give up on each after this. */
const FIX_TIMEOUT_MS = 15000;

/** How long the backup position watch may wait for its first fix. */
const WATCH_MAX_MS = 60000;

/** Still detecting this long after an attempt started (with permission granted): start over. */
const STALL_RETRY_MS = 12000;
const STALL_MAX_RETRIES = 4;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

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

/**
 * The phone's geocoder often returns nothing, or only the city, on its first calls after a
 * fresh install; it is retried until it names the locality.
 */
const GEOCODE_RETRY_DELAYS_MS = [0, 1500, 3500, 6000, 10000];
const GEOCODE_TIMEOUT_MS = 6000;

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function devicePlaceName(coords: UserCoords): Promise<PlaceName | null> {
  if (Platform.OS === 'web') return null;
  const places = await withTimeout(
    Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng }),
    GEOCODE_TIMEOUT_MS,
  );
  const picked = places?.[0] ? pickPlaceParts(places[0]) : null;
  return picked && (picked.city || picked.area) ? picked : null;
}

/**
 * Aims for the locality, as the phone's geocoder names it once warmed up (what a refresh
 * shows). Web lookups run alongside; anything better than what is showing is passed to
 * `onBetter` right away, and the phone's locality ends the search.
 */
async function resolvePlaceName(
  coords: UserCoords,
  isStale: () => boolean,
  onBetter: (name: PlaceName) => void,
): Promise<PlaceName | null> {
  let best: PlaceName | null = null;
  let bestRank = 0;
  const offer = (name: PlaceName | null, rank: number) => {
    if (!name || rank <= bestRank || isStale()) return;
    best = name;
    bestRank = rank;
    onBetter(name);
  };

  let networkDone = false;
  const network = networkPlaceName(coords).then((name) => {
    networkDone = true;
    offer(name, name?.area ? 2 : 1);
  });

  for (const delay of GEOCODE_RETRY_DELAYS_MS) {
    if (delay) await sleep(delay);
    if (isStale()) return null;
    const fromDevice = await devicePlaceName(coords);
    if (fromDevice?.area) {
      offer(fromDevice, 3);
      return best;
    }
    offer(fromDevice, 1);
    if (Platform.OS === 'web' && networkDone) break;
  }
  await network;
  return isStale() ? null : best;
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
  const inFlightRef = useRef(false);
  const lastAttemptAtRef = useRef(0);
  const coordsRef = useRef<UserCoords | null>(null);
  coordsRef.current = coords;
  const namedRef = useRef(false);
  namedRef.current = Boolean(area || city);
  const areaRef = useRef<string | null>(null);
  areaRef.current = area;

  useEffect(() => {
    sourceRef.current = source;
  }, [source]);

  // Layout effect so listings re-ranked by screens' passive effects see the new origin.
  useLayoutEffect(() => {
    setListingOrigin(coords, city);
  }, [coords, city]);

  const persist = useCallback(async (next: StoredUserLocation) => {
    await saveStoredLocation(next);
  }, []);

  const applyReady = useCallback(
    async (input: {
      city: string | null;
      area?: string | null;
      region: string | null;
      coords: UserCoords | null;
      source: 'gps' | 'manual' | 'approx';
    }) => {
      setCity(input.city);
      setArea(input.area ?? null);
      setRegion(input.region);
      setCoords(input.coords);
      setSource(input.source);
      sourceRef.current = input.source;
      setStatus('ready');
      setError(null);
      // Manual and network-based locations are session-only.
      if (input.source !== 'gps') return;
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

  /** Network city when GPS has nothing yet; never replaces a real fix or a picked city. */
  const hasBetterLocation = useCallback(
    () => sourceRef.current === 'manual' || sourceRef.current === 'gps',
    [],
  );

  const applyApprox = useCallback(
    async (isStale: () => boolean) => {
      if (hasBetterLocation()) return false;
      const approx = await fetchApproxLocation();
      if (!approx || isStale() || hasBetterLocation()) return false;
      await applyReady({
        city: approx.city,
        area: null,
        region: null,
        coords: approx.coords,
        source: 'approx',
      });
      return true;
    },
    [applyReady, hasBetterLocation],
  );

  const detectGps = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    const id = ++requestId.current;
    let gotPosition = false;
    let approxTimer: ReturnType<typeof setTimeout> | null = null;
    let watchSub: Location.LocationSubscription | null = null;
    let watchStopTimer: ReturnType<typeof setTimeout> | null = null;
    let watchDone = false;
    const stopWatch = () => {
      watchDone = true;
      watchSub?.remove();
      watchSub = null;
      if (watchStopTimer) clearTimeout(watchStopTimer);
      watchStopTimer = null;
    };
    inFlightRef.current = true;
    lastAttemptAtRef.current = Date.now();
    if (!silent && !coordsRef.current) {
      setStatus('requesting');
      setError(null);
    }
    if (!silent) {
      approxTimer = setTimeout(() => {
        if (!gotPosition) void applyApprox(() => id !== requestId.current || gotPosition);
      }, APPROX_AFTER_MS);
    }

    try {
      const current = await withTimeout(Location.getForegroundPermissionsAsync(), 3000);
      let granted = current?.granted ?? false;
      if (!granted && silent) return;
      if (!granted) granted = await requestLocationPermission();

      if (!granted) {
        markLocationPermissionSettled();
        if (id !== requestId.current) return;
        if (sourceRef.current === 'manual') return;
        if (sourceRef.current === 'gps') {
          setSource('none');
          sourceRef.current = 'none';
        }
        if (await applyApprox(() => id !== requestId.current)) return;
        if (id !== requestId.current || hasBetterLocation()) return;
        setStatus('denied');
        setError('Location permission denied');
        setCoords(null);
        setCity(null);
        setArea(null);
        setRegion(null);
        setSource('none');
        return;
      }

      if (id !== requestId.current) return;
      if (!silent && !coordsRef.current) setStatus('detecting');

      if (Platform.OS === 'android' && !silent) {
        const servicesOn = (await withTimeout(Location.hasServicesEnabledAsync(), 3000)) ?? true;
        if (!servicesOn) {
          // System "Turn on location" dialog; declining falls through to the network city.
          await withTimeout(Location.enableNetworkProviderAsync(), 30000);
        }
        if (id !== requestId.current) return;
      }
      markLocationPermissionSettled();

      approxTimer ??= setTimeout(() => {
        if (!gotPosition) void applyApprox(() => id !== requestId.current || gotPosition);
      }, APPROX_AFTER_MS);

      let positionSeq = 0;
      const applyPosition = async (position: Location.LocationObject) => {
        const seq = ++positionSeq;
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        gotPosition = true;
        // Rank nearby businesses right away; the header names the place once a lookup answers.
        // The closest listed city is only a last resort: near city borders it can be wrong.
        const replaceName = !namedRef.current || sourceRef.current === 'approx';
        const guess = replaceName ? nearestKnownCity(nextCoords) : null;
        if (replaceName) {
          setCity(null);
          setArea(null);
          setRegion(null);
          namedRef.current = false;
        }
        setCoords(nextCoords);
        setSource('gps');
        sourceRef.current = 'gps';
        setStatus('ready');
        setError(null);

        const stale = () => id !== requestId.current || seq !== positionSeq;
        const picked = await resolvePlaceName(nextCoords, stale, (name) => {
          // A city-only answer must not hide a locality that is already showing.
          if (!name.area && areaRef.current && !replaceName) return;
          setCity(name.city);
          setArea(name.area);
          setRegion(name.region);
          namedRef.current = true;
        });
        if (stale()) return;
        const name = picked ?? guess;
        // Lookups failed or only found the city: keep the locality already showing.
        if (!name || (!name.area && areaRef.current && !replaceName)) return;
        await applyReady({
          city: name?.city ?? null,
          area: name?.area ?? null,
          region: name?.region ?? null,
          coords: nextCoords,
          source: 'gps',
        });
      };

      const lastKnown = await withTimeout(
        Location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }),
        3000,
      );
      if (id !== requestId.current) return;
      if (lastKnown) void applyPosition(lastKnown);

      // Right after a fresh grant a one-shot read can stall on some phones, so a watch
      // races it and whichever reports first wins.
      watchStopTimer = setTimeout(stopWatch, WATCH_MAX_MS);
      void Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, timeInterval: 2000, distanceInterval: 0 },
        (position) => {
          if (watchDone || id !== requestId.current) return;
          stopWatch();
          void applyPosition(position);
        },
      )
        .then((sub) => {
          if (watchDone) sub.remove();
          else watchSub = sub;
        })
        .catch(() => undefined);

      const fresh =
        (await withTimeout(
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
          FIX_TIMEOUT_MS,
        )) ??
        (gotPosition
          ? null
          : await withTimeout(
              Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }),
              FIX_TIMEOUT_MS,
            ));
      if (id !== requestId.current) return;
      if (fresh) {
        stopWatch();
        await applyPosition(fresh);
      } else if (!gotPosition) {
        throw new Error('Could not get a location fix');
      }
    } catch (err) {
      if (id !== requestId.current) return;
      if (silent || gotPosition) return;
      if (await applyApprox(() => id !== requestId.current || gotPosition)) return;
      if (id !== requestId.current || gotPosition || coordsRef.current) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not detect location');
    } finally {
      markLocationPermissionSettled();
      if (approxTimer) clearTimeout(approxTimer);
      if (id === requestId.current) inFlightRef.current = false;
    }
  }, [applyApprox, applyReady, hasBetterLocation]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await loadStoredLocation();
      if (cancelled) return;

      // Drop any previously persisted custom city — custom location must not
      // survive app close. Always start from GPS (optionally hydrate last GPS
      // briefly so UI isn't empty while detecting).
      if (stored?.source === 'manual') {
        await clearStoredLocation();
      } else if (stored?.source === 'gps' && stored.coords) {
        setCity(stored.city);
        setArea(stored.area ?? null);
        setRegion(stored.region);
        setCoords(stored.coords);
        setSource('gps');
        sourceRef.current = 'gps';
        setStatus('ready');
      }

      setHydrated(true);
      await detectGps();
    })();

    return () => {
      cancelled = true;
    };
  }, [detectGps]);

  // Refetch GPS when returning to foreground, but keep an in-session custom city.
  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next !== 'active') return;
      if (sourceRef.current === 'manual') return;
      if (inFlightRef.current) return;
      if (Date.now() - lastAttemptAtRef.current < FOREGROUND_REFRESH_MIN_MS) return;
      void detectGps({ silent: true });
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [detectGps]);

  // A first attempt that stalls right after install (dropped callbacks, paused location
  // client) is restarted the same way a pull-to-refresh would.
  const stalled = hydrated && (status === 'requesting' || status === 'detecting');
  useEffect(() => {
    if (!stalled) return;
    let retries = 0;
    let checking = false;
    const timer = setInterval(() => {
      if (retries >= STALL_MAX_RETRIES) {
        clearInterval(timer);
        return;
      }
      if (checking || sourceRef.current === 'manual') return;
      if (Date.now() - lastAttemptAtRef.current < STALL_RETRY_MS) return;
      checking = true;
      void withTimeout(Location.getForegroundPermissionsAsync(), 3000).then((perm) => {
        checking = false;
        // Not granted yet means the user is still answering the dialog.
        if (!perm?.granted) return;
        retries += 1;
        void detectGps();
      });
    }, 3000);
    return () => clearInterval(timer);
  }, [detectGps, stalled]);

  const setManualLocation = useCallback(
    async (input: { city: string; region?: string | null }) => {
      const cityName = input.city.trim();
      if (!cityName) return;

      setStatus('detecting');
      setError(null);

      const regionName = input.region?.trim() || null;
      // With a state we know the exact place, so partial name matches would mislead.
      let nextCoords =
        (regionName ? lookupCityCoordsExact(cityName) : lookupCityCoords(cityName)) ||
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
      : status === 'denied' || status === 'error'
        ? 'Set location'
        : !area && !city && !region
          ? coords
            ? 'Near you'
            : 'Set location'
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

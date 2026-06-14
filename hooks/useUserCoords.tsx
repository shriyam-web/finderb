'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { resolveCityFromCoordinates } from '@/app/actions/location';
import { geolocateViaGoogleIp } from '@/lib/geolocateClient';

export type UserCoords = { lat: number; lng: number };

export type LocationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

type UserLocationContextValue = {
  userCoords: UserCoords | null;
  userCity: string | null;
  userCityName: string | null;
  userState: string | null;
  searchLocation: string | null;
  effectiveSearchLocation: string | null;
  isLocating: boolean;
  isResolvingCity: boolean;
  permissionState: LocationPermissionState;
  requestLocation: () => void;
  setSearchLocation: (location: string | null) => void;
};

const UserLocationContext = createContext<UserLocationContextValue>({
  userCoords: null,
  userCity: null,
  userCityName: null,
  userState: null,
  searchLocation: null,
  effectiveSearchLocation: null,
  isLocating: true,
  isResolvingCity: false,
  permissionState: 'unknown',
  requestLocation: () => {},
  setSearchLocation: () => {},
});

const GOOD_ACCURACY_METERS = 80;
const ACCEPTABLE_ACCURACY_METERS = 250;

function coordsFromPosition(position: GeolocationPosition): UserCoords {
  return {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
  };
}

function getCurrentPosition(options: PositionOptions): Promise<{
  coords: UserCoords | null;
  accuracyMeters: number | null;
  denied: boolean;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({ coords: null, accuracyMeters: null, denied: true, timedOut: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: coordsFromPosition(position),
          accuracyMeters: position.coords.accuracy,
          denied: false,
          timedOut: false,
        });
      },
      (error) => {
        resolve({
          coords: null,
          accuracyMeters: null,
          denied: error.code === error.PERMISSION_DENIED,
          timedOut: error.code === error.TIMEOUT,
        });
      },
      options
    );
  });
}

function watchForBestPosition(timeoutMs: number): Promise<{
  coords: UserCoords | null;
  accuracyMeters: number | null;
  denied: boolean;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({ coords: null, accuracyMeters: null, denied: true, timedOut: false });
      return;
    }

    let best: { coords: UserCoords; accuracyMeters: number } | null = null;
    let watchId: number | null = null;
    let settled = false;

    const finish = (result: {
      coords: UserCoords | null;
      accuracyMeters: number | null;
      denied: boolean;
      timedOut: boolean;
    }) => {
      if (settled) return;
      settled = true;
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish({
        coords: best?.coords ?? null,
        accuracyMeters: best?.accuracyMeters ?? null,
        denied: false,
        timedOut: !best,
      });
    }, timeoutMs);

    watchId = navigator.geolocation.watchPosition(
      (position) => {
        const accuracyMeters = position.coords.accuracy;
        const coords = coordsFromPosition(position);

        if (!best || accuracyMeters < best.accuracyMeters) {
          best = { coords, accuracyMeters };
        }

        if (accuracyMeters <= GOOD_ACCURACY_METERS) {
          finish({ coords, accuracyMeters, denied: false, timedOut: false });
        }
      },
      (error) => {
        finish({
          coords: best?.coords ?? null,
          accuracyMeters: best?.accuracyMeters ?? null,
          denied: error.code === error.PERMISSION_DENIED,
          timedOut: error.code === error.TIMEOUT,
        });
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: timeoutMs }
    );
  });
}

/** Browser GPS/Wi‑Fi first; watch briefly for a sharper fix. No IP here — that is a separate fallback. */
async function tryBrowserGeolocation(): Promise<{
  coords: UserCoords | null;
  denied: boolean;
}> {
  const quick = await getCurrentPosition({
    enableHighAccuracy: true,
    maximumAge: 0,
    timeout: 10_000,
  });

  if (quick.coords) {
    if (quick.accuracyMeters == null || quick.accuracyMeters <= ACCEPTABLE_ACCURACY_METERS) {
      return { coords: quick.coords, denied: false };
    }
  }

  if (quick.denied) {
    return { coords: null, denied: true };
  }

  const refined = await watchForBestPosition(12_000);
  if (refined.coords) {
    return { coords: refined.coords, denied: false };
  }

  if (refined.denied) {
    return { coords: null, denied: true };
  }

  if (quick.coords) {
    return { coords: quick.coords, denied: false };
  }

  const networkFix = await getCurrentPosition({
    enableHighAccuracy: false,
    maximumAge: 0,
    timeout: 8_000,
  });

  if (networkFix.coords) {
    return { coords: networkFix.coords, denied: false };
  }

  return { coords: null, denied: networkFix.denied };
}

async function readPermissionState(): Promise<LocationPermissionState> {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    return 'unsupported';
  }

  if (!navigator.permissions?.query) {
    return 'unknown';
  }

  try {
    const status = await navigator.permissions.query({ name: 'geolocation' });
    return status.state as LocationPermissionState;
  } catch {
    return 'unknown';
  }
}

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [userCoords, setUserCoords] = useState<UserCoords | null>(null);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [userCityName, setUserCityName] = useState<string | null>(null);
  const [userState, setUserState] = useState<string | null>(null);
  const [searchLocation, setSearchLocationState] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [isResolvingCity, setIsResolvingCity] = useState(false);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('unknown');
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const hasAutoRequestedRef = useRef(false);
  const cityRequestRef = useRef(0);

  const effectiveSearchLocation = searchLocation ?? userCity;

  const setSearchLocation = useCallback((location: string | null) => {
    setSearchLocationState(location?.trim() || null);
  }, []);

  const applyCoords = useCallback((coords: UserCoords) => {
    setUserCoords(coords);
    setIsLocating(false);
  }, []);

  useEffect(() => {
    if (!userCoords) {
      setUserCity(null);
      setUserCityName(null);
      setUserState(null);
      setIsResolvingCity(false);
      return;
    }

    const requestId = ++cityRequestRef.current;
    setIsResolvingCity(true);

    resolveCityFromCoordinates(userCoords.lat, userCoords.lng).then((result) => {
      if (requestId !== cityRequestRef.current) return;
      setUserCity(result.success && result.city ? result.city : null);
      setUserCityName(result.success && result.cityName ? result.cityName : null);
      setUserState(result.success && result.state ? result.state : null);
      setIsResolvingCity(false);
    });
  }, [userCoords]);

  const resolveLocation = useCallback(async () => {
    setIsLocating(true);

    const permission = await readPermissionState();
    setPermissionState(permission);

    if (permission === 'unsupported') {
      const googleCoords = await geolocateViaGoogleIp();
      if (googleCoords) {
        applyCoords(googleCoords);
        return;
      }
      setIsLocating(false);
      return;
    }

    let browserDenied = false;

    if (permission !== 'denied') {
      const browserResult = await tryBrowserGeolocation();

      if (browserResult.coords) {
        setPermissionState('granted');
        applyCoords(browserResult.coords);
        return;
      }

      browserDenied = browserResult.denied;
    } else {
      browserDenied = true;
    }

    const googleCoords = await geolocateViaGoogleIp();
    if (googleCoords) {
      setPermissionState(browserDenied ? 'denied' : 'prompt');
      applyCoords(googleCoords);
      return;
    }

    if (browserDenied) {
      setPermissionState('denied');
    } else {
      setPermissionState('prompt');
    }
    setIsLocating(false);
  }, [applyCoords]);

  const requestLocation = useCallback(() => {
    void resolveLocation();
  }, [resolveLocation]);

  useEffect(() => {
    if (hasAutoRequestedRef.current) return;
    hasAutoRequestedRef.current = true;
    void resolveLocation();
  }, [resolveLocation]);

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.permissions?.query) return;

    let cancelled = false;

    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (cancelled) return;

        permissionStatusRef.current = status;
        setPermissionState(status.state as LocationPermissionState);

        status.onchange = () => {
          setPermissionState(status.state as LocationPermissionState);

          if (status.state === 'granted') {
            void tryBrowserGeolocation().then((result) => {
              if (result.coords) {
                applyCoords(result.coords);
              }
            });
          }
        };
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (permissionStatusRef.current) {
        permissionStatusRef.current.onchange = null;
      }
    };
  }, [applyCoords]);

  return (
    <UserLocationContext.Provider
      value={{
        userCoords,
        userCity,
        userCityName,
        userState,
        searchLocation,
        effectiveSearchLocation,
        isLocating,
        isResolvingCity,
        permissionState,
        requestLocation,
        setSearchLocation,
      }}
    >
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserCoords() {
  return useContext(UserLocationContext).userCoords;
}

export function useUserCity() {
  const { userCity, isLocating, isResolvingCity } = useContext(UserLocationContext);
  if (userCity) return userCity;
  if (isLocating || isResolvingCity) return 'Detecting…';
  return 'Near you';
}

export function useUserLocationState() {
  return useContext(UserLocationContext);
}

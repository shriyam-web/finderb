'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { resolveCityFromCoordinates } from '@/app/actions/location';

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

function getCurrentPosition(options: PositionOptions): Promise<{
  coords: UserCoords | null;
  denied: boolean;
  timedOut: boolean;
}> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      resolve({ coords: null, denied: true, timedOut: false });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          denied: false,
          timedOut: false,
        });
      },
      (error) => {
        resolve({
          coords: null,
          denied: error.code === error.PERMISSION_DENIED,
          timedOut: error.code === error.TIMEOUT,
        });
      },
      options
    );
  });
}

/** Network/Wi‑Fi fix first (fast on desktop), then high-accuracy retry. No IP fallback — IP is often wrong (e.g. Delhi vs Lucknow). */
async function tryBrowserGeolocation(): Promise<{
  coords: UserCoords | null;
  denied: boolean;
}> {
  const attempts: PositionOptions[] = [
    { enableHighAccuracy: false, maximumAge: 0, timeout: 12_000 },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 18_000 },
  ];

  let denied = false;

  for (const options of attempts) {
    const result = await getCurrentPosition(options);
    if (result.coords) {
      return { coords: result.coords, denied: false };
    }
    if (result.denied) {
      denied = true;
      break;
    }
  }

  return { coords: null, denied };
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
      setIsLocating(false);
      return;
    }

    if (permission === 'denied') {
      setPermissionState('denied');
      setIsLocating(false);
      return;
    }

    const result = await tryBrowserGeolocation();

    if (result.coords) {
      setPermissionState('granted');
      applyCoords(result.coords);
      return;
    }

    if (result.denied) {
      setPermissionState('denied');
      setIsLocating(false);
      return;
    }

    setPermissionState('prompt');
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

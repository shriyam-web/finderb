'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

export type UserCoords = { lat: number; lng: number };

export type LocationPermissionState = 'granted' | 'denied' | 'prompt' | 'unsupported' | 'unknown';

type UserLocationContextValue = {
  userCoords: UserCoords | null;
  isLocating: boolean;
  permissionState: LocationPermissionState;
  requestLocation: () => void;
};

const UserLocationContext = createContext<UserLocationContextValue>({
  userCoords: null,
  isLocating: true,
  permissionState: 'unknown',
  requestLocation: () => {},
});

function tryBrowserGeolocation(timeoutMs = 20_000): Promise<{
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
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: timeoutMs,
      }
    );
  });
}

async function tryIpGeolocation(): Promise<UserCoords | null> {
  const providers = [
    async () => {
      const response = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      return { lat: Number(data.latitude), lng: Number(data.longitude) };
    },
    async () => {
      const response = await fetch('https://ipwho.is/', { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      return { lat: Number(data.latitude), lng: Number(data.longitude) };
    },
  ];

  for (const provider of providers) {
    try {
      const coords = await provider();
      if (
        coords &&
        Number.isFinite(coords.lat) &&
        Number.isFinite(coords.lng) &&
        !(coords.lat === 0 && coords.lng === 0)
      ) {
        return coords;
      }
    } catch {
      continue;
    }
  }

  return null;
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
  const [isLocating, setIsLocating] = useState(true);
  const [permissionState, setPermissionState] = useState<LocationPermissionState>('unknown');
  const permissionStatusRef = useRef<PermissionStatus | null>(null);
  const hasAutoRequestedRef = useRef(false);

  const applyCoords = useCallback((coords: UserCoords) => {
    setUserCoords(coords);
    setIsLocating(false);
  }, []);

  const applyIpFallback = useCallback(async () => {
    const ip = await tryIpGeolocation();
    if (ip) {
      applyCoords(ip);
      return;
    }
    setIsLocating(false);
  }, [applyCoords]);

  const resolveLocation = useCallback(async () => {
    setIsLocating(true);

    const permission = await readPermissionState();
    setPermissionState(permission);

    if (permission === 'unsupported') {
      await applyIpFallback();
      return;
    }

    if (permission === 'denied') {
      setPermissionState('denied');
      await applyIpFallback();
      return;
    }

    const firstAttempt = await tryBrowserGeolocation();
    if (firstAttempt.coords) {
      setPermissionState('granted');
      applyCoords(firstAttempt.coords);
      return;
    }

    if (firstAttempt.denied) {
      setPermissionState('denied');
      await applyIpFallback();
      return;
    }

    setPermissionState('prompt');

    if (firstAttempt.timedOut) {
      const retry = await tryBrowserGeolocation(15_000);
      if (retry.coords) {
        setPermissionState('granted');
        applyCoords(retry.coords);
        return;
      }
      if (retry.denied) {
        setPermissionState('denied');
        await applyIpFallback();
        return;
      }
    }

    setIsLocating(false);
  }, [applyCoords, applyIpFallback]);

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
            return;
          }

          if (status.state === 'denied' && !userCoords) {
            void applyIpFallback();
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
  }, [applyCoords, applyIpFallback, userCoords]);

  return (
    <UserLocationContext.Provider
      value={{ userCoords, isLocating, permissionState, requestLocation }}
    >
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserCoords() {
  return useContext(UserLocationContext).userCoords;
}

export function useUserLocationState() {
  return useContext(UserLocationContext);
}

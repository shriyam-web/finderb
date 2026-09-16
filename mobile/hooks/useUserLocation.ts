import { useCallback, useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';

export type UserCoords = {
  lat: number;
  lng: number;
};

export type UserLocationState = {
  status: 'idle' | 'requesting' | 'detecting' | 'ready' | 'denied' | 'error';
  coords: UserCoords | null;
  city: string | null;
  region: string | null;
  label: string;
  error: string | null;
  refresh: () => Promise<void>;
};

function pickCity(place: Location.LocationGeocodedAddress): {
  city: string | null;
  region: string | null;
} {
  const city =
    place.city?.trim() ||
    place.subregion?.trim() ||
    place.district?.trim() ||
    place.name?.trim() ||
    null;
  const region = place.region?.trim() || place.country?.trim() || null;
  return { city, region };
}

function formatLabel(city: string | null, region: string | null): string {
  if (city && region && !city.toLowerCase().includes(region.toLowerCase())) {
    return `${city}, ${region}`;
  }
  return city || region || 'Your area';
}

export function useUserLocation(auto = true): UserLocationState {
  const [status, setStatus] = useState<UserLocationState['status']>('idle');
  const [coords, setCoords] = useState<UserCoords | null>(null);
  const [city, setCity] = useState<string | null>(null);
  const [region, setRegion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const detect = useCallback(async () => {
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
        setCoords(null);
        setCity(null);
        setRegion(null);
        setError('Location permission denied');
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
      setCoords(nextCoords);

      const places = await Location.reverseGeocodeAsync({
        latitude: nextCoords.lat,
        longitude: nextCoords.lng,
      });
      if (id !== requestId.current) return;

      const place = places[0];
      if (place) {
        const picked = pickCity(place);
        setCity(picked.city);
        setRegion(picked.region);
      } else {
        setCity(null);
        setRegion(null);
      }
      setStatus('ready');
    } catch (err) {
      if (id !== requestId.current) return;
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Could not detect location');
    }
  }, []);

  useEffect(() => {
    if (auto) {
      detect();
    }
  }, [auto, detect]);

  const label =
    status === 'requesting' || status === 'detecting'
      ? 'Detecting your city…'
      : status === 'denied'
        ? 'Enable location'
        : status === 'error'
          ? 'Tap to retry'
          : formatLabel(city, region);

  return {
    status,
    coords,
    city,
    region,
    label,
    error,
    refresh: detect,
  };
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { sortTouristPlacesByUserCoords } from '@/app/actions/touristPlace';
import type { TouristPlaceLike } from '@/lib/touristPlaceSort';
import { sortTouristPlacesByText } from '@/lib/touristPlaceSort';
import { useUserLocationState } from '@/hooks/useUserCoords';

export function useSortedTouristPlaces<T extends TouristPlaceLike>(places: T[]): T[] {
  const { userCoords, userCityName, userState, effectiveSearchLocation } = useUserLocationState();
  const [distanceSorted, setDistanceSorted] = useState<T[] | null>(null);

  const textSorted = useMemo(
    () =>
      sortTouristPlacesByText(places, {
        cityName: userCityName,
        state: userState,
        searchLocation: effectiveSearchLocation,
      }),
    [places, userCityName, userState, effectiveSearchLocation]
  );

  useEffect(() => {
    if (!userCoords || places.length === 0) {
      setDistanceSorted(null);
      return;
    }

    let cancelled = false;

    sortTouristPlacesByUserCoords(places, userCoords.lat, userCoords.lng).then((result) => {
      if (!cancelled && result.success && result.touristPlaces) {
        setDistanceSorted(result.touristPlaces as T[]);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [places, userCoords]);

  return distanceSorted ?? textSorted;
}

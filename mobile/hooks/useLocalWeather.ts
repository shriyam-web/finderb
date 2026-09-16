import { useEffect, useRef, useState } from 'react';
import type { Coords } from '../lib/geo';
import {
  fallbackWeather,
  fetchLocalWeather,
  localHour,
  resolveDayPart,
  type LocalWeather,
} from '../lib/weather';

/**
 * Loads local climate for header theming.
 * Uses Open-Meteo `is_day` (sunrise/sunset) so pre-dawn never reads as sunny morning.
 */
export function useLocalWeather(coords?: Coords | null): LocalWeather {
  const [weather, setWeather] = useState<LocalWeather>(() => fallbackWeather());
  const dayPartRef = useRef(resolveDayPart(localHour(), false));
  const isDayRef = useRef(weather.isDay);

  useEffect(() => {
    let cancelled = false;

    const refresh = async () => {
      if (!coords?.lat || !coords?.lng) {
        if (!cancelled) {
          const fb = fallbackWeather();
          dayPartRef.current = fb.dayPart;
          isDayRef.current = fb.isDay;
          setWeather(fb);
        }
        return;
      }
      const next = await fetchLocalWeather(coords.lat, coords.lng);
      if (!cancelled && next) {
        dayPartRef.current = next.dayPart;
        isDayRef.current = next.isDay;
        setWeather(next);
      }
    };

    void refresh();

    const tickId = setInterval(() => {
      const hour = localHour();
      const part = resolveDayPart(hour, isDayRef.current);
      const nearTwilight = (hour >= 4.5 && hour <= 8) || (hour >= 16.5 && hour <= 20);

      if (part !== dayPartRef.current || nearTwilight) {
        dayPartRef.current = part;
        void refresh();
      } else if (!coords?.lat || !coords?.lng) {
        if (!cancelled) setWeather(fallbackWeather());
      }
    }, 60 * 1000);

    const weatherId = setInterval(() => {
      void refresh();
    }, 10 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(tickId);
      clearInterval(weatherId);
    };
  }, [coords?.lat, coords?.lng]);

  return weather;
}

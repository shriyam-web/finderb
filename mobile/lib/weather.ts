/**
 * Local weather via Open-Meteo (no API key).
 * Resolves a sky mood from time-of-day + weather for the home header.
 */

export type DayPart = 'morning' | 'afternoon' | 'evening' | 'night';

export type SkyWeather =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'storm'
  | 'fog'
  | 'heat'
  | 'snow';

/** Composite mood used by header themes */
export type ClimateMood =
  | 'morning_clear'
  | 'morning_cloudy'
  | 'morning_rain'
  | 'afternoon_clear'
  | 'afternoon_heat'
  | 'afternoon_cloudy'
  | 'afternoon_rain'
  | 'evening_clear'
  | 'evening_cloudy'
  | 'evening_rain'
  | 'night_clear'
  | 'night_cloudy'
  | 'night_rain'
  | 'storm'
  | 'fog'
  | 'snow';

export type HourlyForecastHour = {
  hour: number;
  label: string;
  temperatureC: number | null;
  weatherCode: number;
  skyWeather: SkyWeather;
  skyLabel: string;
  precipChance: number | null;
  isDay: boolean;
};

export type LocalWeather = {
  mood: ClimateMood;
  dayPart: DayPart;
  skyWeather: SkyWeather;
  temperatureC: number | null;
  weatherCode: number;
  isDay: boolean;
  label: string;
  fetchedAt: number;
  hourly: HourlyForecastHour[];
};

type OpenMeteoCurrent = {
  temperature_2m?: number;
  weather_code?: number;
  is_day?: number;
};

type OpenMeteoHourly = {
  time?: string[];
  temperature_2m?: Array<number | null>;
  weather_code?: Array<number | null>;
  precipitation_probability?: Array<number | null>;
  is_day?: Array<number | null>;
};

type OpenMeteoResponse = {
  current?: OpenMeteoCurrent;
  hourly?: OpenMeteoHourly;
};

export function localHour(date = new Date()): number {
  return date.getHours() + date.getMinutes() / 60;
}

/**
 * Resolve morning/afternoon/evening/night.
 * When Open-Meteo `is_day` is available, solar night wins over clock hours
 * so we don't show "morning/sunny" before sunrise.
 */
export function resolveDayPart(
  hour = localHour(),
  isDay?: boolean | null,
): DayPart {
  if (isDay === false) {
    // After sunset / before sunrise
    if (hour >= 16 && hour < 20) return 'evening';
    return 'night';
  }

  if (isDay === true) {
    if (hour < 11) return 'morning';
    if (hour < 16.5) return 'afternoon';
    if (hour < 19.5) return 'evening';
    return 'night';
  }

  // No solar flag — conservative clock buckets (avoid 5am "morning")
  if (hour >= 6.5 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16.5) return 'afternoon';
  if (hour >= 16.5 && hour < 19.5) return 'evening';
  return 'night';
}

function skyWeatherFromCode(
  code: number,
  dayPart: DayPart,
  temperatureC: number | null,
): SkyWeather {
  if (code >= 95) return 'storm';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 71 && code <= 77) return 'snow';
  if (
    (code >= 51 && code <= 67) ||
    (code >= 80 && code <= 82) ||
    code === 85 ||
    code === 86
  ) {
    return 'rain';
  }
  // Overcast / cloudy
  if (code === 2 || code === 3) return 'cloudy';
  // Clear / mainly clear
  if (
    (code === 0 || code === 1) &&
    dayPart === 'afternoon' &&
    temperatureC != null &&
    temperatureC >= 35
  ) {
    return 'heat';
  }
  return 'clear';
}

export function moodFromParts(
  dayPart: DayPart,
  skyWeather: SkyWeather,
): ClimateMood {
  if (skyWeather === 'storm') return 'storm';
  if (skyWeather === 'fog') return 'fog';
  if (skyWeather === 'snow') return 'snow';

  if (dayPart === 'morning') {
    if (skyWeather === 'rain') return 'morning_rain';
    if (skyWeather === 'cloudy') return 'morning_cloudy';
    return 'morning_clear';
  }
  if (dayPart === 'afternoon') {
    if (skyWeather === 'heat') return 'afternoon_heat';
    if (skyWeather === 'rain') return 'afternoon_rain';
    if (skyWeather === 'cloudy') return 'afternoon_cloudy';
    return 'afternoon_clear';
  }
  if (dayPart === 'evening') {
    if (skyWeather === 'rain') return 'evening_rain';
    if (skyWeather === 'cloudy') return 'evening_cloudy';
    return 'evening_clear';
  }
  // night
  if (skyWeather === 'rain') return 'night_rain';
  if (skyWeather === 'cloudy') return 'night_cloudy';
  return 'night_clear';
}

export function skyChipLabel(skyWeather: SkyWeather): string {
  switch (skyWeather) {
    case 'rain':
      return 'Rain';
    case 'storm':
      return 'Storm';
    case 'cloudy':
      return 'Cloudy';
    case 'fog':
      return 'Fog';
    case 'snow':
      return 'Snow';
    case 'heat':
      return 'Hot';
    case 'clear':
    default:
      return 'Clear';
  }
}

function parseOpenMeteoLocal(iso: string): Date | null {
  const [datePart, timePart = '00:00'] = iso.split('T');
  if (!datePart) return null;
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes = 0] = timePart.split(':').map(Number);
  if (![year, month, day, hours].every(Number.isFinite)) return null;
  return new Date(year, month - 1, day, hours, minutes);
}

function formatHourLabel(date: Date, isNow: boolean): string {
  if (isNow) return 'Now';
  const hour = date.getHours();
  const suffix = hour >= 12 ? 'PM' : 'AM';
  return `${hour % 12 || 12} ${suffix}`;
}

function remainingHourlyForecast(
  hourly: OpenMeteoHourly | undefined,
): HourlyForecastHour[] {
  const times = hourly?.time ?? [];
  if (times.length === 0) return [];

  const now = new Date();
  const nowMs = now.getTime();
  const rows: HourlyForecastHour[] = [];

  for (let i = 0; i < times.length; i += 1) {
    const at = parseOpenMeteoLocal(times[i] ?? '');
    if (!at) continue;
    // Keep from ~current hour forward (next ~18 slots), not calendar-"today"
    // only — timezone mismatches were wiping the rail empty.
    if (at.getTime() < nowMs - 45 * 60 * 1000) continue;

    const hour = at.getHours();
    const temperatureC = hourly?.temperature_2m?.[i];
    const weatherCode = Number(hourly?.weather_code?.[i] ?? 0);
    const isDay = Number(hourly?.is_day?.[i] ?? 1) === 1;
    const temp =
      typeof temperatureC === 'number' && Number.isFinite(temperatureC)
        ? temperatureC
        : null;
    const precipRaw = hourly?.precipitation_probability?.[i];
    const skyWeather = skyWeatherFromCode(
      weatherCode,
      resolveDayPart(hour, isDay),
      temp,
    );
    const precipChance =
      typeof precipRaw === 'number' && Number.isFinite(precipRaw)
        ? Math.round(precipRaw)
        : null;

    const isNow =
      Math.abs(at.getTime() - nowMs) < 35 * 60 * 1000 &&
      hour === now.getHours();

    rows.push({
      hour,
      label: formatHourLabel(at, isNow),
      temperatureC: temp,
      weatherCode,
      skyWeather,
      skyLabel: skyChipLabel(skyWeather),
      precipChance,
      isDay,
    });

    if (rows.length >= 18) break;
  }

  return rows;
}

function labelFor(
  dayPart: DayPart,
  skyWeather: SkyWeather,
  temp: number | null,
): string {
  const partLabel: Record<DayPart, string> = {
    morning: 'Morning',
    afternoon: 'Afternoon',
    evening: 'Evening',
    night: 'Night',
  };
  const skyLabel: Record<SkyWeather, string> = {
    clear: 'clear',
    cloudy: 'cloudy',
    rain: 'rain',
    storm: 'stormy',
    fog: 'misty',
    heat: 'hot & clear',
    snow: 'snowy',
  };
  const t = temp != null && Number.isFinite(temp) ? ` · ${Math.round(temp)}°` : '';
  return `${partLabel[dayPart]} · ${skyLabel[skyWeather]}${t}`;
}

const cache = new Map<string, LocalWeather>();
const CACHE_MS = 15 * 60 * 1000;

function cacheKey(lat: number, lng: number, dayPart: DayPart): string {
  return `v2|${lat.toFixed(2)},${lng.toFixed(2)}|${dayPart}`;
}

function buildWeather(input: {
  weatherCode: number;
  isDay: boolean;
  temperatureC: number | null;
  hourly?: HourlyForecastHour[];
}): LocalWeather {
  const dayPart = resolveDayPart(localHour(), input.isDay);
  const skyWeather = skyWeatherFromCode(
    input.weatherCode,
    dayPart,
    input.temperatureC,
  );
  const mood = moodFromParts(dayPart, skyWeather);
  return {
    mood,
    dayPart,
    skyWeather,
    temperatureC: input.temperatureC,
    weatherCode: input.weatherCode,
    isDay: input.isDay,
    label: labelFor(dayPart, skyWeather, input.temperatureC),
    fetchedAt: Date.now(),
    hourly: input.hourly ?? [],
  };
}

export async function fetchLocalWeather(
  lat: number,
  lng: number,
): Promise<LocalWeather | null> {
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const dayPart = resolveDayPart();
  const key = cacheKey(lat, lng, dayPart);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.fetchedAt < CACHE_MS && (hit.hourly?.length ?? 0) > 0) {
    const now = new Date();
    const currentHour = now.getHours();
    return buildWeather({
      weatherCode: hit.weatherCode,
      isDay: hit.isDay,
      temperatureC: hit.temperatureC,
      hourly: hit.hourly
        .filter((row) => row.hour >= currentHour)
        .map((row) => ({
          ...row,
          label: formatHourLabel(
            new Date(now.getFullYear(), now.getMonth(), now.getDate(), row.hour),
            row.hour === currentHour,
          ),
        })),
    });
  }

  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${encodeURIComponent(String(lat))}` +
    `&longitude=${encodeURIComponent(String(lng))}` +
    `&current=temperature_2m,weather_code,is_day` +
    `&hourly=temperature_2m,weather_code,is_day,precipitation_probability` +
    `&forecast_days=2` +
    `&timezone=auto`;

  try {
    const res = await fetch(url);
    if (!res.ok) return hit || null;
    const data = (await res.json()) as OpenMeteoResponse;
    const cur = data.current;
    if (!cur) return hit || null;

    const weather = buildWeather({
      weatherCode: Number(cur.weather_code ?? 0),
      isDay: Number(cur.is_day ?? 1) === 1,
      temperatureC:
        typeof cur.temperature_2m === 'number' ? cur.temperature_2m : null,
      hourly: remainingHourlyForecast(data.hourly),
    });
    cache.set(key, weather);
    return weather;
  } catch {
    return hit || null;
  }
}

/** Fallback when location / network unavailable — still time-aware. */
export function fallbackWeather(): LocalWeather {
  const hour = localHour();
  // Rough solar guess without API — don't treat pre-dawn as daytime.
  const isDay = hour >= 6.5 && hour < 19;
  return buildWeather({
    weatherCode: 0,
    isDay,
    temperatureC: null,
  });
}

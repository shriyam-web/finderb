import { useEffect, useMemo, useState } from 'react';
import { useAppLocation } from '../context/LocationContext';
import { formatRoadDistanceKm, getDistanceKm, type Coords } from './geo';
import { SITE_URL } from './supabase';

type Point = { lat: number; lng: number };

const cache = new Map<string, number | null>();
const listeners = new Set<() => void>();
let queue: Point[] = [];
let queuedOrigin: Coords | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;
const inflight = new Set<string>();

function cacheKey(origin: Coords, point: Point): string {
  return `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)}|${point.lat.toFixed(5)},${point.lng.toFixed(5)}`;
}

function emit() {
  for (const listener of listeners) listener();
}

async function osrmDrivingKm(origin: Coords, points: Point[]): Promise<Array<number | null> | null> {
  const path = [origin, ...points].map((point) => `${point.lng},${point.lat}`).join(';');
  const response = await fetch(
    `https://router.project-osrm.org/table/v1/driving/${path}?sources=0&annotations=distance`,
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    code?: string;
    distances?: Array<Array<number | null>>;
  };
  const row = body.code === 'Ok' ? body.distances?.[0] : null;
  if (!row) return null;
  return points.map((_, index) => {
    const meters = row[index + 1];
    return typeof meters === 'number' && Number.isFinite(meters) ? meters / 1000 : null;
  });
}

async function finderDrivingKm(
  origin: Coords,
  points: Point[],
): Promise<Array<number | null> | null> {
  const response = await fetch(`${SITE_URL}/api/distance`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ origin, destinations: points }),
  });
  if (!response.ok) return null;
  const body = (await response.json()) as { distancesKm?: Array<number | null> };
  if (!Array.isArray(body.distancesKm) || body.distancesKm.length !== points.length) {
    return null;
  }
  return body.distancesKm.map((km) =>
    typeof km === 'number' && Number.isFinite(km) ? km : null,
  );
}

async function flush() {
  timer = null;
  const origin = queuedOrigin;
  const points = queue;
  queue = [];
  if (!origin || !points.length) return;

  const chunks: Point[][] = [];
  for (let index = 0; index < points.length; index += 20) {
    chunks.push(points.slice(index, index + 20));
  }

  await Promise.all(
    chunks.map(async (chunk) => {
      let distances: Array<number | null> | null = null;
      try {
        distances = await finderDrivingKm(origin, chunk);
      } catch {
        distances = null;
      }
      if (!distances) {
        try {
          distances = await osrmDrivingKm(origin, chunk);
        } catch {
          distances = null;
        }
      }
      chunk.forEach((point, index) => {
        const id = cacheKey(origin, point);
        inflight.delete(id);
        cache.set(id, distances ? distances[index] ?? null : null);
      });
    }),
  );
  emit();
}

function requestDrivingDistance(origin: Coords, lat: number, lng: number) {
  const point = { lat, lng };
  const id = cacheKey(origin, point);
  if (cache.has(id) || inflight.has(id)) return;
  if (
    queuedOrigin &&
    (queuedOrigin.lat.toFixed(4) !== origin.lat.toFixed(4) ||
      queuedOrigin.lng.toFixed(4) !== origin.lng.toFixed(4))
  ) {
    queue = [];
  }
  queuedOrigin = origin;
  inflight.add(id);
  queue.push(point);
  if (!timer) timer = setTimeout(() => void flush(), 70);
}

function useDistanceTick(): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const listener = () => setTick((value) => value + 1);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);
  return tick;
}

type Pinnable = { latitude?: number | null; longitude?: number | null };

function pinOf(item: Pinnable): Point | null {
  const { latitude: lat, longitude: lng } = item;
  if (lat == null || lng == null || (lat === 0 && lng === 0)) return null;
  return { lat, lng };
}

/**
 * Orders listings by the road distance shown on their cards. Keeps the given
 * order until every route is known, so cards don't shuffle while labels load.
 */
export function useRoadDistanceOrder<T extends Pinnable>(items: T[]): T[] {
  const { coords } = useAppLocation();
  const tick = useDistanceTick();

  useEffect(() => {
    if (!coords) return;
    for (const item of items) {
      const pin = pinOf(item);
      if (pin) requestDrivingDistance(coords, pin.lat, pin.lng);
    }
  }, [coords, items]);

  return useMemo(() => {
    if (!coords || items.length < 2) return items;
    const ranked: Array<{ item: T; index: number; km: number }> = [];
    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      const pin = pinOf(item);
      if (!pin) {
        ranked.push({ item, index, km: Infinity });
        continue;
      }
      const id = cacheKey(coords, pin);
      if (!cache.has(id)) return items;
      const road = cache.get(id);
      ranked.push({
        item,
        index,
        km: road ?? getDistanceKm(coords.lat, coords.lng, pin.lat, pin.lng),
      });
    }
    ranked.sort((a, b) => (a.km !== b.km ? (a.km < b.km ? -1 : 1) : a.index - b.index));
    return ranked.map((entry) => entry.item);
  }, [coords, items, tick]);
}

/** Road distance from the user to a listing. Empty until the route is known. */
export function useDrivingDistanceLabel(
  lat?: number | null,
  lng?: number | null,
): string | null {
  const { coords } = useAppLocation();
  useDistanceTick();

  useEffect(() => {
    if (!coords || lat == null || lng == null || (lat === 0 && lng === 0)) return;
    requestDrivingDistance(coords, lat, lng);
  }, [coords, lat, lng]);

  if (!coords || lat == null || lng == null || (lat === 0 && lng === 0)) return null;
  const km = cache.get(cacheKey(coords, { lat, lng }));
  if (km == null) return null;
  return formatRoadDistanceKm(km);
}

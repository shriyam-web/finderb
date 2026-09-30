import { NextRequest, NextResponse } from 'next/server';
import { getGoogleMapsServerKeyOrFallback } from '@/lib/googleMapsKeys';

export const dynamic = 'force-dynamic';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
} as const;

type Point = { lat: number; lng: number };

function isPoint(value: unknown): value is Point {
  if (!value || typeof value !== 'object') return false;
  const point = value as Point;
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

async function googleDrivingMeters(
  origin: Point,
  destinations: Point[],
  key: string,
): Promise<Array<number | null> | null> {
  const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
  url.searchParams.set('origins', `${origin.lat},${origin.lng}`);
  url.searchParams.set(
    'destinations',
    destinations.map((point) => `${point.lat},${point.lng}`).join('|'),
  );
  url.searchParams.set('mode', 'driving');
  url.searchParams.set('units', 'metric');
  url.searchParams.set('key', key);

  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) return null;
  const body = (await response.json()) as {
    status?: string;
    rows?: Array<{
      elements?: Array<{ status?: string; distance?: { value?: number } }>;
    }>;
  };
  if (body.status !== 'OK') return null;
  const elements = body.rows?.[0]?.elements;
  if (!elements || elements.length !== destinations.length) return null;
  return elements.map((element) =>
    element.status === 'OK' && typeof element.distance?.value === 'number'
      ? element.distance.value
      : null,
  );
}

async function osrmDrivingMeters(
  origin: Point,
  destinations: Point[],
): Promise<Array<number | null> | null> {
  const path = [origin, ...destinations]
    .map((point) => `${point.lng},${point.lat}`)
    .join(';');
  const response = await fetch(
    `https://router.project-osrm.org/table/v1/driving/${path}?sources=0&annotations=distance`,
    { cache: 'no-store' },
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    code?: string;
    distances?: Array<Array<number | null>>;
  };
  if (body.code !== 'Ok' || !body.distances?.[0]) return null;
  const row = body.distances[0];
  return destinations.map((_, index) => {
    const meters = row[index + 1];
    return typeof meters === 'number' && Number.isFinite(meters) ? meters : null;
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** Driving distance, the same kind of route Google Maps navigation uses. */
export async function POST(request: NextRequest) {
  let payload: { origin?: unknown; destinations?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: CORS });
  }

  if (!isPoint(payload.origin) || !Array.isArray(payload.destinations)) {
    return NextResponse.json({ error: 'Origin and destinations are required' }, { status: 400, headers: CORS });
  }

  const destinations = payload.destinations.filter(isPoint).slice(0, 25);
  if (!destinations.length) {
    return NextResponse.json({ distancesKm: [] }, { headers: CORS });
  }

  const key = getGoogleMapsServerKeyOrFallback();
  let meters: Array<number | null> | null = null;
  if (key) {
    try {
      meters = await googleDrivingMeters(payload.origin, destinations, key);
    } catch {
      meters = null;
    }
  }
  if (!meters) {
    try {
      meters = await osrmDrivingMeters(payload.origin, destinations);
    } catch {
      meters = null;
    }
  }
  if (!meters) {
    return NextResponse.json({ error: 'Route lookup failed' }, { status: 502, headers: CORS });
  }

  return NextResponse.json(
    {
      distancesKm: meters.map((value) =>
        value == null ? null : Math.round((value / 1000) * 1000) / 1000,
      ),
    },
    { headers: CORS },
  );
}

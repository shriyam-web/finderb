export type ParsedCoordinates = {
  latitude: number;
  longitude: number;
};

function isValidCoordinates(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function isGoogleMapsUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'goo.gl' || host === 'maps.app.goo.gl') return true;
    if (host === 'maps.google.com' || host === 'google.com') {
      return url.pathname.includes('/maps') || url.searchParams.has('q') || url.searchParams.has('query');
    }
    if (host.endsWith('.google.com') && url.pathname.includes('/maps')) return true;

    return false;
  } catch {
    return false;
  }
}

export function parseCoordinatesFromGoogleMapsUrl(url: string): ParsedCoordinates | null {
  const decoded = decodeURIComponent(url);

  const pinMatch = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  if (pinMatch) {
    const latitude = parseFloat(pinMatch[1]);
    const longitude = parseFloat(pinMatch[2]);
    if (isValidCoordinates(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  const patterns = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query)=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /\/search\/(-?\d+(?:\.\d+)?),\+?(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) continue;
    const latitude = parseFloat(match[1]);
    const longitude = parseFloat(match[2]);
    if (isValidCoordinates(latitude, longitude)) {
      return { latitude, longitude };
    }
  }

  return null;
}

export function extractGoogleMapsSearchQuery(url: string): string | null {
  try {
    const parsed = new URL(url);
    const fromQuery =
      parsed.searchParams.get('q') ||
      parsed.searchParams.get('query') ||
      parsed.searchParams.get('destination');

    if (fromQuery && !/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(fromQuery.trim())) {
      return fromQuery.trim();
    }

    const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) {
      return decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
    }

    return null;
  } catch {
    return null;
  }
}

export function extractPlaceNameFromGoogleMapsUrl(url: string): string | null {
  const fromQuery = extractGoogleMapsSearchQuery(url);
  if (fromQuery) {
    const cleaned = fromQuery.split('@')[0].trim();
    if (cleaned && !/^-?\d+(?:\.\d+)?,\s*-?\d+(?:\.\d+)?$/.test(cleaned)) {
      return cleaned;
    }
  }

  try {
    const parsed = new URL(url);
    const placeMatch = parsed.pathname.match(/\/maps\/place\/([^/@]+)/);
    if (placeMatch) {
      const name = decodeURIComponent(placeMatch[1].replace(/\+/g, ' ')).trim();
      if (name) return name;
    }
  } catch {
    return null;
  }

  return null;
}

export function buildGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

export function normalizeGoogleMapsInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
}

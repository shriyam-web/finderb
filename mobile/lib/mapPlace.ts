export type MapPin = { lat: number; lng: number };

export type PinCityCheck = {
  ok: boolean;
  message: string;
};

const ALIASES: Record<string, string[]> = {
  mohali: ['sahibzada ajit singh nagar', 'sas nagar', 'ajitgarh'],
  'sahibzada ajit singh nagar': ['mohali', 'sas nagar'],
  'sas nagar': ['mohali', 'sahibzada ajit singh nagar'],
  bengaluru: ['bangalore'],
  bangalore: ['bengaluru'],
  mumbai: ['bombay'],
  bombay: ['mumbai'],
  kolkata: ['calcutta'],
  calcutta: ['kolkata'],
  chennai: ['madras'],
  madras: ['chennai'],
  thiruvananthapuram: ['trivandrum'],
  trivandrum: ['thiruvananthapuram'],
  puducherry: ['pondicherry'],
  pondicherry: ['puducherry'],
  vadodara: ['baroda'],
  baroda: ['vadodara'],
  kochi: ['cochin'],
  cochin: ['kochi'],
  kozhikode: ['calicut'],
  calicut: ['kozhikode'],
  varanasi: ['banaras', 'benares'],
  prayagraj: ['allahabad'],
  allahabad: ['prayagraj'],
  gurugram: ['gurgaon'],
  gurgaon: ['gurugram'],
};

function norm(value: string) {
  return value.trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
}

export function placeNamesMatch(a: string, b: string) {
  const left = norm(a);
  const right = norm(b);
  if (!left || !right) return false;
  if (left === right || left.includes(right) || right.includes(left)) return true;
  const leftNames = new Set([left, ...(ALIASES[left] ?? [])]);
  const rightNames = new Set([right, ...(ALIASES[right] ?? [])]);
  for (const name of leftNames) {
    if (rightNames.has(name)) return true;
  }
  return false;
}

type NominatimAddress = Record<string, string | undefined>;

function addressNames(address: NominatimAddress) {
  return [
    address.city,
    address.town,
    address.village,
    address.municipality,
    address.city_district,
    address.suburb,
    address.county,
    address.state_district,
    address.neighbourhood,
    address.quarter,
    address.hamlet,
  ].filter((part): part is string => Boolean(part && part.trim()));
}

export function pinMatchesSelectedCity(
  address: NominatimAddress,
  city: string,
  state: string,
): PinCityCheck {
  const names = addressNames(address);
  const resolvedState = address.state?.trim() || '';
  const where = [names[0], resolvedState].filter(Boolean).join(', ');

  if (!names.length && !resolvedState) {
    return {
      ok: false,
      message: `We could not read a city from this pin. Move it onto ${city}.`,
    };
  }

  if (resolvedState && !placeNamesMatch(resolvedState, state)) {
    return {
      ok: false,
      message: `This pin is in ${where || resolvedState}. Move it inside ${city}, ${state}.`,
    };
  }

  if (!names.some((name) => placeNamesMatch(name, city))) {
    return {
      ok: false,
      message: where
        ? `This pin is in ${where}, not ${city}. Move it inside ${city}, or clear the pin.`
        : `This pin is not inside ${city}. Move it into ${city}, or clear the pin.`,
    };
  }

  return {
    ok: true,
    message: `Pin is inside ${city}.`,
  };
}

type PhotonFeature = {
  properties?: NominatimAddress & { locality?: string; district?: string };
  geometry?: { coordinates?: [number, number] };
};

function lookupHeaders() {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'Accept-Language': 'en',
  };
  if (typeof document === 'undefined') {
    headers['User-Agent'] = 'FinderB/1.0 (business-register)';
  }
  return headers;
}

async function readJson(url: string) {
  const response = await fetch(url, { headers: lookupHeaders() });
  if (!response.ok) throw new Error(`Place lookup failed (${response.status})`);
  return response.json();
}

function featureAddress(feature: PhotonFeature | undefined): NominatimAddress {
  const props = feature?.properties ?? {};
  return {
    city: props.city,
    town: props.locality,
    suburb: props.district,
    county: props.county,
    state: props.state,
    country: props.country,
  };
}

export async function geocodeCityCenter(city: string, state: string): Promise<MapPin | null> {
  try {
    const query = new URLSearchParams({
      format: 'jsonv2',
      limit: '1',
      country: 'India',
      state,
      city,
    });
    const rows = (await readJson(
      `https://nominatim.openstreetmap.org/search?${query.toString()}`,
    )) as Array<{ lat?: string; lon?: string }>;
    const lat = Number(rows[0]?.lat);
    const lng = Number(rows[0]?.lon);
    if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng };
  } catch {
    // Fall through to the backup lookup.
  }

  const query = new URLSearchParams({ q: `${city}, ${state}, India`, limit: '1' });
  const data = (await readJson(`https://photon.komoot.io/api/?${query.toString()}`)) as {
    features?: PhotonFeature[];
  };
  const coords = data.features?.[0]?.geometry?.coordinates;
  const lng = Number(coords?.[0]);
  const lat = Number(coords?.[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export async function checkPinInsideCity(
  pin: MapPin,
  city: string,
  state: string,
): Promise<PinCityCheck> {
  try {
    const query = new URLSearchParams({
      format: 'jsonv2',
      addressdetails: '1',
      lat: String(pin.lat),
      lon: String(pin.lng),
    });
    const data = (await readJson(
      `https://nominatim.openstreetmap.org/reverse?${query.toString()}`,
    )) as { address?: NominatimAddress };
    return pinMatchesSelectedCity(data.address ?? {}, city, state);
  } catch {
    try {
      const query = new URLSearchParams({ lat: String(pin.lat), lon: String(pin.lng) });
      const data = (await readJson(`https://photon.komoot.io/reverse?${query.toString()}`)) as {
        features?: PhotonFeature[];
      };
      return pinMatchesSelectedCity(featureAddress(data.features?.[0]), city, state);
    } catch {
      return {
        ok: false,
        message: 'Could not check this pin. Try again, or clear it to register without a map location.',
      };
    }
  }
}

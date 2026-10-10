export type ResolvedMapAddress = {
  city: string | null;
  state: string | null;
  country: string | null;
  label: string | null;
};

export type ManualAddress = {
  city?: string | null;
  state?: string | null;
  country?: string | null;
};

function normalizeLocationText(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\./g, '')
    .replace(/\s+/g, ' ');
}

const COUNTRY_ALIASES: Record<string, string[]> = {
  india: ['in', 'bharat', 'republic of india'],
  'united states': ['us', 'usa', 'united states of america', 'u s a', 'u s'],
  'united kingdom': ['uk', 'u k', 'great britain', 'england'],
};

/** Geocoders often return a city's official or older name instead of the one merchants pick. */
const CITY_ALIASES: Record<string, string[]> = {
  mohali: ['sahibzada ajit singh nagar', 'sas nagar', 'ajitgarh'],
  bengaluru: ['bangalore'],
  mumbai: ['bombay'],
  kolkata: ['calcutta'],
  chennai: ['madras'],
  thiruvananthapuram: ['trivandrum'],
  puducherry: ['pondicherry'],
  vadodara: ['baroda'],
  kochi: ['cochin', 'ernakulam'],
  kozhikode: ['calicut'],
  varanasi: ['banaras', 'benares'],
  prayagraj: ['allahabad'],
  gurugram: ['gurgaon'],
  mysuru: ['mysore'],
  mangaluru: ['mangalore'],
  belagavi: ['belgaum'],
  kalaburagi: ['gulbarga'],
  'chhatrapati sambhajinagar': ['aurangabad'],
  dharashiv: ['osmanabad'],
  ahilyanagar: ['ahmednagar'],
  odisha: ['orissa'],
  uttarakhand: ['uttaranchal'],
};

function aliasVariants(value: string, table: Record<string, string[]>): string[] {
  const variants = new Set<string>([value]);
  for (const [canonical, aliases] of Object.entries(table)) {
    if (value === canonical || aliases.includes(value)) {
      variants.add(canonical);
      aliases.forEach((alias) => variants.add(alias));
    }
  }
  return [...variants];
}

function countryVariants(value: string): string[] {
  return aliasVariants(normalizeLocationText(value), COUNTRY_ALIASES);
}

export function locationTokensMatch(a: string, b: string): boolean {
  const left = normalizeLocationText(a);
  const right = normalizeLocationText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftCities = aliasVariants(left, CITY_ALIASES);
  const rightCities = aliasVariants(right, CITY_ALIASES);
  if (leftCities.some((item) => rightCities.includes(item))) return true;

  const leftCountries = countryVariants(left);
  const rightCountries = countryVariants(right);
  return leftCountries.some((item) => rightCountries.includes(item));
}

export function formatResolvedAddressLabel(resolved: ResolvedMapAddress): string {
  return [resolved.city, resolved.state, resolved.country].filter(Boolean).join(', ');
}

export function hasResolvedMapAddress(resolved: ResolvedMapAddress): boolean {
  return Boolean(resolved.city || resolved.state || resolved.country);
}

export function applyResolvedAddressToManual(
  manual: ManualAddress,
  resolved: ResolvedMapAddress,
): { city: string; state: string; country: string } {
  return {
    city: manual.city?.trim() || resolved.city || '',
    state: manual.state?.trim() || resolved.state || '',
    country: manual.country?.trim() || resolved.country || '',
  };
}

export function mapPinMatchesManualAddress(
  resolved: ResolvedMapAddress,
  manual: ManualAddress,
): { ok: true } | { ok: false; error: string; resolvedLabel?: string } {
  const manualCity = manual.city?.trim() ?? '';
  const manualState = manual.state?.trim() ?? '';
  const manualCountry = manual.country?.trim() ?? '';

  const resolvedLabel = formatResolvedAddressLabel(resolved);
  const hasManualLocation = Boolean(manualCity || manualState || manualCountry);

  if (!hasManualLocation) {
    return { ok: true };
  }

  if (!resolved.city && !resolved.state && !resolved.country) {
    return {
      ok: false,
      error:
        'We could not read city/state from this map pin. Check the link or confirm your Google Maps API key is configured.',
      resolvedLabel,
    };
  }

  if (manualCountry && resolved.country && !locationTokensMatch(manualCountry, resolved.country)) {
    return {
      ok: false,
      error: `This map pin is in ${resolved.country}, but your address says ${manualCountry}. Use a pin in the same country.`,
      resolvedLabel,
    };
  }

  if (manualCity && resolved.city && !locationTokensMatch(manualCity, resolved.city)) {
    return {
      ok: false,
      error: `This map pin looks like ${resolved.city}, but your city is ${manualCity}. Drop the pin on your actual business location.`,
      resolvedLabel,
    };
  }

  if (manualState && resolved.state && !locationTokensMatch(manualState, resolved.state)) {
    return {
      ok: false,
      error: `This map pin is in ${resolved.state}, but your state is ${manualState}. The pin should match your written address.`,
      resolvedLabel,
    };
  }

  return { ok: true };
}

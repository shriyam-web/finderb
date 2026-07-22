export const MIN_ADDRESS_LINE1_LENGTH = 5;

export function combineBusinessAddress(line1: string, line2?: string | null): string {
  return [line1.trim(), line2?.trim() ?? ''].filter(Boolean).join(', ');
}

export function validateAddressLine1(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return 'Please enter address line 1.';
  if (trimmed.length < MIN_ADDRESS_LINE1_LENGTH) {
    return `Address line 1 must be at least ${MIN_ADDRESS_LINE1_LENGTH} characters.`;
  }
  return null;
}

export function validateRegistrationAddressLines(line1: string, _line2?: string): string | null {
  return validateAddressLine1(line1);
}

function normalizePlaceToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function looksLikePincode(value: string): boolean {
  return /^\d{5,6}$/.test(value.trim());
}

/**
 * Card/list label: locality + city (not city + state).
 * Prefer a neighborhood/area from the street address when available.
 */
export function formatLocalityCityLabel(business: {
  city?: string | null;
  state?: string | null;
  location?: string | null;
  businessAddress?: string | null;
}): string {
  const city = business.city?.trim() || '';
  const state = business.state?.trim() || '';
  const storedLocation = business.location?.trim() || '';
  const address = business.businessAddress?.trim() || '';

  const skip = new Set(
    [city, state, 'india']
      .filter(Boolean)
      .map((part) => normalizePlaceToken(part))
  );

  let locality = '';
  if (address) {
    const parts = address
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => !looksLikePincode(part))
      .filter((part) => !skip.has(normalizePlaceToken(part)));

    // Prefer the last remaining segment (usually area / locality).
    locality = parts[parts.length - 1] || '';
  }

  // If location is already "Locality, City" (not bare "City, State"), reuse locality.
  if (!locality && storedLocation) {
    const parts = storedLocation
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    const isCityStateOnly =
      parts.length === 2 &&
      Boolean(city) &&
      Boolean(state) &&
      normalizePlaceToken(parts[0]) === normalizePlaceToken(city) &&
      normalizePlaceToken(parts[1]) === normalizePlaceToken(state);

    if (!isCityStateOnly && parts.length >= 2) {
      const maybeLocality = parts[0];
      const maybeCity = parts[parts.length - 1];
      if (
        city &&
        normalizePlaceToken(maybeCity) === normalizePlaceToken(city) &&
        !skip.has(normalizePlaceToken(maybeLocality))
      ) {
        locality = maybeLocality;
      } else if (!city && parts.length >= 2) {
        return `${maybeLocality}, ${maybeCity}`;
      }
    }
  }

  if (locality && city) {
    if (normalizePlaceToken(locality) === normalizePlaceToken(city)) return city;
    return `${locality}, ${city}`;
  }
  if (locality) return locality;
  if (city) return city;
  if (storedLocation) {
    // Last resort: strip trailing state when location is "City, State".
    const parts = storedLocation
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
    if (
      parts.length === 2 &&
      state &&
      normalizePlaceToken(parts[1]) === normalizePlaceToken(state)
    ) {
      return parts[0];
    }
    return storedLocation;
  }
  return '';
}

import type { Business } from '@/lib/mockData';
import { categoryHref } from '@/lib/categoryDisplay';

type BusinessLocationFields = Pick<Business, 'city' | 'state' | 'location' | 'businessAddress'>;

function normalizePart(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function truncateLabel(value: string, maxLength = 72): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function isDuplicateLocationPart(part: string, city: string | null, state: string | null): boolean {
  const lower = part.toLowerCase();
  if (city && lower === city.toLowerCase()) return true;
  if (state && lower === state.toLowerCase()) return true;
  if (/^\d{5,6}$/.test(part)) return true;
  return false;
}

function extractAreaFromLocation(
  location: string,
  city: string | null,
  state: string | null
): string | null {
  const cityState = [city, state].filter(Boolean).join(', ');
  if (cityState && location.toLowerCase() === cityState.toLowerCase()) return null;
  if (city && location.toLowerCase() === city.toLowerCase()) return null;

  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2 && city) {
    const cityIndex = parts.findIndex((part) => part.toLowerCase() === city.toLowerCase());
    if (cityIndex > 0) {
      const area = parts.slice(0, cityIndex).join(', ');
      return area || null;
    }
  }

  if (parts.length === 1 && city && parts[0].toLowerCase() !== city.toLowerCase()) {
    return parts[0];
  }

  if (parts.length >= 2) {
    const area = parts.slice(0, -1).join(', ');
    if (area && !isDuplicateLocationPart(area, city, state)) return area;
  }

  return null;
}

function extractAreaFromAddress(
  address: string,
  city: string | null,
  state: string | null
): string | null {
  const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length === 0) return null;

  if (city) {
    const cityIndex = parts.findIndex((part) => part.toLowerCase() === city.toLowerCase());
    if (cityIndex > 0) {
      const beforeCity = parts.slice(0, cityIndex).filter((part) => !isDuplicateLocationPart(part, city, state));
      if (beforeCity.length === 0) return null;

      if (beforeCity.length === 1) return beforeCity[0];

      const subarea = beforeCity[beforeCity.length - 1];
      const landmark = beforeCity[beforeCity.length - 2];
      if (landmark && subarea) {
        return `${landmark}, ${subarea}`;
      }

      return subarea;
    }
  }

  if (parts.length >= 2) {
    const leading = parts.slice(0, 2).filter((part) => !isDuplicateLocationPart(part, city, state));
    if (leading.length > 0) {
      return leading.join(', ');
    }
  }

  const first = parts[0];
  if (first && !isDuplicateLocationPart(first, city, state)) {
    return first;
  }

  return null;
}

function getBusinessAreaLabel(business: BusinessLocationFields): string | null {
  const city = normalizePart(business.city);
  const state = normalizePart(business.state);
  const location = normalizePart(business.location);
  const address = normalizePart(business.businessAddress);

  const fromLocation = location ? extractAreaFromLocation(location, city, state) : null;
  if (fromLocation) return truncateLabel(fromLocation, 56);

  const fromAddress = address ? extractAreaFromAddress(address, city, state) : null;
  if (fromAddress) return truncateLabel(fromAddress, 56);

  return null;
}

export function getBusinessLocationLabel(business: BusinessLocationFields): string | null {
  const city = normalizePart(business.city);
  const state = normalizePart(business.state);
  const area = getBusinessAreaLabel(business);

  if (city) {
    const cityState = state ? `${city}, ${state}` : city;
    return area ? `${area}, ${cityState}` : cityState;
  }

  const location = normalizePart(business.location);
  if (location) {
    const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return truncateLabel(location);
    }

    return truncateLabel(location, 48);
  }

  const address = normalizePart(business.businessAddress);
  if (address) {
    return truncateLabel(address, 48);
  }

  return null;
}

export function buildCategoryBreadcrumbHref(categoryName: string, categorySlug?: string | null): string {
  const name = categoryName.trim();
  if (!name) return '/categories';
  if (categorySlug) return categoryHref(categorySlug, name);
  return `/categories?search=${encodeURIComponent(name)}`;
}

export function buildLocationBreadcrumbHref(categoryName: string, locationLabel: string): string {
  const category = categoryName.trim();
  const location = locationLabel.trim();
  if (!location) return buildCategoryBreadcrumbHref(category);
  const query = category ? `${category} in ${location}` : location;
  return `/categories?search=${encodeURIComponent(query)}`;
}

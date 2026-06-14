import { parseNaturalSearchQuery, normalizeSearchQuery } from '@/lib/searchMatch';

const INVALID_LOCATIONS = new Set(['near you', 'detecting…', 'detecting...', '']);

/** Append hero/search location when the query does not already include one. */
export function appendLocationToSearchQuery(query: string, location: string | null | undefined): string {
  const trimmed = query.trim();
  if (!trimmed) return trimmed;

  const loc = location?.trim();
  if (!loc || INVALID_LOCATIONS.has(loc.toLowerCase())) {
    return trimmed;
  }

  const parsed = parseNaturalSearchQuery(trimmed);
  if (parsed.locationHint) {
    return trimmed;
  }

  const normalizedQuery = normalizeSearchQuery(trimmed);
  const locParts = loc
    .split(',')
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);

  if (locParts.some((part) => normalizedQuery.includes(part))) {
    return trimmed;
  }

  return `${trimmed} in ${loc}`;
}

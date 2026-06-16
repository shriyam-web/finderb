import rawCitiesByState from '@/lib/data/indianCitiesByState.json';

export type CitiesByState = {
  state: string;
  cities: readonly string[];
};

/** States shown first in the location picker (highest traffic / search interest). */
const POPULAR_STATE_ORDER = [
  'Uttar Pradesh',
  'Delhi',
  'Madhya Pradesh',
  'Uttarakhand',
  'Maharashtra',
  'Karnataka',
  'Telangana',
  'Tamil Nadu',
  'Gujarat',
  'West Bengal',
  'Rajasthan',
  'Punjab',
  'Haryana',
  'Bihar',
  'Kerala',
  'Andhra Pradesh',
  'Jharkhand',
  'Chhattisgarh',
  'Odisha',
  'Assam',
  'Himachal Pradesh',
  'Jammu and Kashmir',
  'Goa',
  'Chandigarh',
  'Puducherry',
  'Ladakh',
] as const;

function normalizeStateName(value: string): string {
  return value.trim().toLowerCase();
}

function getStatePopularityRank(state: string): number {
  const key = normalizeStateName(state);
  const index = POPULAR_STATE_ORDER.findIndex(
    (popular) => normalizeStateName(popular) === key
  );
  return index === -1 ? POPULAR_STATE_ORDER.length : index;
}

export function sortStatesByPopularity(groups: readonly CitiesByState[]): CitiesByState[] {
  return [...groups].sort((a, b) => {
    const rankDiff = getStatePopularityRank(a.state) - getStatePopularityRank(b.state);
    if (rankDiff !== 0) return rankDiff;
    return a.state.localeCompare(b.state, 'en', { sensitivity: 'base' });
  });
}

/**
 * All Indian states & union territories with every district (administrative city/town).
 * Sourced from official state–district lists, merged for completeness (~865 locations).
 */
export const HERO_CITIES_BY_STATE: readonly CitiesByState[] = sortStatesByPopularity(
  rawCitiesByState as CitiesByState[]
);

/** Flat list of every picker city (deduplicated). */
export const HERO_POPULAR_CITIES = [
  ...new Set(HERO_CITIES_BY_STATE.flatMap((group) => group.cities)),
] as const;

function normalizeCity(value: string): string {
  return value.trim().toLowerCase();
}

export function isHeroCitySelected(
  effectiveSearchLocation: string | null | undefined,
  city: string
): boolean {
  if (!effectiveSearchLocation) return false;
  const location = normalizeCity(effectiveSearchLocation);
  const target = normalizeCity(city);
  if (location === target) return true;
  if (location.endsWith(`, ${target}`)) return true;
  if (location.startsWith(`${target},`)) return true;
  return location.split(',').some((part) => part.trim() === target);
}

export function filterCitiesByState(
  groups: readonly CitiesByState[],
  query: string
): CitiesByState[] {
  const q = normalizeCity(query);
  if (!q) return sortStatesByPopularity(groups).map((group) => ({ state: group.state, cities: [...group.cities] }));

  const results: CitiesByState[] = [];

  for (const group of groups) {
    const stateMatches = normalizeCity(group.state).includes(q);
    const cities = group.cities.filter(
      (city) => stateMatches || normalizeCity(city).includes(q)
    );
    if (cities.length > 0) {
      results.push({ state: group.state, cities });
    }
  }

  return sortStatesByPopularity(results);
}

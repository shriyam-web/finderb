import rawCitiesByState from './data/indiaPlaces.json';
import { compareText } from './compareText';

type StateCities = {
  state: string;
  cities: string[];
};

export type CityEntry = {
  city: string;
  state: string;
};

const GROUPS = rawCitiesByState as StateCities[];

export const INDIAN_STATES = GROUPS.map((group) => group.state).sort(compareText);

const CITIES_BY_STATE = new Map(
  GROUPS.map((group) => [group.state.toLowerCase(), [...group.cities].sort(compareText)]),
);

export function citiesInState(state: string): string[] {
  return CITIES_BY_STATE.get(state.trim().toLowerCase()) ?? [];
}

let searchIndex: { entry: CityEntry; key: string }[] | null = null;

function getSearchIndex() {
  if (!searchIndex) {
    searchIndex = [];
    for (const state of INDIAN_STATES) {
      for (const city of citiesInState(state)) {
        searchIndex.push({ entry: { city, state }, key: city.toLowerCase() });
      }
    }
  }
  return searchIndex;
}

/** First known state for a city name, for labelling popular picks. */
export function stateForCity(city: string): string | null {
  const key = city.trim().toLowerCase();
  return getSearchIndex().find((item) => item.key === key)?.entry.state ?? null;
}

/**
 * Cities whose name matches the query: exact, then prefix, then word prefix,
 * then anywhere in the name.
 */
export function searchIndianCities(query: string, state?: string | null, limit = 60): CityEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const stateKey = state?.trim().toLowerCase() || null;
  const buckets: CityEntry[][] = [[], [], [], []];
  for (const { entry, key } of getSearchIndex()) {
    if (stateKey && entry.state.toLowerCase() !== stateKey) continue;
    if (key === q) buckets[0].push(entry);
    else if (key.startsWith(q)) buckets[1].push(entry);
    else if (key.includes(` ${q}`)) buckets[2].push(entry);
    else if (key.includes(q)) buckets[3].push(entry);
  }
  return buckets.flat().slice(0, limit);
}

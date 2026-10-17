const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'for',
  'with',
  'to',
  'at',
  'on',
  'of',
  'near',
  'me',
  'my',
  'your',
  'find',
  'get',
  'show',
  'best',
  'top',
  'good',
  'open',
  'verified',
  'trusted',
  'popular',
  'cheap',
  'budget',
  'affordable',
  'nearest',
  'closest',
  'emergency',
  'urgent',
  'offer',
  'offers',
  'discount',
  'discounts',
  'deal',
  'deals',
  'rated',
  'rating',
  'review',
  'reviews',
  'nearby',
  'around',
  'close',
  'local',
  'please',
  'want',
  'need',
  'looking',
  'search',
  'from',
  'by',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'some',
  'any',
  'where',
  'can',
  'you',
  'i',
  'we',
  'us',
]);

/** Low-specificity words — weak alone; "Courier service" must not beat "Car hire". */
const GENERIC_SEARCH_TERMS = new Set([
  'service',
  'services',
  'rental',
  'rentals',
  'hire',
  'shop',
  'store',
  'company',
  'provider',
  'center',
  'centre',
  'business',
  'agency',
  'office',
  'dealer',
  'supply',
  'supplies',
  'repair',
  'repairs',
  'care',
]);

export type ParsedSearchQuery = {
  raw: string;
  terms: string[];
  locationHint: string | null;
};

export type SearchMatchFields = {
  name?: string | null;
  category?: string | null;
  description?: string | null;
  slug?: string | null;
  parentName?: string | null;
};

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

export const MAX_SEARCH_QUERY_LENGTH = 200;

export function parseNaturalSearchQuery(query: string): ParsedSearchQuery {
  const raw = query.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
  if (!raw) {
    return { raw: '', terms: [], locationHint: null };
  }

  let text = raw.toLowerCase();
  text = text.replace(/\b(near|around|close to)\s+me\b/g, ' ').trim();

  let locationHint: string | null = null;
  const inAtMatch = text.match(/\b(?:in|at|near)\s+(.+)$/i);
  if (inAtMatch) {
    const loc = inAtMatch[1].trim().replace(/\s+/g, ' ');
    if (loc && loc !== 'me' && !STOP_WORDS.has(loc)) {
      locationHint = loc;
      text = text.slice(0, inAtMatch.index).trim();
    }
  }

  const terms = [...new Set(
    text
      .split(/[\s,]+/)
      .map((w) => w.replace(/[^\w-]/g, ''))
      .filter((w) => w.length >= 2 && !STOP_WORDS.has(w))
  )];

  if (terms.length === 0) {
    const fallback = raw
      .toLowerCase()
      .split(/[\s,]+/)
      .map((w) => w.replace(/[^\w-]/g, ''))
      .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
    return { raw, terms: [...new Set(fallback)], locationHint };
  }

  return { raw, terms, locationHint };
}

export function getPrimarySearchTerm(query: string): string | null {
  const { terms } = parseNaturalSearchQuery(query);
  return terms[0] ?? null;
}

function singularize(term: string): string {
  if (term.length > 3 && term.endsWith('ies')) return term.slice(0, -3) + 'y';
  if (term.length > 3 && term.endsWith('es')) return term.slice(0, -2);
  if (term.length > 2 && term.endsWith('s')) return term.slice(0, -1);
  return term;
}

function termVariants(term: string): string[] {
  const base = normalizeSearchQuery(term);
  const singular = singularize(base);
  const variants = new Set([base, singular, `${singular}s`, `${singular}es`]);
  return [...variants].filter((v) => v.length >= 2);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (Math.abs(left.length - right.length) > 2) return 3;
  const prev = Array.from({ length: right.length + 1 }, (_, index) => index);
  const next = new Array<number>(right.length + 1);
  for (let row = 1; row <= left.length; row += 1) {
    next[0] = row;
    for (let col = 1; col <= right.length; col += 1) {
      const cost = left[row - 1] === right[col - 1] ? 0 : 1;
      next[col] = Math.min(next[col - 1] + 1, prev[col] + 1, prev[col - 1] + cost);
    }
    for (let col = 0; col <= right.length; col += 1) prev[col] = next[col];
  }
  return prev[right.length];
}

function closeToken(queryToken: string, nameToken: string, allowShortPrefix: boolean): boolean {
  if (queryToken === nameToken) return true;
  if (allowShortPrefix && queryToken.length >= 2 && nameToken.startsWith(queryToken)) return true;
  if (queryToken.length >= 4 && nameToken.startsWith(queryToken)) return true;
  const allowed = queryToken.length >= 8 ? 2 : queryToken.length >= 4 ? 1 : 0;
  return allowed > 0 && editDistance(queryToken, nameToken) <= allowed;
}

/** Partial names, unfinished words, and small typos. 0 means not this business. */
export function businessNameSuggestionScore(name: string, rawQuery: string): number {
  const query = normalizeSearchQuery(rawQuery).replace(/\s+/g, ' ');
  const hay = normalizeSearchQuery(name).replace(/\s+/g, ' ');
  if (!query || !hay) return 0;
  if (hay === query) return 100;
  const queryHasWordBoundary = query.includes(' ');
  if (
    (queryHasWordBoundary && hay.startsWith(query)) ||
    (!queryHasWordBoundary && query.length >= 4 && hay.startsWith(`${query} `))
  ) {
    return 92;
  }
  const queryTokens = query.split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
  const nameTokens = hay.split(/[^a-z0-9]+/).filter((token) => token.length >= 2);
  if (!queryTokens.length || !nameTokens.length) return 0;
  if (queryTokens.length === 1 && queryTokens[0].length < 4) return 0;
  if (queryTokens.every((token) => STOP_WORDS.has(token))) return 0;
  const used = new Set<number>();
  let fuzzy = 0;
  for (let index = 0; index < queryTokens.length; index += 1) {
    const term = queryTokens[index];
    const last = index === queryTokens.length - 1;
    let match = -1;
    for (let nameIndex = 0; nameIndex < nameTokens.length; nameIndex += 1) {
      if (used.has(nameIndex)) continue;
      if (!closeToken(term, nameTokens[nameIndex], last && queryTokens.length > 1)) continue;
      match = nameIndex;
      if (term !== nameTokens[nameIndex]) fuzzy += 1;
      break;
    }
    if (match < 0) return 0;
    used.add(match);
  }
  return Math.max(64, 86 - fuzzy * 6);
}

export function textMatchesSearchTerm(
  text: string | null | undefined,
  term: string
): boolean {
  if (!term) return true;
  if (!text) return false;
  const hay = normalizeSearchQuery(text);
  return termVariants(term).some((v) => hay.includes(v));
}

export function textMatchesSearchTerms(
  text: string | null | undefined,
  terms: string[]
): boolean {
  if (terms.length === 0) return true;
  if (!text) return false;
  return terms.some((term) => textMatchesSearchTerm(text, term));
}

export function textMatchesSearch(
  text: string | null | undefined,
  query: string
): boolean {
  const needle = normalizeSearchQuery(query);
  if (!needle) return true;
  if (!text) return false;
  const parsed = parseNaturalSearchQuery(query);
  if (parsed.terms.length > 0) {
    return textMatchesSearchTerms(text, parsed.terms);
  }
  return normalizeSearchQuery(text).includes(needle);
}

function scoreFieldAgainstQuery(
  text: string | null | undefined,
  parsed: ParsedSearchQuery,
  fieldMultiplier: number
): number {
  if (!text) return 0;
  const hay = normalizeSearchQuery(text);
  const terms = parsed.terms;
  if (terms.length === 0) {
    return hay.includes(normalizeSearchQuery(parsed.raw)) ? 10 * fieldMultiplier : 0;
  }

  const primary = terms[0];
  const hasPrimary = textMatchesSearchTerm(text, primary);

  if (!hasPrimary) {
    if (terms.length === 1) return 0;
    let weak = 0;
    for (let i = 1; i < terms.length; i++) {
      const term = terms[i];
      if (!textMatchesSearchTerm(text, term)) continue;
      weak += GENERIC_SEARCH_TERMS.has(term) ? 4 : 14;
    }
    return weak > 0 ? weak * fieldMultiplier * 0.4 : 0;
  }

  let score = 50;

  for (const variant of termVariants(primary)) {
    if (hay.startsWith(variant)) {
      score += 25;
      break;
    }
    if (new RegExp(`\\b${escapeRegExp(variant)}`, 'i').test(hay)) {
      score += 15;
      break;
    }
  }

  const phrase = terms.join(' ');
  if (phrase.length > 2 && hay.includes(phrase)) {
    score += 35;
  }

  let matchedNonGeneric = 1;
  for (let i = 1; i < terms.length; i++) {
    const term = terms[i];
    if (!textMatchesSearchTerm(text, term)) continue;
    matchedNonGeneric += 1;
    score += GENERIC_SEARCH_TERMS.has(term) ? 4 : 18;
  }

  if (terms.length > 1 && matchedNonGeneric === terms.length) {
    score += 20;
  } else if (terms.length > 1) {
    return 12 * fieldMultiplier;
  }

  if (hay === normalizeSearchQuery(parsed.raw)) {
    score += 30;
  }

  return score * fieldMultiplier;
}

/** Scores at or above this are shown as top matches; below = related results. */
export const STRONG_SEARCH_RELEVANCE_MIN = 32;

/** Higher = more relevant. */
export function scoreSearchRelevance(
  query: string,
  fields: SearchMatchFields
): number {
  const parsed = parseNaturalSearchQuery(query);
  const scores = [
    scoreFieldAgainstQuery(fields.name, parsed, 1.5),
    scoreFieldAgainstQuery(fields.category, parsed, 1.25),
    scoreFieldAgainstQuery(fields.slug, parsed, 1.1),
    scoreFieldAgainstQuery(fields.parentName, parsed, 0.9),
    scoreFieldAgainstQuery(fields.description, parsed, 0.5),
  ];

  return Math.max(...scores, 0);
}

export function sortBySearchRelevance<T>(
  items: T[],
  query: string,
  getFields: (item: T) => SearchMatchFields
): T[] {
  return [...items].sort(
    (a, b) => scoreSearchRelevance(query, getFields(b)) - scoreSearchRelevance(query, getFields(a))
  );
}

export function partitionBySearchRelevance<T>(
  items: T[],
  query: string,
  getFields: (item: T) => SearchMatchFields
): { best: T[]; related: T[] } {
  const sorted = sortBySearchRelevance(items, query, getFields);
  const best: T[] = [];
  const related: T[] = [];

  const parsed = parseNaturalSearchQuery(query);
  for (const item of sorted) {
    if (parsed.terms.length > 1) {
      const fields = getFields(item);
      const identity = [fields.name, fields.category, fields.slug, fields.parentName]
        .filter((value) => value != null)
        .join(' ');
      const everyTerm = parsed.terms.every((term) => textMatchesSearchTerm(identity, term));
      const nameScore = businessNameSuggestionScore(String(fields.name || ''), query);
      if (!everyTerm && nameScore < 64) continue;
    }
    const score = scoreSearchRelevance(query, getFields(item));
    if (score <= 0) continue;
    if (score >= STRONG_SEARCH_RELEVANCE_MIN) {
      best.push(item);
    } else {
      related.push(item);
    }
  }

  return { best, related };
}

export function businessMatchesNaturalSearch(
  biz: {
    name?: string | null;
    category?: string | null;
    description?: string | null;
    location?: string | null;
    city?: string | null;
    state?: string | null;
  },
  query: string
): boolean {
  const parsed = parseNaturalSearchQuery(query);
  const fields: SearchMatchFields = {
    name: biz.name,
    category: biz.category,
    description: biz.description,
  };

  const terms =
    parsed.terms.length > 0
      ? parsed.terms
      : [normalizeSearchQuery(parsed.raw)].filter((t) => t.length >= 2);

  if (terms.length === 0) return false;

  const identity = [biz.name, biz.category].filter((value) => value != null).join(' ');
  const nameScore = businessNameSuggestionScore(String(biz.name || ''), query);
  if (nameScore < 64 && !terms.every((term) => textMatchesSearchTerm(identity, term))) {
    return false;
  }

  if (parsed.locationHint) {
    const locFields = [biz.location, biz.city, biz.state];
    const locBlob = locFields
      .filter((f) => f != null)
      .map((f) => normalizeSearchQuery(String(f)))
      .join(' ');
    const hintParts = parsed.locationHint
      .split(',')
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean);
    if (hintParts.length === 0) return true;
    return hintParts.some((part) => locBlob.includes(part));
  }

  return true;
}

export function getSearchTermsForQuery(query: string): string[] {
  const parsed = parseNaturalSearchQuery(query);
  if (parsed.terms.length > 0) return parsed.terms;
  const single = normalizeSearchQuery(parsed.raw);
  return single.length >= 2 ? [single] : [];
}

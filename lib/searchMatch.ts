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

export function parseNaturalSearchQuery(query: string): ParsedSearchQuery {
  const raw = query.trim();
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

  for (const item of sorted) {
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

function fieldsMatchAnyTerm(fields: SearchMatchFields, terms: string[]): boolean {
  const values = [fields.name, fields.category, fields.description, fields.slug, fields.parentName];
  return terms.some((term) =>
    values.some((f) => textMatchesSearchTerm(f != null ? String(f) : '', term))
  );
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

  if (!fieldsMatchAnyTerm(fields, terms)) {
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

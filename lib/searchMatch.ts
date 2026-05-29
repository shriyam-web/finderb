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

export type ParsedSearchQuery = {
  raw: string;
  /** Meaningful words to match against names/categories (e.g. "schools" from "schools near me"). */
  terms: string[];
  /** City/area from phrases like "in delhi" or "at lucknow". */
  locationHint: string | null;
};

export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

export function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, '\\$&');
}

/**
 * Turn natural queries into search terms + optional location.
 * "Schools near me" → terms: ["schools"]
 * "hospital in delhi" → terms: ["hospital"], location: "delhi"
 */
export function parseNaturalSearchQuery(query: string): ParsedSearchQuery {
  const raw = query.trim();
  if (!raw) {
    return { raw: '', terms: [], locationHint: null };
  }

  let text = raw.toLowerCase();

  text = text.replace(/\b(near|around|close to)\s+me\b/g, ' ').trim();

  let locationHint: string | null = null;
  const inAtMatch = text.match(/\b(?:in|at)\s+([a-z][a-z\s-]{1,40})\s*$/i);
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

/** One keyword vs one field (handles school/schools). */
export function textMatchesSearchTerm(
  text: string | null | undefined,
  term: string
): boolean {
  if (!term) return true;
  if (!text) return false;
  const hay = normalizeSearchQuery(text);
  return termVariants(term).some((v) => hay.includes(v));
}

/** Any extracted term matches the field. */
export function textMatchesSearchTerms(
  text: string | null | undefined,
  terms: string[]
): boolean {
  if (terms.length === 0) return true;
  if (!text) return false;
  return terms.some((term) => textMatchesSearchTerm(text, term));
}

/** Case-insensitive partial match on full query string. */
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
  const fields = [biz.name, biz.category, biz.description, biz.location, biz.city, biz.state];

  const terms =
    parsed.terms.length > 0
      ? parsed.terms
      : [normalizeSearchQuery(parsed.raw)].filter((t) => t.length >= 2);

  if (terms.length === 0) return false;

  const termMatch = terms.some((term) =>
    fields.some((field) => textMatchesSearchTerm(field != null ? String(field) : '', term))
  );
  if (!termMatch) return false;

  if (parsed.locationHint) {
    const locBlob = fields
      .filter((f) => f != null)
      .map((f) => normalizeSearchQuery(String(f)))
      .join(' ');
    return locBlob.includes(parsed.locationHint);
  }

  return true;
}

/** Terms to use for DB ilike / client filters. */
export function getSearchTermsForQuery(query: string): string[] {
  const parsed = parseNaturalSearchQuery(query);
  if (parsed.terms.length > 0) return parsed.terms;
  const single = normalizeSearchQuery(parsed.raw);
  return single.length >= 2 ? [single] : [];
}

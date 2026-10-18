/**
 * Pure search ranking for FinderB.
 * Exact category and name matches stay in their own tier.
 * Synonyms and loose text never outrank them.
 */

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'from',
  'that',
  'this',
  'some',
  'any',
  'near',
  'area',
  'local',
  'india',
  'me',
  'my',
  'your',
  'a',
  'an',
  'of',
  'to',
  'in',
  'on',
  'at',
]);

/** Words that must not widen a more specific query into half the catalog. */
/**
 * Words that choose a filter (open now, top rated, verified) and must not be
 * required inside the business name. Dropped only when a real subject remains.
 */
const QUERY_FILTER_WORDS = new Set([
  'open',
  'best',
  'top',
  'popular',
  'good',
  'cheap',
  'budget',
  'affordable',
  'verified',
  'trusted',
  'nearby',
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
]);

const LOOSE_TERMS = new Set([
  'service',
  'services',
  'shop',
  'store',
  'centre',
  'center',
  'repair',
  'repairs',
  'care',
  'class',
  'classes',
  'agency',
  'company',
  'provider',
  'business',
  'place',
  'places',
  'dealer',
  'supplier',
  'supplies',
]);

/**
 * Used only after an exact category and an exact name miss.
 * These are suggestions, never mixed into a real match.
 */
/** Same intent, different word. Fitness is not a gym. Music is not a singer. */
const EQUIVALENT_TERMS: Record<string, string[]> = {
  dentist: ['dental', 'dentistry'],
  dental: ['dentist', 'dentistry'],
  dentistry: ['dental', 'dentist'],
  doctor: ['physician'],
  physician: ['doctor'],
  lawyer: ['advocate', 'attorney'],
  advocate: ['lawyer', 'attorney'],
  attorney: ['lawyer', 'advocate'],
  ca: ['accountant'],
  accountant: ['ca'],
  pharmacy: ['chemist'],
  chemist: ['pharmacy'],
  salon: ['parlour', 'parlor'],
  parlour: ['salon'],
  parlor: ['salon'],
};

const RELATED_TERMS: Record<string, string[]> = {
  singer: ['music', 'entertainment', 'dj', 'band', 'event'],
  musician: ['music', 'band', 'dj'],
  dj: ['music', 'event', 'band'],
  band: ['music', 'entertainment'],
  gym: ['fitness'],
  yoga: ['fitness'],
  fitness: ['gym'],
  dentist: ['dental'],
  dental: ['dentist'],
  doctor: ['clinic'],
  clinic: ['doctor'],
  plumber: ['plumbing'],
  electrician: ['electrical'],
  lawyer: ['advocate', 'legal'],
  advocate: ['lawyer'],
  pharmacy: ['chemist'],
  chemist: ['pharmacy'],
  hotel: ['resort', 'lodge'],
  salon: ['beauty', 'spa'],
  spa: ['salon', 'beauty'],
  mechanic: ['garage'],
  garage: ['mechanic'],
  tuition: ['coaching', 'tutor'],
  coaching: ['tuition'],
  tutor: ['tuition', 'coaching'],
  accountant: ['tax'],
  ca: ['accountant', 'tax'],
  sweet: ['mithai'],
  mithai: ['sweet'],
};

export type RankableMerchant = {
  name: string;
  category: string;
  services?: string[];
  keywords?: string[];
  about?: string | null;
};

export type DirectoryQuery = {
  phrase: string;
  terms: string[];
  required: string[];
  /** Phrase, plus a plural, for the first precise lookup. */
  primaryNeedles: string[];
};

export function singularizeSearchTerm(term: string): string {
  const value = term.toLowerCase();
  if (value.length > 4 && value.endsWith('ies')) return `${value.slice(0, -3)}y`;
  if (value.length > 4 && value.endsWith('es') && !value.endsWith('ss')) {
    return value.slice(0, -2);
  }
  if (value.length > 3 && value.endsWith('s') && !value.endsWith('ss')) {
    return value.slice(0, -1);
  }
  return value;
}

export function searchDisplayLabel(raw: string): string {
  const cleaned = raw
    .replace(
      /\b(near me|nearby|around me|closest to me|in my area|around here)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || raw.trim();
}

export type SpokenSearchIntent =
  | 'open-now'
  | 'top-rated'
  | 'verified'
  | 'nearest'
  | 'offers'
  | 'budget';

/** Turns the words in a search into the filters that should turn on. */
export function detectSearchIntents(raw: string): SpokenSearchIntent[] {
  const text = raw.toLowerCase().replace(/[-_]+/g, ' ');
  const intents: SpokenSearchIntent[] = [];

  if (
    /\b(open now|currently open|open late|open today|24\s*hours?|emergency|urgent)\b/.test(
      text,
    ) ||
    /\bopen\b/.test(text)
  ) {
    intents.push('open-now');
  }
  if (
    /\b(best|top|popular|highly rated|top rated|best rated|good reviews?|great reviews?|excellent reviews?|good rating|high rating|well reviewed|well rated)\b/.test(
      text,
    )
  ) {
    intents.push('top-rated');
  }
  if (/\b(verified|trusted|finder.?b verified)\b/.test(text)) {
    intents.push('verified');
  }
  if (
    /\b(near me|nearby|near by|around me|around here|close by|closeby|close to me|closest|nearest|in my area)\b/.test(
      text,
    )
  ) {
    intents.push('nearest');
  }
  if (
    /\b(offers?|discounts?|high discount|deals?|sale|promo|coupon|percent off)\b/.test(
      text,
    ) ||
    /\d+\s*%\s*off\b/.test(text)
  ) {
    intents.push('offers');
  }
  if (/\b(cheap|budget|affordable|low cost|inexpensive)\b/.test(text)) {
    intents.push('budget');
  }
  return intents;
}

export function exactMissNotice(label: string): string {
  const shown = label.trim() || 'that';
  return `No exact match for “${shown}”. Here are relevant options you can look through.`;
}

function isFilterWord(word: string): boolean {
  const term = singularizeSearchTerm(word);
  return QUERY_FILTER_WORDS.has(word) || QUERY_FILTER_WORDS.has(term);
}

/**
 * "with" stays when it belongs to a name ("cafe with a view", "tea with me").
 * It drops when it only introduces a filter ("gym with good reviews", "salon with offers").
 */
function keepWithToken(words: string[], index: number): boolean {
  if (words[index] !== 'with') return true;
  const after = words.slice(index + 1);
  if (!after.length) return false;
  if (isFilterWord(after[0])) return false;
  const content = after.filter((word) => !STOP_WORDS.has(word) && !isFilterWord(word));
  const filters = after.filter((word) => isFilterWord(word));
  if (filters.length > 0 && content.length === 0) return false;
  return true;
}

export function parseDirectoryQuery(normalized: string): DirectoryQuery {
  const rawWords = normalized
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !/^\d+$/.test(word));
  const words = rawWords.filter(
    (word, index) => !STOP_WORDS.has(word) && keepWithToken(rawWords, index),
  );

  const terms = [...new Set(words.map(singularizeSearchTerm))];
  const withoutFilters = terms.filter((term) => !QUERY_FILTER_WORDS.has(term));
  const subject = withoutFilters.length > 0 ? withoutFilters : terms;
  const specific = subject.filter((term) => !LOOSE_TERMS.has(term));
  const required = specific.length > 0 ? specific : subject;
  const phrase = (required.length > 0 ? required : terms).join(' ');

  const primaryNeedles: string[] = [];
  if (phrase) {
    primaryNeedles.push(phrase);
    if (!phrase.includes(' ') && phrase.length >= 3 && !phrase.endsWith('s')) {
      primaryNeedles.push(`${phrase}s`);
    }
  }
  for (const term of required) {
    for (const extra of EQUIVALENT_TERMS[term] || []) {
      if (!primaryNeedles.includes(extra)) primaryNeedles.push(extra);
    }
  }

  return { phrase, terms, required, primaryNeedles: primaryNeedles.slice(0, 6) };
}

function tokensOf(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function equivalentTerms(term: string): string[] {
  return EQUIVALENT_TERMS[singularizeSearchTerm(term)] || [];
}

function tokenMatches(token: string, term: string): boolean {
  const singularToken = singularizeSearchTerm(token);
  const singularTerm = singularizeSearchTerm(term);
  if (!singularToken || !singularTerm) return false;
  if (singularToken === singularTerm) return true;
  if (
    equivalentTerms(singularTerm).some((item) => singularizeSearchTerm(item) === singularToken) ||
    equivalentTerms(singularToken).some((item) => singularizeSearchTerm(item) === singularTerm)
  ) {
    return true;
  }
  // "dental" can match "dentist". "gym" must not match "gymnasium" or "barber".
  if (
    singularTerm.length >= 4 &&
    singularToken.startsWith(singularTerm) &&
    singularToken.length - singularTerm.length <= 3
  ) {
    return true;
  }
  if (
    singularToken.length >= 4 &&
    singularTerm.startsWith(singularToken) &&
    singularTerm.length - singularToken.length <= 3
  ) {
    return true;
  }
  return false;
}

export function fieldMatchesTerms(value: string | null | undefined, terms: string[]): boolean {
  if (!terms.length || !value) return false;
  const tokens = tokensOf(value);
  if (!tokens.length) return false;
  return terms.every((term) => tokens.some((token) => tokenMatches(token, term)));
}

function categoryLeaf(name: string): string {
  const parts = name.split('›').map((part) => part.trim()).filter(Boolean);
  return parts[parts.length - 1] || name;
}

/** 100 = category leaf, 90 = name or slug. 0 = not this category. */
export function categoryMatchScore(name: string, slug: string, terms: string[]): number {
  if (!terms.length) return 0;
  if (fieldMatchesTerms(categoryLeaf(name), terms)) return 100;
  if (fieldMatchesTerms(name, terms)) return 90;
  if (fieldMatchesTerms(slug.replace(/-/g, ' '), terms)) return 90;
  return 0;
}

export const EXACT_CATEGORY_SCORE = 90;

/**
 * 0 exact category, 1 exact business name, 2 keyword/service,
 * 3 mention in the description, 4 no match.
 */
export function merchantMatchTier(merchant: RankableMerchant, terms: string[]): number {
  if (!terms.length) return 4;
  const category = merchant.category || '';
  if (
    fieldMatchesTerms(categoryLeaf(category), terms) ||
    fieldMatchesTerms(category, terms)
  ) {
    return 0;
  }
  if (fieldMatchesTerms(merchant.name, terms)) return 1;
  const services = (merchant.services || []).join(' ');
  const keywords = (merchant.keywords || []).join(' ');
  if (fieldMatchesTerms(services, terms) || fieldMatchesTerms(keywords, terms)) return 2;
  if (fieldMatchesTerms(merchant.about, terms)) return 3;
  return 4;
}

function editDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length || !right.length) return Math.max(left.length, right.length);
  if (Math.abs(left.length - right.length) > 2) return 3;
  const prev = new Array<number>(right.length + 1);
  const next = new Array<number>(right.length + 1);
  for (let col = 0; col <= right.length; col += 1) prev[col] = col;
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

function rawSearchTokens(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 2);
}

function tokenCloseEnough(queryToken: string, nameToken: string, allowShortPrefix: boolean): boolean {
  const left = singularizeSearchTerm(queryToken);
  const right = singularizeSearchTerm(nameToken);
  if (!left || !right) return false;
  if (left === right) return true;
  if (allowShortPrefix && left.length >= 2 && right.startsWith(left)) return true;
  if (left.length >= 4 && right.startsWith(left)) return true;
  if (right.length >= 4 && left.startsWith(right) && left.length - right.length <= 2) return true;
  const allowed = left.length >= 8 ? 2 : left.length >= 4 ? 1 : 0;
  return allowed > 0 && editDistance(left, right) <= allowed;
}

/**
 * How well a typed name fragment fits a business name.
 * 0 means it is not a suggestion. Case, word order, a short last word,
 * and a one-letter typo still count.
 */
export function nameSuggestionScore(name: string, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase().replace(/\s+/g, ' ');
  const hay = name.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!query || !hay) return 0;
  if (hay === query) return 100;
  const queryHasWordBoundary = query.includes(' ');
  if (
    (queryHasWordBoundary && hay.startsWith(query)) ||
    (!queryHasWordBoundary && query.length >= 4 && hay.startsWith(`${query} `))
  ) {
    return 92;
  }

  const queryTokens = rawSearchTokens(query);
  const nameTokens = rawSearchTokens(hay);
  if (!queryTokens.length || !nameTokens.length) return 0;
  if (queryTokens.length === 1 && queryTokens[0].length < 4) return 0;
  if (queryTokens.every((token) => STOP_WORDS.has(token) || QUERY_FILTER_WORDS.has(token))) {
    return 0;
  }

  const used = new Set<number>();
  let fuzzy = 0;
  let matched = 0;
  let missed = 0;
  for (let index = 0; index < queryTokens.length; index += 1) {
    const term = queryTokens[index];
    if (STOP_WORDS.has(term)) continue;
    const last = index === queryTokens.length - 1;
    let match = -1;
    for (let nameIndex = 0; nameIndex < nameTokens.length; nameIndex += 1) {
      if (used.has(nameIndex)) continue;
      const exact = singularizeSearchTerm(nameTokens[nameIndex]) === singularizeSearchTerm(term);
      if (!tokenCloseEnough(term, nameTokens[nameIndex], last && queryTokens.length > 1)) continue;
      match = nameIndex;
      if (!exact) fuzzy += 1;
      break;
    }
    if (match < 0) {
      missed += 1;
      continue;
    }
    matched += 1;
    used.add(match);
  }

  if (!matched) return 0;
  return Math.max(48, 86 - fuzzy * 6 - missed * 16);
}

function tokenQuality(term: string, token: string): number {
  if (tokenMatches(token, term)) return 1;
  const left = singularizeSearchTerm(term);
  const right = singularizeSearchTerm(token);
  if (left.length < 4 || right.length < 4) return 0;
  const allowed = left.length >= 8 ? 2 : 1;
  return editDistance(left, right) <= allowed ? 0.7 : 0;
}

/** Higher means a closer hit. A junk extra word does not wipe out a real match. */
export function scoreMerchantMatch(merchant: RankableMerchant, terms: string[]): number {
  if (!terms.length) return 0;
  const fields: Array<[string, number]> = [
    [merchant.name || '', 52],
    [merchant.category || '', 44],
    [(merchant.services || []).join(' '), 26],
    [(merchant.keywords || []).join(' '), 22],
    [merchant.about || '', 8],
  ];

  let score = 0;
  let matched = 0;
  for (const term of terms) {
    let best = 0;
    for (const [value, weight] of fields) {
      for (const token of tokensOf(value)) {
        const quality = tokenQuality(term, token);
        if (quality > 0) best = Math.max(best, Math.round(weight * quality));
      }
    }
    if (best > 0) {
      matched += 1;
      score += best;
    }
  }
  if (!matched) return 0;
  score += matched * 10;
  if (matched === terms.length) score += 28;
  const name = merchant.name.toLowerCase();
  if (name.includes(terms.join(' '))) score += 36;
  return score;
}

/** Category, parent, or leaf can match even when another word in the query does not. */
export function categoryRelevanceScore(name: string, slug: string, terms: string[]): number {
  const exact = categoryMatchScore(name, slug, terms);
  if (exact) return exact;
  if (!terms.length) return 0;
  const parts = [categoryLeaf(name), name, slug.replace(/-/g, ' ')];
  let hits = 0;
  for (const term of terms) {
    if (parts.some((part) => fieldMatchesTerms(part, [term]))) hits += 1;
  }
  if (!hits) return 0;
  return 36 + hits * 12;
}

export function relatedSearchTerms(required: string[]): string[] {
  const out = new Set<string>();
  for (const term of required) {
    const key = singularizeSearchTerm(term);
    for (const related of RELATED_TERMS[key] || []) out.add(related);
  }
  for (const term of required) out.delete(singularizeSearchTerm(term));
  return [...out].slice(0, 5);
}

export function orderMerchantsByPrecision<T extends RankableMerchant>(
  merchants: T[],
  terms: string[],
  distanceOf?: (merchant: T) => number,
): T[] {
  return [...merchants].sort((a, b) => {
    const tierA = merchantMatchTier(a, terms);
    const tierB = merchantMatchTier(b, terms);
    if (tierA !== tierB) return tierA - tierB;
    if (distanceOf) {
      const distA = distanceOf(a);
      const distB = distanceOf(b);
      if (distA !== distB) return distA - distB;
    }
    return 0;
  });
}

const NAME_STOP_WORDS = new Set([
  'pvt',
  'private',
  'ltd',
  'limited',
  'llp',
  'and',
  'the',
  'of',
  'co',
  'company',
  'enterprise',
  'enterprises',
  'proprietorship',
  'prop',
]);

export function normalizePan(value: string): string | null {
  const pan = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan) ? pan : null;
}

export function maskPan(pan: string): string {
  return `XXXXX${pan.slice(5, 9)}X`;
}

export function normalizeUdyam(value: string): string | null {
  const compact = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const match = compact.match(/^UDYAM([A-Z]{2})(\d{2})(\d{7})$/);
  if (!match) return null;
  return `UDYAM-${match[1]}-${match[2]}-${match[3]}`;
}

export function normalizeGstin(value: string): string | null {
  const gstin = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gstin) ? gstin : null;
}

export function cashfreePersonName(value: string): string {
  return value
    .replace(/[^A-Za-z0-9 .\-/&]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 85);
}

export function normalizeBusinessName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token && !NAME_STOP_WORDS.has(token))
    .join(' ');
}

/** True when two business or person names refer to the same party. */
export function businessNamesMatch(leftRaw: string, rightRaw: string): boolean {
  const left = normalizeBusinessName(leftRaw);
  const right = normalizeBusinessName(rightRaw);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.length >= 4 && right.length >= 4 && (left.includes(right) || right.includes(left))) {
    return true;
  }

  const leftTokens = left.split(' ').filter((token) => token.length > 2);
  const rightTokens = right.split(' ').filter((token) => token.length > 2);
  if (!leftTokens.length || !rightTokens.length) return false;
  const rightSet = new Set(rightTokens);
  const hits = leftTokens.filter((token) => rightSet.has(token)).length;
  const coverage = hits / Math.max(leftTokens.length, rightTokens.length);
  return hits >= 1 && coverage >= 0.6;
}

export function anyNameMatches(registered: string, candidates: Array<string | null | undefined>): boolean {
  const name = registered.trim();
  if (!name) return false;
  return candidates.some((candidate) => Boolean(candidate && businessNamesMatch(name, candidate)));
}

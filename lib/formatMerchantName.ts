const ACRONYM_MAX_LENGTH = 3;

/** Simple Title Case: "Property" — not intentional mixed branding like "FinderB". */
function isSimpleTitleCase(word: string): boolean {
  return /^[A-Z][a-z0-9'&-]*$/.test(word);
}

/** e.g. FinderB, iPhone, McDonald's — keep author-chosen casing from the DB. */
function hasIntentionalMixedCase(word: string): boolean {
  if (!/[A-Za-z]/.test(word)) return false;
  if (isSimpleTitleCase(word)) return false;
  return /[A-Z]/.test(word) && /[a-z]/.test(word);
}

/** Short ALL-CAPS tokens such as YRS, B2B, PG. */
function isShortAcronym(word: string): boolean {
  return /^[A-Z0-9&]+$/.test(word) && word.length <= ACRONYM_MAX_LENGTH;
}

function capitalizeSegment(segment: string): string {
  if (!segment) return segment;
  const lower = segment.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function toTitleCaseToken(token: string): string {
  return token
    .split('-')
    .map((part) =>
      part
        .split("'")
        .map((piece) => capitalizeSegment(piece))
        .join("'")
    )
    .join('-');
}

function normalizeWord(word: string): string {
  if (!word) return word;

  if (hasIntentionalMixedCase(word) || isShortAcronym(word)) {
    return word;
  }

  if (/^[a-z]/.test(word) || /^[A-Z]+$/.test(word)) {
    return toTitleCaseToken(word);
  }

  return word;
}

/**
 * Formats merchant names for display: title-cases plain ALL CAPS / lowercase input,
 * but preserves intentional casing from the DB (FinderB, YRS, B2B, etc.).
 */
export function formatMerchantName(name: string | null | undefined): string {
  if (!name?.trim()) return '';

  return name
    .trim()
    .split(/\s+/)
    .map((word) => normalizeWord(word))
    .join(' ');
}

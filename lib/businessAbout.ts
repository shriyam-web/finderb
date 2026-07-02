/** Max words for merchant “About Business” in settings. */
export const ABOUT_BUSINESS_MAX_WORDS = 500;

export function countAboutWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function trimAboutToWordLimit(text: string, maxWords = ABOUT_BUSINESS_MAX_WORDS): string {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}

export function isAboutWithinWordLimit(
  text: string,
  maxWords = ABOUT_BUSINESS_MAX_WORDS,
): boolean {
  return countAboutWords(text) <= maxWords;
}

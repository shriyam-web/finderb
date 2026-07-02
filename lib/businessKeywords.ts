export const MAX_SEARCH_KEYWORDS = 10;

export function normalizeSearchKeywords(keywords: string[] | string | null | undefined): string[] {
  const source = Array.isArray(keywords)
    ? keywords
    : typeof keywords === 'string'
      ? keywords.split(',')
      : [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of source) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
    if (result.length >= MAX_SEARCH_KEYWORDS) break;
  }

  return result;
}

export function getSearchKeywordsImpact(count: number) {
  if (count === 0) {
    return {
      title: 'Add keywords customers might search for',
      message:
        'Keywords help your listing appear when people search for services, products, or problems you solve — even if they do not know your business name yet.',
    };
  }

  if (count < 3) {
    return {
      title: 'Good start — add a few more',
      message:
        'Each keyword is another way customers can discover you on FinderB search and category pages. Think: services, specialties, brands, and local phrases.',
    };
  }

  if (count < MAX_SEARCH_KEYWORDS) {
    return {
      title: 'Strong keyword coverage',
      message:
        'You are covering multiple search intents. Add remaining slots with phrases customers actually type — e.g. "AC repair", "same-day delivery", "bridal makeup".',
    };
  }

  return {
    title: 'Maximum keywords added',
    message:
      'Your listing is optimised for a wide range of searches. Update keywords when you launch new services or seasonal offers.',
  };
}

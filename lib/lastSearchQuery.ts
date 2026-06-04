export const LAST_SEARCH_KEY = 'finderb_last_search';

export function getLastSearchQuery(): string {
  if (typeof window === 'undefined') return '';
  try {
    return sessionStorage.getItem(LAST_SEARCH_KEY)?.trim() ?? '';
  } catch {
    return '';
  }
}

export function setLastSearchQuery(query: string): void {
  if (typeof window === 'undefined') return;
  const trimmed = query.trim();
  if (!trimmed) return;
  try {
    sessionStorage.setItem(LAST_SEARCH_KEY, trimmed);
  } catch {
    /* ignore quota / private mode */
  }
}

export function resolveClientSearchQuery(urlQuery?: string | null): string {
  const fromUrl = urlQuery?.trim() ?? '';
  if (fromUrl) return fromUrl;
  return getLastSearchQuery();
}

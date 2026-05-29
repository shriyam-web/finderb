export function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase();
}

/** Case-insensitive partial match (e.g. "school" matches "Schools"). */
export function textMatchesSearch(
  text: string | null | undefined,
  query: string
): boolean {
  const needle = normalizeSearchQuery(query);
  if (!needle) return true;
  if (!text) return false;
  return normalizeSearchQuery(text).includes(needle);
}

/**
 * Case-insensitive A–Z compare. `localeCompare` goes through ICU on Hermes and
 * costs milliseconds per call, which freezes the UI when sorting long lists.
 */
export function compareText(a: string, b: string): number {
  const x = a.toLowerCase();
  const y = b.toLowerCase();
  if (x < y) return -1;
  if (x > y) return 1;
  return 0;
}

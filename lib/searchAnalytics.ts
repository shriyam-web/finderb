import { getProfileViewSessionHash } from '@/lib/profileViews';

export function recordSearchAnalytics(query: string): void {
  if (typeof window === 'undefined') return;

  const trimmed = query.trim();
  if (trimmed.length < 2) return;

  const sessionHash = getProfileViewSessionHash();

  void fetch('/api/analytics/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: trimmed, sessionHash }),
    keepalive: true,
  }).catch(() => undefined);
}

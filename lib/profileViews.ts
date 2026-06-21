const VIEW_SESSION_KEY = 'finderb-view-session';

export function getProfileViewSessionHash(): string {
  if (typeof window === 'undefined') return '';

  try {
    let hash = localStorage.getItem(VIEW_SESSION_KEY);
    if (!hash) {
      hash =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(VIEW_SESSION_KEY, hash);
    }
    return hash;
  } catch {
    return '';
  }
}

export function shouldRecordProfileViewToday(businessId: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const dedupeKey = `finderb-viewed-${businessId}`;
    const today = new Date().toISOString().slice(0, 10);
    if (sessionStorage.getItem(dedupeKey) === today) return false;
    sessionStorage.setItem(dedupeKey, today);
    return true;
  } catch {
    return true;
  }
}

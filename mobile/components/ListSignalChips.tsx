import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { siteBases } from '../lib/supabase';
import { BestInCategoryMark, ReplyPace } from './ProfileSignalMarks';
import { PublicBadgeRow } from './PublicBadgeRow';

export type ListSignals = {
  bestInCategory: boolean;
  averageResponse: string | null;
  badges: { id: string; label: string }[];
};

const CACHE_MS = 10 * 60 * 1000;
const cache = new Map<string, { at: number; value: ListSignals }>();
const waiters = new Map<string, Array<(value: ListSignals | null) => void>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function peek(id: string): ListSignals | null {
  return cache.get(id)?.value ?? null;
}

function fresh(id: string): boolean {
  const hit = cache.get(id);
  return Boolean(hit && Date.now() - hit.at < CACHE_MS);
}

function remember(id: string, value: ListSignals) {
  cache.set(id, { at: Date.now(), value });
}

function flushSignals() {
  const ids = [...waiters.keys()].filter((id) => !fresh(id));
  const groups = new Map(waiters);
  waiters.clear();
  flushTimer = null;
  for (const [id, resolvers] of groups) {
    if (fresh(id)) {
      const value = peek(id);
      resolvers.forEach((resolve) => resolve(value));
    }
  }
  if (!ids.length) return;
  void (async () => {
    let payload: Record<string, ListSignals> = {};
    for (const base of siteBases()) {
      try {
        const response = await fetch(
          `${base}/api/business/signals?ids=${encodeURIComponent(ids.join(','))}`,
        );
        if (!response.ok) continue;
        const data = (await response.json()) as { signals?: Record<string, ListSignals> };
        payload = data.signals || {};
        break;
      } catch {
        // try the next site
      }
    }
    for (const id of ids) {
      const value = payload[id] ?? peek(id);
      if (payload[id]) remember(id, payload[id]);
      (groups.get(id) || []).forEach((resolve) => resolve(value));
    }
  })();
}

export function useBusinessSignals(id: string | null | undefined): ListSignals | null {
  const [signals, setSignals] = useState<ListSignals | null>(id ? peek(id) : null);
  useEffect(() => {
    if (!id) {
      setSignals(null);
      return;
    }
    const cached = peek(id);
    if (cached) setSignals(cached);
    if (fresh(id)) {
      const hit = cache.get(id);
      const wait = hit ? CACHE_MS - (Date.now() - hit.at) : CACHE_MS;
      const timer = setTimeout(() => {
        const resolvers = waiters.get(id) || [];
        resolvers.push((value) => setSignals(value));
        waiters.set(id, resolvers);
        if (flushTimer) clearTimeout(flushTimer);
        flushTimer = setTimeout(flushSignals, 40);
      }, wait);
      return () => clearTimeout(timer);
    }
    let alive = true;
    const resolvers = waiters.get(id) || [];
    resolvers.push((value) => {
      if (alive) setSignals(value);
    });
    waiters.set(id, resolvers);
    if (flushTimer) clearTimeout(flushTimer);
    flushTimer = setTimeout(flushSignals, 40);
    return () => {
      alive = false;
    };
  }, [id]);
  return signals;
}

export function ListSignalChips({
  id,
  compact = true,
  tight = false,
  replyScale = 1,
}: {
  id: string;
  compact?: boolean;
  tight?: boolean;
  /** Home cards draw the reply-time line smaller than the profile. */
  replyScale?: number;
}) {
  const signals = useBusinessSignals(id);
  if (!signals) return null;
  if (!signals.badges.length && !signals.bestInCategory && !signals.averageResponse) return null;
  const trusted = signals.badges.filter((badge) => badge.id === 'trusted');
  const others = signals.badges.filter((badge) => badge.id !== 'trusted');
  return (
    <View style={[styles.wrap, tight && styles.wrapTight]}>
      {trusted.length ? <PublicBadgeRow badges={trusted} compact={compact} /> : null}
      {signals.bestInCategory ? <BestInCategoryMark /> : null}
      {signals.averageResponse ? (
        <ReplyPace label={signals.averageResponse} scale={replyScale} />
      ) : null}
      {others.length ? <PublicBadgeRow badges={others} compact={compact} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4, gap: 4 },
  wrapTight: { marginTop: 1, gap: 2 },
});

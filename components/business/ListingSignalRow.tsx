'use client';

import { useEffect, useState } from 'react';

type ListSignals = {
  bestInCategory: boolean;
  averageResponse: string | null;
  badges: { id: string; label: string }[];
};

const SHORT: Record<string, string> = {
  quickReply: 'Quick reply',
  highlyRated: 'Highly rated',
  popularMonth: 'Popular',
  newOnFinderB: 'New',
  trusted: 'Trusted',
};

const waiters = new Map<string, Array<(value: ListSignals | null) => void>>();
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushSignals() {
  const ids = [...waiters.keys()];
  const groups = new Map(waiters);
  waiters.clear();
  flushTimer = null;
  if (!ids.length) return;
  void (async () => {
    let payload: Record<string, ListSignals> = {};
    try {
      const response = await fetch(`/api/business/signals?ids=${encodeURIComponent(ids.join(','))}`);
      if (response.ok) {
        const data = (await response.json()) as { signals?: Record<string, ListSignals> };
        payload = data.signals || {};
      }
    } catch {
      payload = {};
    }
    for (const [id, resolvers] of groups) {
      resolvers.forEach((resolve) => resolve(payload[id] ?? null));
    }
  })();
}

function useListingSignals(id: string): ListSignals | null {
  const [signals, setSignals] = useState<ListSignals | null>(null);
  useEffect(() => {
    if (!id) return;
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

export function ListingSignalRow({ id }: { id: string }) {
  const signals = useListingSignals(id);
  if (!signals) return null;
  const bits: string[] = [];
  if (signals.bestInCategory) bits.push('🔥 Best');
  if (signals.averageResponse) bits.push(`Replies ${signals.averageResponse}`);
  for (const badge of signals.badges) {
    const label = SHORT[badge.id] || badge.label;
    if (label) bits.push(label);
  }
  if (!bits.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {bits.map((bit) => (
        <span
          key={bit}
          className="rounded-full border border-stone-200 bg-stone-50 px-1.5 py-px text-[10px] font-medium leading-4 text-stone-600"
        >
          {bit}
        </span>
      ))}
    </div>
  );
}

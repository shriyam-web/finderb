import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { siteBases } from '../lib/supabase';

export type ListSignals = {
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
    for (const [id, resolvers] of groups) {
      const value = payload[id] ?? null;
      resolvers.forEach((resolve) => resolve(value));
    }
  })();
}

function useListSignals(id: string): ListSignals | null {
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

export function ListSignalChips({ id }: { id: string }) {
  const { colors } = useTheme();
  const signals = useListSignals(id);
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
    <View style={styles.row}>
      {bits.map((bit) => (
        <Text
          key={bit}
          style={[styles.chip, { color: colors.textSoft, borderColor: colors.border }]}
        >
          {bit}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  chip: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
});

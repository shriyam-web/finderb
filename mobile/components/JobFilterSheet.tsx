import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { JOB_TYPE_FILTERS } from '../lib/jobs';

export type JobAppliedFilter = 'all' | 'open' | 'applied';

export type JobFilterState = {
  type: (typeof JOB_TYPE_FILTERS)[number];
  applied: JobAppliedFilter;
};

export const DEFAULT_JOB_FILTERS: JobFilterState = {
  type: 'All',
  applied: 'all',
};

export function isDefaultJobFilters(filters: JobFilterState) {
  return filters.type === 'All' && filters.applied === 'all';
}

export function activeJobFilterCount(filters: JobFilterState) {
  let n = 0;
  if (filters.type !== 'All') n += 1;
  if (filters.applied !== 'all') n += 1;
  return n;
}

const APPLIED_CHOICES: { id: JobAppliedFilter; label: string }[] = [
  { id: 'all', label: 'All jobs' },
  { id: 'open', label: 'Not applied yet' },
  { id: 'applied', label: 'Already applied' },
];

export function JobFilterTrigger({
  filters,
  onOpen,
  onClear,
}: {
  filters: JobFilterState;
  onOpen: () => void;
  onClear: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const idle = isDefaultJobFilters(filters);
  const count = activeJobFilterCount(filters);

  if (idle) {
    return (
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Filters"
      >
        <Ionicons name="options-outline" size={16} color={colors.ink} />
        <Text style={styles.triggerText}>Filters</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.triggerRow}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.triggerActive, pressed && styles.pressed]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Edit filters, ${count} applied`}
      >
        <Ionicons name="options-outline" size={16} color={colors.teal} />
        <Text style={styles.triggerActiveText}>Filters</Text>
        <View style={styles.triggerCount}>
          <Text style={styles.triggerCountText}>{count}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onClear}
        style={({ pressed }) => [styles.triggerClear, pressed && styles.pressed]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Clear filters"
      >
        <Text style={styles.triggerClearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

export function JobFilterSheet({
  visible,
  onClose,
  filters,
  onApply,
  matchCount,
}: {
  visible: boolean;
  onClose: () => void;
  filters: JobFilterState;
  onApply: (next: JobFilterState) => void;
  matchCount: (draft: JobFilterState) => number;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const idle = isDefaultJobFilters(draft);
  const count = useMemo(() => matchCount(draft), [draft, matchCount]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Filter jobs</Text>
            <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Close filters">
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.sheetBody}
          >
            <Text style={styles.sectionLabel}>Job type</Text>
            <View style={styles.chipWrap}>
              {JOB_TYPE_FILTERS.map((type) => {
                const on = draft.type === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setDraft((prev) => ({ ...prev, type }))}
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{type}</Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.sectionLabel, styles.sectionGap]}>Application</Text>
            <View style={styles.chipWrap}>
              {APPLIED_CHOICES.map((choice) => {
                const on = draft.applied === choice.id;
                return (
                  <Pressable
                    key={choice.id}
                    onPress={() =>
                      setDraft((prev) => ({ ...prev, applied: choice.id }))
                    }
                    style={[styles.chip, on && styles.chipOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>
                      {choice.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              onPress={() => setDraft(DEFAULT_JOB_FILTERS)}
              disabled={idle}
              style={[styles.resetBtn, idle && styles.resetOff]}
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
            >
              <Text style={[styles.resetText, idle && styles.resetTextOff]}>Reset</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                onApply(draft);
                onClose();
              }}
              style={styles.applyBtn}
              accessibilityRole="button"
            >
              <Text style={styles.applyText}>
                {idle
                  ? 'Show all jobs'
                  : count === 0
                    ? 'No jobs match'
                    : `Apply · ${count} job${count === 1 ? '' : 's'}`}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  pressed: { opacity: 0.88 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  triggerText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  triggerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triggerActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingLeft: 11,
    paddingRight: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${colors.teal}55`,
    backgroundColor: colors.tealSoft,
  },
  triggerActiveText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.teal,
  },
  triggerCount: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
  },
  triggerCountText: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.frost,
  },
  triggerClear: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerClearText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '78%',
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 8,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 8,
  },
  sheetTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 17,
    color: colors.heading,
  },
  sheetBody: {
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },
  sectionGap: {
    marginTop: 18,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  chipOn: {
    borderColor: `${colors.teal}55`,
    backgroundColor: colors.tealSoft,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  chipTextOn: {
    color: colors.heading,
    fontFamily: fonts.semiBold,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 18,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  resetBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetOff: { opacity: 0.45 },
  resetText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  resetTextOff: {
    color: colors.textSoft,
  },
  applyBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.ink,
  },
  applyText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
}));

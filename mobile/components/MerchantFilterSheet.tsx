import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import {
  DEFAULT_FILTERS,
  DISTANCE_CHOICES,
  FILTER_PANES,
  HOURS_CHOICES,
  OFFER_CHOICES,
  RATING_CHOICES,
  activeFilterCount,
  firstActivePane,
  isDefaultFilters,
  type DistanceChoice,
  type FilterPane,
  type FilterState,
  type HoursChoice,
  type OfferChoice,
  type RatingChoice,
} from '../lib/merchantFilters';

export function MerchantFilterTrigger({
  filters,
  onOpen,
  onClear,
}: {
  filters: FilterState;
  onOpen: () => void;
  onClear: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const idle = isDefaultFilters(filters);
  const appliedCount = activeFilterCount(filters);

  if (idle) {
    return (
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.filterBtn, pressed && styles.pressed]}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel="Filters"
      >
        <Ionicons name="funnel-outline" size={14} color={colors.ink} />
        <Text style={styles.filterBtnText}>Filter</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.filterActions}>
      <Pressable
        onPress={onOpen}
        style={({ pressed }) => [styles.filterEditBtn, pressed && styles.pressed]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel={`Edit filters, ${appliedCount} applied`}
      >
        <Ionicons name="options-outline" size={14} color="#0F766E" />
        <Text style={styles.filterEditText}>Edit filter</Text>
        <View style={styles.filterEditCount}>
          <Text style={styles.filterEditCountText}>{appliedCount}</Text>
        </View>
      </Pressable>
      <Pressable
        onPress={onClear}
        style={({ pressed }) => [styles.filterClearBtn, pressed && styles.pressed]}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Clear filters"
      >
        <Text style={styles.filterClearText}>Clear</Text>
      </Pressable>
    </View>
  );
}

export function MerchantFilterSheet({
  visible,
  onClose,
  filters,
  onChange,
  matchCount,
  placeName,
  hasLocation,
}: {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  onChange: (next: FilterState) => void;
  matchCount: number;
  placeName: string;
  hasLocation: boolean;
}) {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const [pane, setPane] = useState<FilterPane>('hours');
  const idle = isDefaultFilters(filters);
  const activePane = FILTER_PANES.find((item) => item.id === pane) ?? FILTER_PANES[0];
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    if (visible) setPane(firstActivePane(filtersRef.current));
  }, [visible]);

  const paneChoices =
    pane === 'hours'
      ? HOURS_CHOICES
      : pane === 'rating'
        ? RATING_CHOICES
        : pane === 'distance'
          ? DISTANCE_CHOICES
          : OFFER_CHOICES;

  const paneValue =
    pane === 'hours'
      ? filters.hours
      : pane === 'rating'
        ? filters.rating
        : pane === 'distance'
          ? filters.distance
          : filters.offers;

  const setPaneValue = (id: string) => {
    if (pane === 'hours') {
      onChange({ ...filters, hours: id as HoursChoice });
      return;
    }
    if (pane === 'rating') {
      onChange({ ...filters, rating: id as RatingChoice });
      return;
    }
    if (pane === 'distance') {
      onChange({ ...filters, distance: id as DistanceChoice });
      return;
    }
    onChange({ ...filters, offers: id as OfferChoice });
  };

  const summary = idle
    ? `${matchCount} place${matchCount === 1 ? '' : 's'} in ${placeName}`
    : matchCount === 0
      ? `No places match in ${placeName}`
      : `${matchCount} match in ${placeName}`;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.sheetRoot}>
        <Pressable style={styles.sheetBackdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHead}>
            <View style={styles.sheetHeadCopy}>
              <Text style={styles.sheetTitle}>Filters</Text>
              <Text style={styles.sheetSubtitle} numberOfLines={2}>
                {summary}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.sheetClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close filters"
            >
              <Ionicons name="close" size={18} color={colors.ink} />
            </Pressable>
          </View>
          <View style={styles.sheetSplit}>
            <View style={styles.sheetNav}>
              {FILTER_PANES.map((item) => {
                const selected = pane === item.id;
                const on =
                  item.id === 'hours'
                    ? filters.hours !== 'any'
                    : item.id === 'rating'
                      ? filters.rating !== 'any'
                      : item.id === 'distance'
                        ? filters.distance !== 'any'
                        : filters.offers !== 'any';
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setPane(item.id)}
                    style={[
                      styles.sheetNavItem,
                      selected && {
                        backgroundColor: isDark
                          ? `${item.color}33`
                          : item.soft,
                        borderLeftColor: item.color,
                      },
                    ]}
                  >
                    <View style={styles.sheetNavIcon}>
                      <Ionicons
                        name={item.icon}
                        size={16}
                        color={selected ? item.color : colors.textMuted}
                      />
                    </View>
                    <Text
                      style={[
                        styles.sheetNavText,
                        selected && { color: item.color },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                    {on ? (
                      <View
                        style={[
                          styles.sheetNavDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.sheetMain}>
              <Text style={styles.sheetPaneTitle}>{activePane.label}</Text>
              {pane === 'distance' && !hasLocation ? (
                <Text style={styles.sheetPaneHint}>
                  Turn on location to use distance
                </Text>
              ) : null}
              <View style={styles.choiceCol}>
                {paneChoices.map((choice) => {
                  const selected = paneValue === choice.id;
                  const disabled =
                    pane === 'distance' &&
                    choice.id !== 'any' &&
                    !hasLocation;
                  return (
                    <Pressable
                      key={choice.id}
                      disabled={disabled}
                      onPress={() => setPaneValue(choice.id)}
                      style={({ pressed }) => [
                        styles.choiceChip,
                        selected && styles.choiceChipOn,
                        disabled && styles.filterDisabled,
                        pressed && !disabled && styles.pressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected, disabled }}
                    >
                      <Text
                        style={[
                          styles.choiceChipText,
                          selected && styles.choiceChipTextOn,
                        ]}
                      >
                        {choice.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
          <View style={styles.sheetFooter}>
            <Pressable
              onPress={() => onChange(DEFAULT_FILTERS)}
              disabled={idle}
              style={[styles.sheetReset, idle && styles.sheetResetOff]}
              accessibilityRole="button"
              accessibilityLabel="Reset filters"
            >
              <Text
                style={[
                  styles.sheetResetText,
                  idle && styles.sheetResetTextOff,
                ]}
              >
                Reset
              </Text>
            </Pressable>
            <Pressable
              onPress={onClose}
              style={styles.sheetDone}
              accessibilityRole="button"
            >
              <Text style={styles.sheetDoneText}>
                {idle
                  ? 'Show all places'
                  : matchCount === 0
                    ? 'No places match'
                    : `Show ${matchCount} place${matchCount === 1 ? '' : 's'}`}
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
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingLeft: 11,
    paddingRight: 11,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexShrink: 0,
  },
  filterBtnText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  filterActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  filterEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#D7E6E2',
    backgroundColor: '#F3F8F6',
  },
  filterEditText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: '#0F766E',
  },
  filterEditCount: {
    minWidth: 18,
    height: 18,
    paddingHorizontal: 5,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
  },
  filterEditCountText: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: '#ECFDF5',
  },
  filterClearBtn: {
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterClearText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  sheetRoot: { flex: 1, justifyContent: 'flex-end' },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,10,9,0.4)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 12,
    paddingTop: 10,
    maxHeight: '78%',
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
    marginBottom: 10,
  },
  sheetHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 4,
    marginBottom: 10,
  },
  sheetHeadCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 20,
    letterSpacing: -0.3,
    color: colors.heading,
  },
  sheetSubtitle: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  sheetClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetSplit: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 220,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
  },
  sheetNav: {
    width: 128,
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 10,
    gap: 6,
    backgroundColor: colors.canvas,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  sheetNavItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 9,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 12,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  sheetNavIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
  },
  sheetNavText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  sheetNavDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sheetMain: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
  },
  sheetPaneTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    marginBottom: 10,
    color: colors.heading,
  },
  sheetPaneHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
    marginBottom: 8,
    marginTop: -4,
  },
  choiceCol: {
    gap: 8,
  },
  choiceChip: {
    alignSelf: 'stretch',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.canvas,
  },
  choiceChipOn: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  choiceChipText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.ink,
  },
  choiceChipTextOn: {
    color: colors.teal,
    fontFamily: fonts.semiBold,
  },
  filterDisabled: { opacity: 0.45 },
  sheetFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 4,
  },
  sheetReset: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  sheetResetOff: {
    opacity: 0.4,
  },
  sheetResetText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  sheetResetTextOff: {
    color: colors.textMuted,
  },
  sheetDone: {
    flex: 1,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  sheetDoneText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.onDark,
  },
}));

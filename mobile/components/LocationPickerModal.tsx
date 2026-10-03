import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../constants/typography';
import { useAppLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import {
  citiesInState,
  INDIAN_STATES,
  searchIndianCities,
  type CityEntry,
} from '../lib/indianPlaces';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const POPULAR: CityEntry[] = [
  { city: 'Delhi', state: 'Delhi' },
  { city: 'Mumbai', state: 'Maharashtra' },
  { city: 'Bangalore', state: 'Karnataka' },
  { city: 'Hyderabad', state: 'Telangana' },
  { city: 'Chennai', state: 'Tamil Nadu' },
  { city: 'Kolkata', state: 'West Bengal' },
  { city: 'Pune', state: 'Maharashtra' },
  { city: 'Ahmedabad', state: 'Gujarat' },
  { city: 'Jaipur', state: 'Rajasthan' },
  { city: 'Lucknow', state: 'Uttar Pradesh' },
  { city: 'Noida', state: 'Uttar Pradesh' },
  { city: 'Gurugram', state: 'Haryana' },
  { city: 'Chandigarh', state: 'Chandigarh' },
  { city: 'Indore', state: 'Madhya Pradesh' },
  { city: 'Kochi', state: 'Kerala' },
  { city: 'Surat', state: 'Gujarat' },
];

type Row =
  | { kind: 'state'; state: string; count: number }
  | { kind: 'city'; entry: CityEntry; showState: boolean }
  | { kind: 'custom'; city: string };

function sameCity(a: string | null | undefined, b: string) {
  return Boolean(a) && a!.trim().toLowerCase() === b.trim().toLowerCase();
}

export function LocationPickerModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const location = useAppLocation();
  const [query, setQuery] = useState('');
  const [openState, setOpenState] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) return;
    setQuery('');
    setOpenState(null);
  }, [visible]);

  const rows = useMemo<Row[]>(() => {
    const q = query.trim();
    if (q) {
      const lower = q.toLowerCase();
      const popularHits = openState
        ? []
        : POPULAR.filter((item) => item.city.toLowerCase().startsWith(lower));
      const seen = new Set(popularHits.map((item) => `${item.city}|${item.state}`));
      const hits = [
        ...popularHits,
        ...searchIndianCities(q, openState).filter(
          (item) => !seen.has(`${item.city}|${item.state}`),
        ),
      ];
      const result: Row[] = hits.map((entry) => ({
        kind: 'city',
        entry,
        showState: !openState,
      }));
      if (q.length >= 2 && !hits.some((item) => sameCity(item.city, q))) {
        result.push({ kind: 'custom', city: q });
      }
      return result;
    }
    if (openState) {
      return citiesInState(openState).map((city) => ({
        kind: 'city',
        entry: { city, state: openState },
        showState: false,
      }));
    }
    return INDIAN_STATES.map((state) => ({
      kind: 'state',
      state,
      count: citiesInState(state).length,
    }));
  }, [openState, query]);

  const pickCity = async (city: string, region?: string | null) => {
    if (!city.trim() || busy) return;
    setBusy(true);
    try {
      await location.setManualLocation({ city: city.trim(), region: region ?? null });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const useCurrent = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await location.useDeviceLocation();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const browsing = !query.trim() && !openState;
  const gpsActive = location.source === 'gps';

  const header = (
    <View>
      <Pressable
        style={({ pressed }) => [styles.gpsRow, pressed && styles.pressed, busy && styles.disabled]}
        onPress={() => void useCurrent()}
        disabled={busy}
      >
        <Ionicons name="navigate" size={18} color={colors.brand} />
        <View style={styles.gpsCopy}>
          <Text style={styles.gpsTitle}>Use my current location</Text>
          {gpsActive && (location.area || location.city) ? (
            <Text style={styles.gpsSub} numberOfLines={1}>
              {location.label}
            </Text>
          ) : null}
        </View>
        {busy ? <ActivityIndicator color={colors.brand} /> : null}
      </Pressable>

      {browsing ? (
        <>
          <Text style={styles.section}>Popular cities</Text>
          <View style={styles.chips}>
            {POPULAR.map((item) => {
              const active = !gpsActive && sameCity(location.city, item.city);
              return (
                <Pressable
                  key={item.city}
                  onPress={() => void pickCity(item.city, item.state)}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.chip,
                    active && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]} numberOfLines={1}>
                    {item.city}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.section}>All states</Text>
        </>
      ) : null}

      {openState && !query.trim() ? (
        <Pressable
          onPress={() => setOpenState(null)}
          style={({ pressed }) => [styles.backRow, pressed && styles.pressed]}
          hitSlop={6}
        >
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
          <Text style={styles.backTitle}>{openState}</Text>
          <Text style={styles.backCount}>{rows.length} cities</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.head}>
          <Text style={styles.title}>Choose your city</Text>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Ionicons name="close" size={20} color={colors.ink} />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textSoft} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={openState ? `Search in ${openState}` : 'Search any city or town'}
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={() => {
              const first = rows[0];
              if (first?.kind === 'city') void pickCity(first.entry.city, first.entry.state);
              else if (query.trim()) void pickCity(query.trim());
            }}
          />
          {query ? (
            <Pressable onPress={() => setQuery('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={colors.textSoft} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) =>
            row.kind === 'state'
              ? `s:${row.state}`
              : row.kind === 'city'
                ? `c:${row.entry.state}:${row.entry.city}`
                : `x:${row.city}`
          }
          ListHeaderComponent={header}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          initialNumToRender={20}
          windowSize={10}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.divider} />}
          ListEmptyComponent={
            <Text style={styles.empty}>No matching city. Try a nearby town.</Text>
          }
          renderItem={({ item: row }) => {
            if (row.kind === 'state') {
              return (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => setOpenState(row.state)}
                >
                  <Text style={styles.rowText}>{row.state}</Text>
                  <Text style={styles.rowMeta}>{row.count} cities</Text>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />
                </Pressable>
              );
            }
            if (row.kind === 'custom') {
              return (
                <Pressable
                  style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                  onPress={() => void pickCity(row.city)}
                  disabled={busy}
                >
                  <Ionicons name="add-circle-outline" size={18} color={colors.brand} />
                  <Text style={[styles.rowText, styles.customText]} numberOfLines={1}>
                    Use “{row.city}”
                  </Text>
                </Pressable>
              );
            }
            const { city, state } = row.entry;
            const active = !gpsActive && sameCity(location.city, city);
            return (
              <Pressable
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
                onPress={() => void pickCity(city, state)}
                disabled={busy}
              >
                <View style={styles.cityCopy}>
                  <Text style={[styles.cityName, active && styles.rowTextActive]} numberOfLines={1}>
                    {city}
                  </Text>
                  {row.showState ? (
                    <Text style={styles.rowSub} numberOfLines={1}>
                      {state}
                    </Text>
                  ) : null}
                </View>
                {active ? (
                  <Ionicons name="checkmark" size={18} color={colors.brand} />
                ) : null}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  safe: { flex: 1, backgroundColor: colors.white },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 12,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.ink,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  searchWrap: {
    marginHorizontal: 18,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  gpsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  gpsCopy: { flex: 1, minWidth: 0 },
  gpsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.brand,
  },
  gpsSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    marginTop: 18,
    marginBottom: 10,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
    backgroundColor: colors.white,
  },
  chipActive: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  chipTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.brand,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  backCount: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 10,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  cityCopy: { flex: 1, minWidth: 0 },
  rowText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  cityName: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  rowTextActive: {
    fontFamily: fonts.semiBold,
    color: colors.brand,
  },
  rowSub: {
    marginTop: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  rowMeta: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  customText: {
    color: colors.brand,
  },
  empty: {
    paddingVertical: 24,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.7 },
  disabled: { opacity: 0.6 },
}));

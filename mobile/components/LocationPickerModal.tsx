import { useMemo, useState } from 'react';
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
import { POPULAR_CITIES } from '../lib/cityCoords';
import { fonts } from '../constants/typography';
import { useAppLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function LocationPickerModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const location = useAppLocation();
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);

  const cities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [...POPULAR_CITIES];
    const filtered = POPULAR_CITIES.filter((c) => c.toLowerCase().includes(q));
    if (q.length >= 2 && !filtered.some((c) => c.toLowerCase() === q)) {
      return [query.trim(), ...filtered];
    }
    return filtered;
  }, [query]);

  const pickCity = async (city: string) => {
    if (!city.trim() || busy) return;
    setBusy(true);
    try {
      await location.setManualLocation({ city: city.trim() });
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
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <Text style={styles.sub}>
          Businesses and distances update for the city you pick.
        </Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={18} color={colors.textSoft} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search city…"
            placeholderTextColor={colors.textSoft}
            style={styles.input}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
            onSubmitEditing={() => {
              if (query.trim()) void pickCity(query.trim());
            }}
          />
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.gpsRow,
            pressed && styles.pressed,
            busy && styles.disabled,
          ]}
          onPress={() => void useCurrent()}
          disabled={busy}
        >
          <View style={styles.gpsIcon}>
            <Ionicons name="navigate" size={18} color={colors.brand} />
          </View>
          <View style={styles.gpsCopy}>
            <Text style={styles.gpsTitle}>Use current location</Text>
            <Text style={styles.gpsSub}>
              {location.source === 'gps' && (location.area || location.city)
                ? `Now: ${location.label}`
                : 'Detect with GPS'}
            </Text>
          </View>
          {busy ? (
            <ActivityIndicator color={colors.brand} />
          ) : (
            <Ionicons name="chevron-forward" size={18} color={colors.textSoft} />
          )}
        </Pressable>

        <Text style={styles.section}>Popular cities</Text>

        <FlatList
          data={cities}
          keyExtractor={(item) => item}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const active =
              location.city?.toLowerCase() === item.toLowerCase();
            return (
              <Pressable
                style={({ pressed }) => [
                  styles.cityRow,
                  active && styles.cityRowActive,
                  pressed && styles.pressed,
                ]}
                onPress={() => void pickCity(item)}
                disabled={busy}
              >
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={active ? colors.brand : colors.textMuted}
                />
                <Text
                  style={[styles.cityText, active && styles.cityTextActive]}
                >
                  {item}
                </Text>
                {active ? (
                  <Ionicons name="checkmark-circle" size={18} color={colors.brand} />
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
    paddingTop: 8,
    paddingBottom: 4,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 20,
    color: colors.ink,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  sub: {
    paddingHorizontal: 18,
    marginBottom: 14,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  searchWrap: {
    marginHorizontal: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    padding: 0,
  },
  gpsRow: {
    marginHorizontal: 18,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.brandSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  gpsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  gpsCopy: { flex: 1, minWidth: 0 },
  gpsTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  gpsSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textMuted,
  },
  section: {
    paddingHorizontal: 18,
    marginBottom: 8,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  list: {
    paddingHorizontal: 18,
    paddingBottom: 24,
    gap: 4,
  },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  cityRowActive: {
    backgroundColor: colors.brandSoft,
  },
  cityText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
  cityTextActive: {
    color: colors.brand,
    fontFamily: fonts.semiBold,
  },
  pressed: { opacity: 0.88 },
  disabled: { opacity: 0.65 },
}));

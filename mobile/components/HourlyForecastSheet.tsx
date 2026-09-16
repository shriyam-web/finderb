import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WeatherChipOrb } from './ClimateHeaderBackdrop';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import type { HourlyForecastHour, LocalWeather } from '../lib/weather';

type Props = {
  visible: boolean;
  weather: LocalWeather;
  placeLabel?: string | null;
  onClose: () => void;
};

function HourColumn({ hour }: { hour: HourlyForecastHour }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const temp =
    hour.temperatureC != null && Number.isFinite(hour.temperatureC)
      ? `${Math.round(hour.temperatureC)}°`
      : '—';

  return (
    <View style={styles.hour}>
      <Text style={styles.hourLabel} numberOfLines={1}>
        {hour.label}
      </Text>
      <WeatherChipOrb night={!hour.isDay} size={18} />
      <Text style={styles.hourTemp}>{temp}</Text>
      <Text style={styles.hourSky} numberOfLines={1}>
        {hour.skyLabel}
      </Text>
      {hour.precipChance != null && hour.precipChance > 0 ? (
        <Text style={[styles.hourPrecip, { color: colors.textSoft }]}>
          {hour.precipChance}%
        </Text>
      ) : (
        <Text style={styles.hourPrecip}> </Text>
      )}
    </View>
  );
}

export function HourlyForecastSheet({
  visible,
  weather,
  placeLabel,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const insets = useSafeAreaInsets();
  const hours = weather.hourly ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + 8 },
          ]}
        >
          <View style={styles.handle} />
          <View style={styles.head}>
            <View style={styles.headCopy}>
              <Text style={styles.title}>Rest of today</Text>
              {placeLabel ? (
                <Text style={styles.place} numberOfLines={1}>
                  {placeLabel}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={onClose} hitSlop={8} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.ink} />
            </Pressable>
          </View>

          {hours.length === 0 ? (
            <Text style={styles.empty}>
              Hourly forecast isn’t available yet. Check your location and try
              again.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.rail}
            >
              {hours.map((hour) => (
                <HourColumn key={`${hour.hour}-${hour.label}`} hour={hour} />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(12,10,9,0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
    marginBottom: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  headCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.heading,
  },
  place: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    paddingBottom: 8,
  },
  rail: {
    gap: 6,
    paddingBottom: 6,
  },
  hour: {
    width: 68,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
  },
  hourLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.textMuted,
  },
  hourTemp: {
    fontFamily: fonts.bold,
    fontSize: 18,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  hourSky: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.ink,
  },
  hourPrecip: {
    fontFamily: fonts.medium,
    fontSize: 10,
    minHeight: 14,
  },
}));

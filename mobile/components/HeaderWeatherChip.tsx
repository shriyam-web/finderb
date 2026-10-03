import { Pressable, StyleSheet, Text } from 'react-native';
import { fonts } from '../constants/typography';
import type { DayPart, SkyWeather } from '../lib/weather';
import { AnimatedWeatherGlyph } from './AnimatedWeatherGlyph';

export function HeaderWeatherChip({
  temp,
  night,
  skyWeather,
  dayPart,
  onLight,
  ink,
  background,
  border,
  onPress,
  accessibilityLabel,
}: {
  temp: string | null;
  night: boolean;
  skyWeather: SkyWeather;
  dayPart?: DayPart;
  /** Header has turned solid/light, so the icon needs darker strokes. */
  onLight: boolean;
  ink: string;
  background: string;
  border: string;
  onPress: () => void;
  accessibilityLabel: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: background, borderColor: border },
        pressed && styles.pressed,
      ]}
    >
      <AnimatedWeatherGlyph
        skyWeather={skyWeather}
        night={night}
        dayPart={dayPart}
        size={16}
        onLight={onLight}
      />
      {temp ? (
        <Text style={[styles.temp, { color: ink }]} numberOfLines={1}>
          {temp}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: 64,
    paddingLeft: 6,
    paddingRight: 7,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.75,
  },
  temp: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: -0.1,
  },
});

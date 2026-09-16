import { StyleSheet, TextStyle } from 'react-native';
import type { ColorTokens } from './colors';
import { lightColors } from './colors';

/** Plus Jakarta — regular / medium for UI, bold for page headlines. */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export function createTypeStyles(colors: ColorTokens) {
  return StyleSheet.create({
    hero: {
      fontFamily: fonts.semiBold,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.4,
      color: colors.ink,
    },
    title: {
      fontFamily: fonts.semiBold,
      fontSize: 22,
      lineHeight: 28,
      color: colors.ink,
    },
    section: {
      fontFamily: fonts.semiBold,
      fontSize: 18,
      lineHeight: 24,
      color: colors.ink,
    },
    body: {
      fontFamily: fonts.regular,
      fontSize: 15,
      lineHeight: 22,
      color: colors.textMuted,
    },
    label: {
      fontFamily: fonts.medium,
      fontSize: 13,
      color: colors.ink,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 12,
      color: colors.textMuted,
    },
    eyebrow: {
      fontFamily: fonts.medium,
      fontSize: 11,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      color: colors.textSoft,
    },
  });
}

/** @deprecated Prefer createTypeStyles(useTheme().colors) */
export const type = createTypeStyles(lightColors);

export function font(
  weight: keyof typeof fonts = 'regular',
  extra?: TextStyle,
): TextStyle {
  return { fontFamily: fonts[weight], ...extra };
}

import { StyleSheet, TextStyle } from 'react-native';
import { colors } from '../constants/colors';

/** Single-font UI: Plus Jakarta Sans */
export const fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const type = StyleSheet.create({
  hero: {
    fontFamily: fonts.extraBold,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.2,
    color: colors.ink,
  },
  title: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 32,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  section: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  body: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: colors.textMuted,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  caption: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  eyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: colors.mangoDeep,
  },
});

export function font(
  weight: keyof typeof fonts = 'regular',
  extra?: TextStyle,
): TextStyle {
  return { fontFamily: fonts[weight], ...extra };
}

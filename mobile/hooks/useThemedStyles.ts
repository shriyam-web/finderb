import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import {
  type ColorTokens,
  type GradientTokens,
} from '../constants/colors';
import { useTheme } from '../context/ThemeContext';

type NamedStyles<T> = {
  [P in keyof T]: ViewStyle | TextStyle | ImageStyle;
};

/**
 * Rebuild StyleSheet whenever the active palette changes.
 * Pass a factory that closes over `colors` / `gradients` from the theme.
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ColorTokens, gradients: GradientTokens) => T,
): T {
  const { colors, gradients, resolved } = useTheme();
  return useMemo(
    () => StyleSheet.create(factory(colors, gradients)),
    // factory should be stable (module-level or createThemedStyles)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [colors, gradients, resolved],
  );
}

/** Stable factory helper — define outside component to avoid deps churn. */
export function createThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ColorTokens, gradients: GradientTokens) => T,
) {
  return function useStyles() {
    return useThemedStyles(factory);
  };
}

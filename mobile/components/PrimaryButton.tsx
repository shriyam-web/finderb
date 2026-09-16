import { ActivityIndicator, Pressable, Text, ViewStyle } from 'react-native';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'dark' | 'success';
  style?: ViewStyle;
};

const useStyles = createThemedStyles((colors) => ({
  base: {
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: colors.ink,
  },
  secondary: {
    backgroundColor: colors.canvasDeep,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  dark: {
    backgroundColor: colors.night,
  },
  success: {
    backgroundColor: colors.success,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.985 }],
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontFamily: fonts.semiBold,
    color: colors.onDark,
    fontSize: 15,
    letterSpacing: -0.1,
  },
  labelDark: {
    color: colors.ink,
  },
}));

export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const isDisabled = disabled || loading;
  const lightLabel = variant === 'secondary' || variant === 'ghost';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'accent' && styles.primary,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        variant === 'dark' && styles.dark,
        variant === 'success' && styles.success,
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={lightLabel ? colors.ink : colors.onDark} />
      ) : (
        <Text style={[styles.label, lightLabel && styles.labelDark]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

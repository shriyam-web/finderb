import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

type Props = {
  mode: 'login' | 'signup';
  loading?: 'google' | 'truecaller' | null;
  disabled?: boolean;
  onGoogle: () => void;
  onTruecaller: () => void;
};

export function SocialAuthButtons({
  mode,
  loading = null,
  disabled,
  onGoogle,
  onTruecaller,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const busy = Boolean(loading) || disabled;
  const googleLabel =
    mode === 'signup' ? 'Sign up with Google' : 'Continue with Google';
  const truecallerLabel =
    mode === 'signup' ? 'Sign up with Truecaller' : 'Continue with Truecaller';

  return (
    <View style={styles.wrap}>
      <Pressable
        style={({ pressed }) => [
          styles.btn,
          styles.googleBtn,
          pressed && !busy && styles.pressed,
          busy && styles.disabled,
        ]}
        onPress={onGoogle}
        disabled={busy}
        accessibilityLabel={googleLabel}
      >
        {loading === 'google' ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <Ionicons name="logo-google" size={20} color="#4285F4" />
            <Text style={styles.googleText}>{googleLabel}</Text>
          </>
        )}
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.btn,
          styles.truecallerBtn,
          pressed && !busy && styles.pressed,
          busy && styles.disabled,
        ]}
        onPress={onTruecaller}
        disabled={busy}
        accessibilityLabel={truecallerLabel}
      >
        {loading === 'truecaller' ? (
          <ActivityIndicator color={colors.onDark} />
        ) : (
          <>
            <Ionicons name="call" size={18} color={colors.onDark} />
            <Text style={styles.truecallerText}>{truecallerLabel}</Text>
          </>
        )}
      </Pressable>
    </View>
  );
}

export function AuthDivider() {
  const styles = useStyles();
  return (
    <View style={styles.divider}>
      <View style={styles.line} />
      <Text style={styles.or}>or</Text>
      <View style={styles.line} />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  wrap: {
    gap: 12,
    marginBottom: 4,
  },
  btn: {
    minHeight: 52,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
  },
  googleBtn: {
    backgroundColor: colors.white,
    borderColor: colors.borderStrong,
  },
  truecallerBtn: {
    backgroundColor: '#0087FF',
    borderColor: '#0087FF',
  },
  googleText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  truecallerText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.55 },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  line: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
  },
  or: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
}));

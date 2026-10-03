import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import type { WhatsAppAudience } from '../lib/authApi';
import type { AuthUser } from '../lib/session';
import { WhatsAppOtpSheet } from './WhatsAppOtpSheet';

function GoogleG({ size = 20 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

type Props = {
  mode: 'login' | 'signup';
  audience: WhatsAppAudience;
  loading?: 'google' | 'truecaller' | null;
  disabled?: boolean;
  onGoogle: () => void;
  onTruecaller: () => void;
  onBeforeWhatsApp?: () => boolean;
  onWhatsAppSuccess: (user: AuthUser) => void;
  fontFamily?: string;
};

export function SocialAuthButtons({
  mode,
  audience,
  loading = null,
  disabled,
  onGoogle,
  onTruecaller,
  onBeforeWhatsApp,
  onWhatsAppSuccess,
  fontFamily,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
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
            <GoogleG size={20} />
            <Text style={[styles.googleText, fontFamily ? { fontFamily } : null]}>{googleLabel}</Text>
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
        <LinearGradient
          colors={['#1A9BFF', '#0074E8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.truecallerFill}
        >
          {loading === 'truecaller' ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="call" size={18} color="#FFFFFF" />
              <Text style={[styles.truecallerText, fontFamily ? { fontFamily } : null]}>{truecallerLabel}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>

      <Pressable
        style={({ pressed }) => [
          styles.btn,
          styles.whatsappBtn,
          pressed && !busy && styles.pressed,
          busy && styles.disabled,
        ]}
        onPress={() => {
          if (onBeforeWhatsApp && !onBeforeWhatsApp()) return;
          setWhatsAppOpen(true);
        }}
        disabled={busy}
        accessibilityLabel={mode === 'signup' ? 'Sign up with WhatsApp' : 'Continue with WhatsApp'}
      >
        <Ionicons name="logo-whatsapp" size={20} color="#FFFFFF" />
        <Text style={[styles.whatsappText, fontFamily ? { fontFamily } : null]}>
          {mode === 'signup' ? 'Sign up with WhatsApp' : 'Continue with WhatsApp'}
        </Text>
      </Pressable>
      <WhatsAppOtpSheet
        visible={whatsAppOpen}
        audience={audience}
        onClose={() => setWhatsAppOpen(false)}
        onSuccess={(user) => {
          setWhatsAppOpen(false);
          onWhatsAppSuccess(user);
        }}
      />
    </View>
  );
}

export function AuthDivider({ fontFamily }: { fontFamily?: string }) {
  const styles = useStyles();
  return (
    <View style={styles.divider}>
      <View style={styles.line} />
      <Text style={[styles.or, fontFamily ? { fontFamily } : null]}>or</Text>
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
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 14,
    overflow: 'hidden',
  },
  googleBtn: {
    backgroundColor: '#FFFFFF',
    borderColor: '#747775',
  },
  truecallerBtn: {
    backgroundColor: '#0074E8',
    borderColor: '#0074E8',
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  truecallerFill: {
    width: '100%',
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  googleText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#1F1F1F',
  },
  truecallerText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  whatsappBtn: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  whatsappText: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: '#FFFFFF',
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

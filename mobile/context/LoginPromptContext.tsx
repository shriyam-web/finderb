import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Href, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { useAuth } from '../context/AuthContext';

type LoginPromptContextValue = {
  requestLogin: (returnTo?: string) => void;
};

const LoginPromptContext = createContext<LoginPromptContextValue | null>(null);

export function LoginPromptProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const styles = useStyles();
  const [open, setOpen] = useState(false);
  const [returnTo, setReturnTo] = useState<string | undefined>();

  const requestLogin = useCallback(
    (next?: string) => {
      if (user) return;
      setReturnTo(next);
      setOpen(true);
    },
    [user],
  );

  const goLogin = () => {
    setOpen(false);
    router.push({
      pathname: '/login',
      params: returnTo ? { returnTo } : {},
    } as Href);
  };

  const goSignup = () => {
    setOpen(false);
    router.push({
      pathname: '/signup',
      params: returnTo ? { returnTo } : {},
    } as Href);
  };

  const value = useMemo(() => ({ requestLogin }), [requestLogin]);

  return (
    <LoginPromptContext.Provider value={value}>
      {children}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={styles.card}>
            <LinearGradient
              colors={['#0B1F2A', '#163A4A', '#0F766E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.hero}
            >
              <View style={styles.glowA} />
              <View style={styles.glowB} />
              <View style={styles.markRow}>
                <View style={styles.markDot} />
                <Text style={styles.mark}>FinderB</Text>
              </View>
              <Text style={styles.hook}>Your city,{'\n'}unlocked.</Text>
            </LinearGradient>

            <View style={styles.actions}>
              <Pressable
                style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
                onPress={goLogin}
              >
                <Text style={styles.primaryText}>Continue</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.ghost, pressed && styles.pressed]}
                onPress={goSignup}
              >
                <Text style={styles.ghostText}>New here?</Text>
              </Pressable>
              <Pressable onPress={() => setOpen(false)} hitSlop={10} style={styles.dismiss}>
                <Text style={styles.dismissText}>Browse as guest</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LoginPromptContext.Provider>
  );
}

export function useLoginPrompt() {
  const ctx = useContext(LoginPromptContext);
  if (!ctx) {
    throw new Error('useLoginPrompt must be used within LoginPromptProvider');
  }
  return ctx;
}

const useStyles = createThemedStyles((colors) => ({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: 'rgba(8, 12, 16, 0.72)',
  },
  card: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  hero: {
    paddingHorizontal: 26,
    paddingTop: 30,
    paddingBottom: 34,
    minHeight: 210,
    justifyContent: 'flex-end',
  },
  glowA: {
    position: 'absolute',
    top: -50,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(242,180,90,0.28)',
  },
  glowB: {
    position: 'absolute',
    bottom: 20,
    left: -60,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(45,212,191,0.16)',
  },
  markRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  markDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F2B45A',
  },
  mark: {
    fontFamily: fonts.extraBold,
    fontSize: 15,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.88)',
  },
  hook: {
    fontFamily: fonts.extraBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    color: '#fff',
  },
  actions: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    gap: 8,
    backgroundColor: colors.surface,
  },
  primary: {
    minHeight: 54,
    borderRadius: 16,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.onDark,
  },
  ghost: {
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
  },
  dismiss: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  dismissText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  pressed: { opacity: 0.88 },
}));

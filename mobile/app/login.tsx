import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthAlert } from '../components/AuthField';
import { LoginHeroArt } from '../components/LoginHeroArt';
import { SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/typography';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { markGuestMode } from '../lib/onboarding';
import { SITE_URL } from '../lib/supabase';
import { getStoredToken, getStoredUser, type AuthUser } from '../lib/session';

export default function LoginScreen() {
  const { colors, gradients, isDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { returnTo, fromPrompt } = useLocalSearchParams<{
    returnTo?: string;
    fromPrompt?: string;
  }>();
  const bottomInset = useBottomInset(18);
  const { signInWithGoogle, signInWithTruecaller, user, refresh } = useAuth();

  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState<'google' | 'truecaller' | null>(
    null,
  );

  const sheetRise = useRef(new Animated.Value(40)).current;
  const sheetFade = useRef(new Animated.Value(0)).current;
  const formScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(sheetFade, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(sheetRise, {
        toValue: 0,
        duration: 480,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [sheetFade, sheetRise]);

  const finishOk = (account?: AuthUser | null) => {
    const signedIn = account ?? user;
    if (signedIn?.isBusinessAccount) {
      router.replace('/merchant-welcome' as never);
      return;
    }
    if (typeof returnTo === 'string' && returnTo.startsWith('/')) {
      router.replace(returnTo as never);
      return;
    }
    router.replace('/(tabs)/home');
  };

  // Deep-link / AuthSession races can leave us on login after a successful session.
  useEffect(() => {
    if (!user) return;
    setSocialLoading(null);
    finishOk(user);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate once when session appears
  }, [user]);

  const skipAsGuest = async () => {
    await markGuestMode();
    if (fromPrompt === '1' && router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/home');
  };

  const requireAgreement = () => {
    if (!agreed) {
      setError('Please agree to Terms and Conditions to continue.');
      return false;
    }
    return true;
  };

  const runSocial = async (kind: 'google' | 'truecaller') => {
    if (!requireAgreement()) return;
    setError('');
    setSocialLoading(kind);
    try {
      const result = kind === 'google' ? await signInWithGoogle() : await signInWithTruecaller();
      if (result.success) {
        finishOk(result.user);
        return;
      }
      // The deep-link screen may have finished sign-in while this flow reported a failure.
      await refresh();
      if (await getStoredToken()) {
        finishOk(await getStoredUser());
        return;
      }
      setError(result.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGoogle = () => runSocial('google');
  const handleTruecaller = () => runSocial('truecaller');

  const openLink = (path: string) => {
    void Linking.openURL(`${SITE_URL}${path}`);
  };

  const busy = Boolean(socialLoading);

  return (
    <View style={styles.root}>
      <StatusBar style={colors.statusBarStyle} />
      <LinearGradient
        colors={[...gradients.warmWash]}
        locations={[0, 0.45, 1]}
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          isDark ? 'rgba(249,184,100,0.14)' : 'rgba(249,184,100,0.22)',
          'transparent',
          isDark ? 'rgba(15,118,110,0.1)' : 'rgba(15,118,110,0.08)',
        ]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.skipRow}>
          <Pressable
            onPress={() => void skipAsGuest()}
            style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
            hitSlop={8}
            accessibilityLabel="Skip login"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>
        <View style={styles.hero}>
          <LoginHeroArt />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.sheetFlex}
        behavior="padding"
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 20}
      >
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: bottomInset,
              opacity: sheetFade,
              transform: [{ translateY: sheetRise }],
            },
          ]}
        >
          <ScrollView
            ref={formScrollRef}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={[
              styles.sheetScroll,
            ]}
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="automatic"
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.headline}>Welcome back</Text>
            <Text style={styles.subhead}>
              Pick up your saved places, reviews, and local searches.
            </Text>

            {error ? (
              <View style={styles.alertWrap}>
                <AuthAlert message={error} />
              </View>
            ) : null}

            <SocialAuthButtons
              mode="login"
              audience="user"
              loading={socialLoading}
              disabled={busy}
              onGoogle={() => void handleGoogle()}
              onTruecaller={() => void handleTruecaller()}
              onBeforeWhatsApp={requireAgreement}
              onWhatsAppSuccess={(account) => finishOk(account)}
            />

            <View style={styles.termsRow}>
              <Pressable
                onPress={() => setAgreed((v) => !v)}
                hitSlop={8}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                accessibilityLabel="Agree to the Terms and Conditions and Privacy Policy"
              >
                <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
                  {agreed ? <Text style={styles.checkMark}>✓</Text> : null}
                </View>
              </Pressable>
              <Text style={styles.termsText} onPress={() => setAgreed((v) => !v)}>
                I agree to the{' '}
                <Text style={styles.link} onPress={() => openLink('/terms')}>
                  Terms and Conditions
                </Text>{' '}
                and{' '}
                <Text style={styles.link} onPress={() => openLink('/privacy')}>
                  Privacy Policy
                </Text>
              </Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New here? </Text>
              <Pressable onPress={() => router.push('/signup')} hitSlop={6}>
                <Text style={styles.footerLink}>Create account</Text>
              </Pressable>
            </View>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: {
    flex: 1,
    backgroundColor: colors.canvasWarm,
  },
  safeTop: {
    flex: 0.34,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  skipBtn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  skipText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.heading,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 8,
  },
  heroCompact: {
    paddingHorizontal: 22,
    paddingBottom: 8,
  },
  heroCompactTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  sheetFlex: {
    flex: 0.66,
  },
  sheetFlexExpanded: {
    flex: 1,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -18,
    paddingHorizontal: 22,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    shadowColor: colors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  sheetScroll: {
    paddingBottom: 48,
    flexGrow: 1,
  },
  sheetScrollForm: {
    paddingBottom: 160,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.borderStrong,
    marginBottom: 16,
    opacity: 0.7,
  },
  headline: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.heading,
    textAlign: 'center',
  },
  subhead: {
    marginTop: 6,
    marginBottom: 18,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  alertWrap: {
    marginBottom: 12,
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginTop: 18,
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  checkboxOn: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkMark: {
    color: colors.frost,
    fontSize: 12,
    fontFamily: fonts.bold,
    lineHeight: 14,
  },
  termsText: {
    flexShrink: 1,
    fontFamily: fonts.medium,
    fontSize: 12.5,
    lineHeight: 18,
    color: colors.textMuted,
  },
  link: {
    fontFamily: fonts.semiBold,
    color: colors.heading,
    textDecorationLine: 'underline',
  },
  emailToggle: {
    alignItems: 'center',
    paddingVertical: 6,
    marginBottom: 8,
  },
  emailToggleText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.brand,
  },
  emailBlock: {
    gap: 2,
    marginBottom: 8,
    paddingBottom: 24,
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    marginTop: -4,
  },
  forgotText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.brand,
  },
  submit: {
    minHeight: 48,
    borderRadius: 12,
    marginTop: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  footerLink: {
    fontFamily: fonts.semiBold,
    color: colors.brand,
    fontSize: 13,
  },
  pressed: { opacity: 0.9 },
}));

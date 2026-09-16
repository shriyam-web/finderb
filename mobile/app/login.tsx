import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
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
import { AuthAlert, AuthField, PasswordToggle } from '../components/AuthField';
import { LoginHeroArt } from '../components/LoginHeroArt';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthDivider, SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { fonts } from '../constants/typography';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { markGuestMode } from '../lib/onboarding';
import { SITE_URL } from '../lib/supabase';

export default function LoginScreen() {
  const { colors, gradients, isDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const bottomInset = useBottomInset(18);
  const { signIn, signInWithGoogle, signInWithTruecaller, user, refresh } =
    useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (!showEmailForm) return;
    const t = setTimeout(() => {
      formScrollRef.current?.scrollToEnd({ animated: true });
    }, 180);
    return () => clearTimeout(t);
  }, [showEmailForm]);

  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => {
          formScrollRef.current?.scrollToEnd({ animated: true });
        }, Platform.OS === 'ios' ? 50 : 120);
      },
    );
    return () => show.remove();
  }, []);

  const finishOk = () => {
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
    finishOk();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- navigate once when session appears
  }, [user]);

  const skipAsGuest = async () => {
    await markGuestMode();
    router.replace('/(tabs)/home');
  };

  const requireAgreement = () => {
    if (!agreed) {
      setError('Please agree to Terms and Conditions to continue.');
      return false;
    }
    return true;
  };

  const handleEmailLogin = async () => {
    if (!requireAgreement()) return;
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await signIn(email.trim(), password);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    finishOk();
  };

  const handleGoogle = async () => {
    if (!requireAgreement()) return;
    setError('');
    setSocialLoading('google');
    const result = await signInWithGoogle();
    if (result.success) {
      setSocialLoading(null);
      finishOk();
      return;
    }
    // Deep-link callback may have already signed us in while AuthSession reported cancel.
    await refresh();
    const { getStoredToken } = await import('../lib/session');
    if (await getStoredToken()) {
      setSocialLoading(null);
      finishOk();
      return;
    }
    setSocialLoading(null);
    setError(result.error);
  };

  const handleTruecaller = async () => {
    if (!requireAgreement()) return;
    setError('');
    setSocialLoading('truecaller');
    const result = await signInWithTruecaller();
    if (result.success) {
      setSocialLoading(null);
      finishOk();
      return;
    }
    await refresh();
    const { getStoredToken } = await import('../lib/session');
    if (await getStoredToken()) {
      setSocialLoading(null);
      finishOk();
      return;
    }
    setSocialLoading(null);
    setError(result.error);
  };

  const openLink = (path: string) => {
    void Linking.openURL(`${SITE_URL}${path}`);
  };

  const busy = Boolean(socialLoading) || loading;
  const truecallerHint =
    Platform.OS !== 'android'
      ? 'Truecaller one-tap is available on Android'
      : 'Uses the Truecaller app on this phone';

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
        {!showEmailForm ? (
          <View style={styles.hero}>
            <LoginHeroArt />
          </View>
        ) : (
          <View style={styles.heroCompact}>
            <Text style={styles.heroCompactTitle}>Sign in with email</Text>
          </View>
        )}
      </SafeAreaView>

      <KeyboardAvoidingView
        style={[styles.sheetFlex, showEmailForm && styles.sheetFlexExpanded]}
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
              showEmailForm && styles.sheetScrollForm,
            ]}
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="automatic"
          >
            <View style={styles.sheetHandle} />
            <Text style={styles.headline}>{"India's trusted local guide"}</Text>
            <Text style={styles.subhead}>Sign in to save favourites and reviews</Text>

            {error ? (
              <View style={styles.alertWrap}>
                <AuthAlert message={error} />
              </View>
            ) : null}

            <SocialAuthButtons
              mode="login"
              loading={socialLoading}
              disabled={busy}
              onGoogle={() => void handleGoogle()}
              onTruecaller={() => void handleTruecaller()}
            />

            <Text style={styles.hint}>{truecallerHint}</Text>

            <Pressable
              style={styles.termsRow}
              onPress={() => setAgreed((v) => !v)}
              hitSlop={4}
            >
              <View style={[styles.checkbox, agreed && styles.checkboxOn]}>
                {agreed ? <Text style={styles.checkMark}>✓</Text> : null}
              </View>
              <Text style={styles.termsText}>I Agree to Terms and Conditions</Text>
            </Pressable>

            <View style={styles.linksRow}>
              <Pressable onPress={() => openLink('/terms')} hitSlop={6}>
                <Text style={styles.link}>{"T&C's"}</Text>
              </Pressable>
              <Pressable onPress={() => openLink('/privacy')} hitSlop={6}>
                <Text style={styles.link}>Privacy policy</Text>
              </Pressable>
            </View>

            <AuthDivider />

            <Pressable
              onPress={() => setShowEmailForm((v) => !v)}
              style={styles.emailToggle}
            >
              <Text style={styles.emailToggleText}>
                {showEmailForm ? 'Hide email sign in' : 'Or sign in with email'}
              </Text>
            </Pressable>

            {showEmailForm ? (
              <View style={styles.emailBlock}>
                <AuthField
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  autoComplete="email"
                  onFocus={() =>
                    setTimeout(
                      () => formScrollRef.current?.scrollToEnd({ animated: true }),
                      100,
                    )
                  }
                />
                <AuthField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  secureTextEntry={!showPassword}
                  textContentType="password"
                  autoComplete="password"
                  onFocus={() =>
                    setTimeout(
                      () => formScrollRef.current?.scrollToEnd({ animated: true }),
                      100,
                    )
                  }
                  rightSlot={
                    <PasswordToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                    />
                  }
                />
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: '/forgot-password',
                      params: email.trim() ? { email: email.trim() } : {},
                    })
                  }
                  hitSlop={8}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </Pressable>
                <PrimaryButton
                  label="Sign in with email"
                  onPress={() => void handleEmailLogin()}
                  loading={loading}
                  disabled={Boolean(socialLoading)}
                  style={styles.submit}
                />
              </View>
            ) : null}

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
  hint: {
    marginTop: 10,
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
    textAlign: 'center',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 10,
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
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 22,
    marginBottom: 4,
  },
  link: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
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

import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { AuthAlert, AuthField, PasswordToggle } from '../components/AuthField';
import { LoginHeroArt } from '../components/LoginHeroArt';
import { PrimaryButton } from '../components/PrimaryButton';
import { AuthDivider, SocialAuthButtons } from '../components/SocialAuthButtons';
import { useAuth } from '../context/AuthContext';
import { fonts } from '../constants/typography';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { markGuestMode } from '../lib/onboarding';
import { SITE_URL } from '../lib/supabase';

const HERO_BLUE = ['#1478C8', '#1E8ADB', '#3AA0E8'] as const;

function passwordStrength(password: string): { label: string; level: 0 | 1 | 2 | 3 } {
  if (!password) return { label: '', level: 0 };
  let score = 0;
  if (password.length >= 6) score += 1;
  if (password.length >= 10) score += 1;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 1) return { label: 'Basic', level: 1 };
  if (score === 2) return { label: 'Good', level: 2 };
  return { label: 'Strong', level: 3 };
}

export default function SignupScreen() {
  const styles = useStyles();
  const router = useRouter();
  const bottomInset = useBottomInset(18);
  const { signUp, signInWithGoogle, signInWithTruecaller, user, refresh } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'truecaller' | null>(
    null,
  );

  const sheetRise = useRef(new Animated.Value(40)).current;
  const sheetFade = useRef(new Animated.Value(0)).current;
  const strength = useMemo(() => passwordStrength(password), [password]);

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

  const finishOk = () => {
    router.replace('/(tabs)/home');
  };

  useEffect(() => {
    if (!user) return;
    setSocialLoading(null);
    finishOk();
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

  const handleSignup = async () => {
    if (!requireAgreement()) return;
    if (!name.trim() || !email.trim() || !password) {
      setError('Fill in name, email, and password.');
      setSuccess('');
      return;
    }
    if (password.length < 6) {
      setError('Password needs at least 6 characters.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);
    const result = await signUp({
      fullName: name.trim(),
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess('Account ready. Taking you in…');
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
      <StatusBar style="light" />
      <LinearGradient
        colors={[...HERO_BLUE]}
        locations={[0, 0.55, 1]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <SafeAreaView style={styles.safeTop} edges={['top']}>
        <View style={styles.skipRow}>
          <Pressable
            onPress={() => void skipAsGuest()}
            style={({ pressed }) => [styles.skipBtn, pressed && styles.pressed]}
            hitSlop={8}
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
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
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
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.sheetScroll}
            automaticallyAdjustKeyboardInsets
            contentInsetAdjustmentBehavior="automatic"
          >
            <Text style={styles.headline}>Create your FinderB account</Text>
            <Text style={styles.subhead}>
              Save favourites, write reviews, and get local picks
            </Text>

            {error ? (
              <View style={styles.alertWrap}>
                <AuthAlert message={error} />
              </View>
            ) : null}
            {success ? (
              <View style={styles.alertWrap}>
                <AuthAlert message={success} tone="success" />
              </View>
            ) : null}

            <SocialAuthButtons
              mode="signup"
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
                {showEmailForm ? 'Hide email signup' : 'Or sign up with email'}
              </Text>
            </Pressable>

            {showEmailForm ? (
              <View style={styles.emailBlock}>
                <AuthField
                  label="Full name"
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  autoCapitalize="words"
                  textContentType="name"
                  autoComplete="name"
                />
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
                />
                <AuthField
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 6 characters"
                  secureTextEntry={!showPassword}
                  textContentType="newPassword"
                  autoComplete="password-new"
                  rightSlot={
                    <PasswordToggle
                      visible={showPassword}
                      onToggle={() => setShowPassword((v) => !v)}
                    />
                  }
                />
                {password ? (
                  <View style={styles.strengthWrap}>
                    <View style={styles.strengthBars}>
                      {[1, 2, 3].map((level) => (
                        <View
                          key={level}
                          style={[
                            styles.strengthBar,
                            level <= strength.level &&
                              strength.level === 1 &&
                              styles.strengthWeak,
                            level <= strength.level &&
                              strength.level === 2 &&
                              styles.strengthMid,
                            level <= strength.level &&
                              strength.level === 3 &&
                              styles.strengthStrong,
                          ]}
                        />
                      ))}
                    </View>
                    <Text style={styles.strengthLabel}>{strength.label}</Text>
                  </View>
                ) : null}
                <PrimaryButton
                  label="Create account"
                  onPress={() => void handleSignup()}
                  loading={loading}
                  disabled={Boolean(socialLoading)}
                  style={styles.submit}
                />
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Have an account? </Text>
              <Pressable onPress={() => router.push('/login')} hitSlop={6}>
                <Text style={styles.footerLink}>Sign in</Text>
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
    backgroundColor: '#1478C8',
  },
  safeTop: {
    flex: 0.38,
  },
  skipRow: {
    alignItems: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 4,
  },
  skipBtn: {
    backgroundColor: 'rgba(10,48,86,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 999,
  },
  skipText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.white,
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
  },
  sheetFlex: {
    flex: 0.62,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.surface,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -18,
    paddingHorizontal: 22,
    paddingTop: 22,
    shadowColor: '#0A2844',
    shadowOpacity: 0.14,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  sheetScroll: {
    paddingBottom: 12,
  },
  headline: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.4,
    color: colors.ink,
    textAlign: 'center',
  },
  subhead: {
    marginTop: 6,
    marginBottom: 16,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
  alertWrap: { marginBottom: 10 },
  hint: {
    marginTop: 10,
    marginBottom: 14,
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
    backgroundColor: '#1E8ADB',
    borderColor: '#1E8ADB',
  },
  checkMark: {
    color: colors.white,
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
  },
  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  strengthWeak: { backgroundColor: colors.heat },
  strengthMid: { backgroundColor: colors.accent },
  strengthStrong: { backgroundColor: colors.success },
  strengthLabel: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    minWidth: 40,
    textAlign: 'right',
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

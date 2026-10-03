import { useRouter } from 'expo-router';
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
import { fonts } from '../constants/typography';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { markGuestMode } from '../lib/onboarding';
import { SITE_URL } from '../lib/supabase';
import { getStoredToken, getStoredUser, type AuthUser } from '../lib/session';

const HERO_BLUE = ['#1478C8', '#1E8ADB', '#3AA0E8'] as const;

export default function SignupScreen() {
  const styles = useStyles();
  const router = useRouter();
  const bottomInset = useBottomInset(18);
  const { signInWithGoogle, signInWithTruecaller, user, refresh } = useAuth();

  const [agreed, setAgreed] = useState(true);
  const [error, setError] = useState('');
  const [socialLoading, setSocialLoading] = useState<'google' | 'truecaller' | null>(
    null,
  );

  const sheetRise = useRef(new Animated.Value(40)).current;
  const sheetFade = useRef(new Animated.Value(0)).current;
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
    router.replace('/(tabs)/home');
  };

  useEffect(() => {
    if (!user) return;
    setSocialLoading(null);
    finishOk(user);
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
          <LoginHeroArt tone="blue" />
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
            <Text style={styles.headline}>Join FinderB</Text>
            <Text style={styles.subhead}>
              Save places, follow offers, and search your city in one tap.
            </Text>

            {error ? (
              <View style={styles.alertWrap}>
                <AuthAlert message={error} />
              </View>
            ) : null}
            <SocialAuthButtons
              mode="signup"
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
    paddingBottom: 8,
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

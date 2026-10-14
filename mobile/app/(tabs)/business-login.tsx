import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { AuthAlert, AuthField, PasswordToggle } from '../../components/AuthField';
import { AuthDivider, SocialAuthButtons } from '../../components/SocialAuthButtons';
import { bizColors, useBizColors } from '../../constants/businessColors';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import type { AuthUser } from '../../lib/session';

export default function BusinessLoginScreen() {
  const styles = useStyles();
  const biz = useBizColors();
  const router = useRouter();
  const { signIn, signInWithGoogle, signInWithTruecaller, signOut } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<'google' | 'truecaller' | null>(null);

  const acceptMerchant = async (account: AuthUser | null | undefined) => {
    if (!account?.isBusinessAccount) {
      await signOut();
      setError(
        'This account is not a FinderB business. Use the work email from registration, or register your business.',
      );
      return;
    }
    router.replace('/merchant-welcome');
  };

  const handleEmail = async () => {
    const workEmail = email.trim();
    const workPassword = password.trim();
    if (!workEmail || !workPassword) {
      setError('Enter your email or mobile number and password.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await signIn(workEmail, workPassword);
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await acceptMerchant(result.user);
  };

  const runSocial = async (kind: 'google' | 'truecaller') => {
    setError('');
    setSocialLoading(kind);
    try {
      const result = kind === 'google' ? await signInWithGoogle() : await signInWithTruecaller();
      if (!result.success) {
        setError(result.error);
        return;
      }
      await acceptMerchant(result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed. Please try again.');
    } finally {
      setSocialLoading(null);
    }
  };

  const handleGoogle = () => runSocial('google');
  const handleTruecaller = () => runSocial('truecaller');

  const busy = loading || Boolean(socialLoading);
  const bottomPad = useTabScrollPadding(16);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.brand}>
            <Pressable
              onPress={() => router.back()}
              hitSlop={10}
              style={styles.back}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={biz.ink} />
            </Pressable>
            <Image
              source={require('../../assets/fb-mark-240.png')}
              style={styles.mark}
              contentFit="contain"
            />
            <Text style={styles.brandText}>Business</Text>
          </View>
          <Text style={styles.title}>Business login</Text>
          <Text style={styles.sub}>
            Sign in with the email or mobile number from registration, or use Google, Truecaller, or WhatsApp.
          </Text>

          {error ? (
            <View style={styles.alert}>
              <AuthAlert message={error} />
            </View>
          ) : null}

          <AuthField
            fontFamily={fonts.medium}
            label="Email or mobile number"
            value={email}
            onChangeText={setEmail}
            onEndEditing={(event) => setEmail(event.nativeEvent.text.trim())}
            placeholder="you@business.com or 9876543210"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
            autoComplete="username"
          />
          <AuthField
            fontFamily={fonts.medium}
            label="Password"
            value={password}
            onChangeText={setPassword}
            onEndEditing={(event) => setPassword(event.nativeEvent.text.trim())}
            placeholder="Your password"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="password"
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
                params: { for: 'business', email: email.trim().toLowerCase() },
              })
            }
            hitSlop={8}
            style={styles.forgotBtn}
            accessibilityRole="button"
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed, busy && styles.disabled]}
            onPress={() => void handleEmail()}
            disabled={busy}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Sign in</Text>
            )}
          </Pressable>

          <AuthDivider fontFamily={fonts.medium} />

          <SocialAuthButtons
            mode="login"
            audience="business"
            fontFamily={fonts.medium}
            loading={socialLoading}
            disabled={busy}
            onGoogle={() => void handleGoogle()}
            onTruecaller={() => void handleTruecaller()}
            onWhatsAppSuccess={(account) => void acceptMerchant(account)}
          />

          <Pressable
            onPress={() => router.push('/(tabs)/business-register')}
            style={styles.switch}
          >
            <Text style={styles.switchText}>New business? Register</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => {
  const b = bizColors(colors);
  return {
  safe: { flex: 1, backgroundColor: b.page },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 18, paddingTop: 4 },
  back: {
    width: 36,
    height: 36,
    marginLeft: -8,
    marginRight: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
  },
  mark: { width: 28, height: 28 },
  brandText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: b.blue,
  },
  title: {
    fontFamily: fonts.medium,
    fontSize: 30,
    letterSpacing: -0.4,
    color: colors.heading,
  },
  sub: {
    marginTop: 8,
    marginBottom: 20,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 22,
    color: b.body,
  },
  alert: { marginBottom: 12 },
  forgotBtn: { alignSelf: 'flex-end', marginTop: -2, marginBottom: 8, paddingVertical: 4 },
  forgotText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: b.blue,
  },
  primaryBtn: {
    marginTop: 6,
    minHeight: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: b.blueFill,
  },
  primaryText: {
    fontFamily: fonts.medium,
    fontSize: 16,
    color: b.onFill,
  },
  pressed: { opacity: 0.9 },
  disabled: { opacity: 0.7 },
  switch: { alignItems: 'center', paddingVertical: 18 },
  switchText: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: b.blue,
  },
};
});

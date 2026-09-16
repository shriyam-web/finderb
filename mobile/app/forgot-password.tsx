import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthAlert, AuthField } from '../components/AuthField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { requestPasswordReset } from '../lib/authApi';

export default function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const bottomInset = useBottomInset(20);
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError('');
    setInfo('');
    const result = await requestPasswordReset(email.trim());
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.next === 'oauth') {
      setInfo(result.message);
      return;
    }
    if (result.next === 'code') {
      router.push({
        pathname: '/reset-password',
        params: { email: email.trim() },
      });
      return;
    }
    setInfo(result.message);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Forgot password"
          subtitle="We’ll email a 6-digit code if this account uses a password"
          variant="page"
        />
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.card, { paddingBottom: bottomInset }]}>
            {error ? <AuthAlert message={error} /> : null}
            {info ? <AuthAlert message={info} tone="success" /> : null}
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
            <PrimaryButton
              label="Send reset code"
              onPress={() => void handleSubmit()}
              loading={loading}
            />
            <Pressable onPress={() => router.push('/login')} hitSlop={8} style={styles.backLink}>
              <Text style={[styles.backText, { color: colors.brand }]}>Back to sign in</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  body: { flex: 1 },
  card: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  backLink: {
    alignItems: 'center',
    marginTop: 16,
  },
  backText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
  },
}));

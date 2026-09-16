import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthAlert, AuthField, PasswordToggle } from '../components/AuthField';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { useBottomInset } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { resetPasswordWithCode } from '../lib/authApi';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string }>();
  const bottomInset = useBottomInset(20);
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async () => {
    if (password !== confirm) {
      setError('New password and confirmation do not match.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    const result = await resetPasswordWithCode({
      email: email.trim(),
      code: code.trim(),
      password,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSuccess('Password updated. You can sign in now.');
    setTimeout(() => router.replace('/login'), 800);
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Reset password"
          subtitle="Enter the code from your email and a new password"
          variant="page"
        />
        <KeyboardAvoidingView
          style={styles.body}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={[styles.card, { paddingBottom: bottomInset }]}>
            {error ? <AuthAlert message={error} /> : null}
            {success ? <AuthAlert message={success} tone="success" /> : null}
            <AuthField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
            />
            <AuthField
              label="6-digit code"
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              placeholder="123456"
            />
            <AuthField
              label="New password"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 8 characters"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              rightSlot={
                <PasswordToggle
                  visible={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              }
            />
            <AuthField
              label="Confirm password"
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!showPassword}
              textContentType="newPassword"
            />
            <PrimaryButton
              label="Update password"
              onPress={() => void handleSubmit()}
              loading={loading}
            />
            <Pressable
              onPress={() => router.push('/forgot-password')}
              hitSlop={8}
              style={styles.backLink}
            >
              <Text style={[styles.backText, { color: colors.brand }]}>Need a new code?</Text>
            </Pressable>
            <Text style={styles.help}>
              Didn’t get the email? Check spam or write to support@finderb.com
            </Text>
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
  help: {
    marginTop: 14,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSoft,
    textAlign: 'center',
  },
}));

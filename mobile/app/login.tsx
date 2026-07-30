import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthAlert, AuthField, PasswordToggle } from '../components/AuthField';
import { AuthShell } from '../components/AuthShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setError('');
    setLoading(true);

    // Placeholder auth — wire to FinderB backend later.
    setTimeout(() => {
      setLoading(false);
      router.replace('/(tabs)/home');
    }, 700);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to pick up saved places, reviews, and favourites."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>New to FinderB? </Text>
          <Pressable onPress={() => router.push('/signup')}>
            <Text style={styles.footerLink}>Create an account</Text>
          </Pressable>
        </View>
      }
    >
      {error ? <AuthAlert message={error} /> : null}

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
        placeholder="Enter your password"
        secureTextEntry={!showPassword}
        textContentType="password"
        autoComplete="password"
        rightSlot={
          <PasswordToggle
            visible={showPassword}
            onToggle={() => setShowPassword((v) => !v)}
          />
        }
      />

      <Pressable style={styles.forgot}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>

      <PrimaryButton
        label="Sign in"
        onPress={handleLogin}
        loading={loading}
        style={styles.submit}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <PrimaryButton
        label="Continue as guest"
        onPress={() => router.replace('/(tabs)/home')}
        variant="secondary"
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  forgot: {
    alignSelf: 'flex-end',
    marginBottom: 18,
    marginTop: -4,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.mangoDeep,
  },
  submit: {
    marginTop: 2,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  footerText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  footerLink: {
    color: colors.mangoDeep,
    fontWeight: '800',
    fontSize: 14,
  },
});

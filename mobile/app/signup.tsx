import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AuthAlert, AuthField, PasswordToggle } from '../components/AuthField';
import { AuthShell } from '../components/AuthShell';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in name, email, and password.');
      setSuccess('');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      setSuccess('');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    // Placeholder signup — wire to FinderB backend later.
    setTimeout(() => {
      setLoading(false);
      setSuccess('Account ready. Taking you in…');
      setTimeout(() => router.replace('/(tabs)/home'), 500);
    }, 800);
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Save favourites, write reviews, and find trusted local businesses."
      footer={
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Pressable onPress={() => router.push('/login')}>
            <Text style={styles.footerLink}>Sign in</Text>
          </Pressable>
        </View>
      }
    >
      {error ? <AuthAlert message={error} /> : null}
      {success ? <AuthAlert message={success} tone="success" /> : null}

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

      <Text style={styles.hint}>
        By continuing you agree to FinderB's Terms and Privacy Policy.
      </Text>

      <PrimaryButton
        label="Create account"
        onPress={handleSignup}
        loading={loading}
        style={styles.submit}
      />

      <View style={styles.divider}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <PrimaryButton
        label="Browse without account"
        onPress={() => router.replace('/(tabs)/home')}
        variant="secondary"
      />
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginTop: 2,
    marginBottom: 16,
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSoft,
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

import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { SITE_URL } from '../../lib/supabase';
import { Field } from '../../components/console/kit';
import { PrimaryButton } from '../../components/PrimaryButton';

export default function BusinessInviteScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { signIn } = useAuth();
  const { token: tokenParam } = useLocalSearchParams<{ token?: string }>();
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    let cancelled = false;
    void fetch(`${SITE_URL}/api/business/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'preview', token }),
    })
      .then((res) => res.json())
      .then((data: { success?: boolean; error?: string; businessName?: string; email?: string | null; mobile?: string | null }) => {
        if (cancelled) return;
        setLoading(false);
        if (!data.success) {
          setError(data.error || 'This invite is not valid.');
          return;
        }
        setBusinessName(data.businessName || 'this business');
        setLoginId(data.email || data.mobile || '');
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          setError('Could not open this invite.');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const submit = async () => {
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`${SITE_URL}/api/business/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ action: 'accept', token, password }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!data.success) {
        setError(data.error || 'Could not accept the invite.');
        setSaving(false);
        return;
      }
      if (loginId) {
        const login = await signIn(loginId, password);
        setSaving(false);
        if (!login.success) {
          router.replace('/(tabs)/business-login' as Href);
          return;
        }
      }
      router.replace('/business-console' as Href);
    } catch {
      setSaving(false);
      setError('Could not accept the invite.');
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        <Text style={styles.title}>Join this FinderB Business profile</Text>
        {loading ? (
          <ActivityIndicator color={colors.ink} />
        ) : (
          <>
            <Text style={styles.body}>
              {businessName
                ? `Create your own password to use ${businessName}${loginId ? ` as ${loginId}` : ''}.`
                : error}
            </Text>
            {businessName ? (
              <>
                <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
                <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <PrimaryButton label="Create password and continue" onPress={() => void submit()} disabled={saving} />
              </>
            ) : (
              <Pressable onPress={() => router.replace('/(tabs)/home' as Href)}>
                <Text style={styles.link}>Back to FinderB</Text>
              </Pressable>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  inner: { padding: 24, gap: 14 },
  title: { fontFamily: fonts.semiBold, fontSize: 22, color: colors.ink },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  error: { fontFamily: fonts.medium, fontSize: 13, color: '#B91C1C' },
  link: { fontFamily: fonts.semiBold, fontSize: 15, color: colors.primary },
}));

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useStackBottomPadding } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { deleteMobileAccount } from '../lib/notificationsApi';
import { SITE_URL } from '../lib/supabase';

export default function DeleteAccountScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const bottomPad = useStackBottomPadding(24);
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const canDelete = confirmText.trim().toUpperCase() === 'DELETE';

  const handleDelete = useCallback(() => {
    if (!canDelete || loading) return;
    Alert.alert(
      'Delete account?',
      'This permanently removes your FinderB profile, saved places, and app sign-in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            const result = await deleteMobileAccount();
            setLoading(false);
            if (!result.success) {
              Alert.alert('Could not delete', result.error);
              return;
            }
            await signOut();
            router.replace('/welcome');
          },
        },
      ],
    );
  }, [canDelete, loading, router, signOut]);

  if (!user) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader title="Delete account" subtitle="Google Play requirement" variant="page" />
          <View style={[styles.empty, { paddingBottom: bottomPad }]}>
            <Text style={styles.title}>Sign in first</Text>
            <Text style={styles.body}>
              Use the same account as the FinderB app, then confirm deletion.
            </Text>
            <PrimaryButton label="Sign in" onPress={() => router.push('/login')} />
            <Pressable onPress={() => Linking.openURL(`${SITE_URL}/account-deletion`)}>
              <Text style={styles.link}>Or delete from the website</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader title="Delete account" subtitle={user.email} variant="page" />
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: bottomPad }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="warning-outline" size={22} color={colors.heading} />
            </View>
            <Text style={styles.title}>This cannot be undone</Text>
            <Text style={styles.body}>
              We will delete your FinderB user account, saved places, and sign-in on this phone and
              the website. Public reviews may stay on business pages without your name.
            </Text>
            <Text style={styles.label}>Type DELETE to confirm</Text>
            <TextInput
              value={confirmText}
              onChangeText={setConfirmText}
              autoCapitalize="characters"
              autoCorrect={false}
              style={styles.input}
              placeholder="DELETE"
              placeholderTextColor={colors.textSoft}
            />
            {loading ? (
              <ActivityIndicator color={colors.ink} style={{ marginTop: 16 }} />
            ) : (
              <PrimaryButton
                label="Delete my account"
                onPress={handleDelete}
                disabled={!canDelete}
                style={styles.deleteBtn}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  empty: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center' as const,
    gap: 12,
  },
  card: {
    marginTop: 8,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.muted,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.heading,
    marginBottom: 8,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
    marginBottom: 16,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.heading,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.heading,
    backgroundColor: colors.canvas,
  },
  deleteBtn: {
    marginTop: 16,
    backgroundColor: '#B91C1C',
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center' as const,
    marginTop: 8,
  },
}));

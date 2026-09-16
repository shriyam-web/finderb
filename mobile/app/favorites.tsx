import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { CategoryMerchantRow } from '../components/CategoryMerchantRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { ScreenHeader } from '../components/ScreenHeader';
import { fonts } from '../constants/typography';
import { useAuth } from '../context/AuthContext';
import { useLoginPrompt } from '../context/LoginPromptContext';
import { useAppLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';
import { useTabScrollPadding } from '../hooks/useAppSafeArea';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { fetchMerchantsByIds } from '../lib/api';
import { fetchFavoriteIds } from '../lib/favoritesApi';
import { formatDistanceFromUser } from '../lib/geo';
import type { Merchant } from '../lib/merchants';
import { resolveMerchantSlug } from '../lib/merchants';

export default function FavouritesScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const { requestLogin } = useLoginPrompt();
  const location = useAppLocation();
  const pad = useTabScrollPadding(28);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!user) {
      setMerchants([]);
      setLoading(false);
      return;
    }
    setError('');
    const ids = await fetchFavoriteIds();
    if (!('favoriteIds' in ids)) {
      setError(ids.error);
      setMerchants([]);
      setLoading(false);
      return;
    }
    const result = await fetchMerchantsByIds(ids.favoriteIds);
    if (result.error) setError(result.error);
    setMerchants(result.merchants);
    setLoading(false);
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load]),
  );

  if (!user) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top']}>
          <ScreenHeader
            title="Favourites"
            subtitle="Places you save on FinderB"
            variant="page"
          />
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Sign in to save places</Text>
            <Text style={styles.emptyBody}>
              Favourites sync to your FinderB account so you can find them later.
            </Text>
            <PrimaryButton label="Sign in" onPress={() => requestLogin('/favorites')} />
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScreenHeader
          title="Favourites"
          subtitle="Places you saved"
          variant="page"
        />
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.ink} />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: pad, gap: 8 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  void load().finally(() => setRefreshing(false));
                }}
                tintColor={colors.brand}
              />
            }
          >
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {merchants.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="heart-outline" size={28} color={colors.brand} />
                <Text style={styles.emptyTitle}>No saved places yet</Text>
                <Text style={styles.emptyBody}>
                  Tap the heart on a business profile to save it here.
                </Text>
                <Pressable onPress={() => router.push('/(tabs)/categories' as Href)}>
                  <Text style={styles.link}>Browse businesses</Text>
                </Pressable>
              </View>
            ) : (
              merchants.map((merchant) => (
                <CategoryMerchantRow
                  key={merchant.id}
                  merchant={merchant}
                  distanceLabel={formatDistanceFromUser(
                    location.coords,
                    merchant.latitude,
                    merchant.longitude,
                  )}
                  contactRevealed
                  onPress={() =>
                    router.push(
                      `/(tabs)/merchant/${resolveMerchantSlug(merchant)}` as Href,
                    )
                  }
                />
              ))
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 28,
    paddingTop: 32,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 18,
    color: colors.heading,
    textAlign: 'center',
  },
  emptyBody: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 8,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.danger,
    marginBottom: 8,
  },
  link: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.brand,
  },
}));

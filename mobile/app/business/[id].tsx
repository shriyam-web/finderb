import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { fetchMerchantBySlugOrId } from '../../lib/api';
import type { Merchant } from '../../lib/merchants';
import { useBottomInset } from '../../hooks/useAppSafeArea';

export default function MerchantProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const bottomPad = useBottomInset(24);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) {
        setError('Invalid merchant');
        setLoading(false);
        return;
      }
      setLoading(true);
      const result = await fetchMerchantBySlugOrId(String(id));
      if (cancelled) return;
      if (result.merchant) {
        setMerchant(result.merchant);
        setError('');
      } else {
        setMerchant(null);
        setError(result.error || 'Merchant not found');
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.mango} size="large" />
        <Text style={styles.loadingText}>Loading merchant…</Text>
      </View>
    );
  }

  if (!merchant) {
    return (
      <SafeAreaView style={styles.safe}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </Pressable>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>Merchant not found</Text>
          <Text style={styles.errorCopy}>{error}</Text>
          <PrimaryButton label="Go back" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: bottomPad + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          {merchant.image ? (
            <Image
              source={{ uri: merchant.image }}
              style={styles.heroImage}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[colors.mango, colors.heat]}
              style={styles.heroImage}
            />
          )}
          <LinearGradient
            colors={['transparent', 'rgba(28,20,16,0.85)']}
            style={styles.heroShade}
          />
          <SafeAreaView edges={['top']} style={styles.heroTop}>
            <Pressable style={styles.backChip} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={18} color={colors.ink} />
            </Pressable>
          </SafeAreaView>
          <View style={styles.heroBottom}>
            <Text style={styles.name}>{merchant.name}</Text>
            <View style={styles.badgeRow}>
              {merchant.isVerified ? (
                <View style={styles.badge}>
                  <Ionicons name="checkmark-circle" size={14} color={colors.teal} />
                  <Text style={styles.badgeText}>Verified</Text>
                </View>
              ) : null}
              {merchant.rating != null ? (
                <View style={styles.badge}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.badgeText}>
                    {merchant.rating.toFixed(1)}
                    {merchant.reviewsCount
                      ? ` · ${merchant.reviewsCount} reviews`
                      : ''}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.content}>
          <Text style={styles.category}>{merchant.category || 'Business'}</Text>
          <View style={styles.locRow}>
            <Ionicons name="location" size={16} color={colors.mangoDeep} />
            <Text style={styles.location}>
              {merchant.location || merchant.city || 'India'}
            </Text>
          </View>

          {merchant.about ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.about}>{merchant.about}</Text>
            </View>
          ) : null}

          {merchant.discountRange &&
          merchant.discountRange !== 'No Discount' &&
          merchant.discountRange !== 'Seasonal Offer' ? (
            <View style={styles.offerBox}>
              <Text style={styles.offerLabel}>Offer</Text>
              <Text style={styles.offerValue}>{merchant.discountRange}</Text>
            </View>
          ) : null}

          {merchant.contact ? (
            <PrimaryButton
              label={`Call ${merchant.contact}`}
              onPress={() => Linking.openURL(`tel:${merchant.contact}`)}
              style={styles.callBtn}
            />
          ) : (
            <PrimaryButton
              label="Contact coming soon"
              onPress={() => {}}
              variant="secondary"
              disabled
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas, padding: 20 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
  },
  loadingText: {
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    marginTop: 10,
  },
  errorTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
  },
  errorCopy: {
    fontFamily: fonts.medium,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  hero: {
    height: 280,
    backgroundColor: colors.ink,
  },
  heroImage: {
    ...StyleSheet.absoluteFill,
  },
  heroShade: {
    ...StyleSheet.absoluteFill,
  },
  heroTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backChip: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  heroBottom: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
  },
  name: {
    fontFamily: fonts.extraBold,
    fontSize: 28,
    color: colors.white,
    letterSpacing: -0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  badgeText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },
  content: {
    padding: 20,
  },
  category: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.mangoDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  location: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textMuted,
  },
  section: { marginTop: 22 },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
  },
  about: {
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
  },
  offerBox: {
    marginTop: 18,
    backgroundColor: colors.heatSoft,
    borderRadius: 16,
    padding: 14,
  },
  offerLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.heat,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  offerValue: {
    marginTop: 4,
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.ink,
  },
  callBtn: { marginTop: 22 },
});

import { Href, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FinderBLogo } from '../../components/BrandMark';
import { MerchantCard } from '../../components/MerchantCard';
import { categories, homeGridCategories } from '../../constants/categories';
import { colors, gradients } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { fetchFeaturedMerchants } from '../../lib/api';
import type { Merchant } from '../../lib/merchants';
import { resolveMerchantSlug } from '../../lib/merchants';

const { width } = Dimensions.get('window');
const FEATURE_W = width * 0.42;

const PLACEHOLDERS = [
  'dentist near me',
  'best biryani',
  'AC repair today',
  'salon open now',
];

const TRENDING = [
  { label: 'Emergency dentists', trend: 42, color: '#EF4444' },
  { label: 'Late-night cafes', trend: 28, color: '#F59E0B' },
  { label: 'Home AC service', trend: 35, color: '#0EA5E9' },
  { label: 'Wedding photographers', trend: 19, color: '#8B5CF6' },
];

const QUICK = [
  { label: 'Near me', icon: 'navigate' as const, tint: colors.mangoSoft, iconColor: colors.mangoDeep },
  { label: 'Open now', icon: 'time' as const, tint: colors.tealSoft, iconColor: colors.tealDeep },
  { label: 'Top rated', icon: 'star' as const, tint: '#FFF3C4', iconColor: '#D97706' },
  { label: 'Offers', icon: 'pricetag' as const, tint: colors.heatSoft, iconColor: colors.heat },
];

export default function HomeScreen() {
  const router = useRouter();
  const [hintIndex, setHintIndex] = useState(0);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(true);
  const [merchantsError, setMerchantsError] = useState('');
  const scrollBottomPad = useTabScrollPadding(28);

  const fade = useRef(new Animated.Value(0)).current;
  const rise = useRef(new Animated.Value(28)).current;
  const orb = useRef(new Animated.Value(0)).current;
  const hintFade = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 550, useNativeDriver: true }),
      Animated.spring(rise, { toValue: 0, friction: 8, tension: 50, useNativeDriver: true }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(orb, { toValue: 1, duration: 3600, useNativeDriver: true }),
          Animated.timing(orb, { toValue: 0, duration: 3600, useNativeDriver: true }),
        ]),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.06, duration: 1200, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        ]),
      ),
    ]).start();
  }, [fade, rise, orb, pulse]);

  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(hintFade, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        setHintIndex((i) => (i + 1) % PLACEHOLDERS.length);
        Animated.timing(hintFade, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      });
    }, 2600);
    return () => clearInterval(id);
  }, [hintFade]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMerchantsLoading(true);
      const result = await fetchFeaturedMerchants(12);
      if (cancelled) return;
      setMerchants(result.merchants);
      setMerchantsError(result.error || '');
      setMerchantsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const orbX = orb.interpolate({ inputRange: [0, 1], outputRange: [0, 22] });
  const orbY = orb.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });

  const openMerchant = (merchant: Merchant) => {
    const slug = resolveMerchantSlug(merchant);
    router.push(`/business/${slug}` as Href);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[...gradients.soft]} style={StyleSheet.absoluteFill} />

      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View style={{ opacity: fade, transform: [{ translateY: rise }] }}>
            <View style={styles.hero}>
              <Animated.View
                style={[
                  styles.orb,
                  styles.orbOne,
                  { transform: [{ translateX: orbX }, { translateY: orbY }] },
                ]}
              />
              <View style={[styles.orb, styles.orbTwo]} />

              <View style={styles.topBar}>
                <View style={styles.brandRow}>
                  <FinderBLogo size={34} />
                  <Text style={styles.brandWord}>
                    Finder<Text style={styles.brandB}>B</Text>
                  </Text>
                </View>
                <Pressable style={styles.signInChip} onPress={() => router.push('/login')}>
                  <Text style={styles.signInText}>Sign in</Text>
                </Pressable>
              </View>

              <Pressable style={styles.locationChip}>
                <Ionicons name="location" size={14} color={colors.mangoDeep} />
                <Text style={styles.locationText}>Detecting your city…</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
              </Pressable>

              <Text style={styles.headline}>
                Find it{'\n'}
                <Text style={styles.headlineAccent}>before you go</Text>
              </Text>
              <Text style={styles.subhead}>
                Trusted local businesses, verified reviews, and AI that actually gets you.
              </Text>

              <Pressable style={styles.searchBox} onPress={() => router.push('/(tabs)/ai')}>
                <View style={styles.searchIcon}>
                  <Ionicons name="search" size={18} color={colors.mangoDeep} />
                </View>
                <View style={styles.searchCopy}>
                  <Text style={styles.searchLabel}>Search FinderB</Text>
                  <Animated.Text style={[styles.searchPlaceholder, { opacity: hintFade }]}>
                    Try “{PLACEHOLDERS[hintIndex]}”
                  </Animated.Text>
                </View>
                <Animated.View style={[styles.micBtn, { transform: [{ scale: pulse }] }]}>
                  <Ionicons name="mic" size={16} color={colors.white} />
                </Animated.View>
              </Pressable>

              <View style={styles.quickRow}>
                {QUICK.map((item) => (
                  <Pressable
                    key={item.label}
                    style={styles.quickChip}
                    onPress={() => router.push('/(tabs)/categories')}
                  >
                    <View style={[styles.quickIcon, { backgroundColor: item.tint }]}>
                      <Ionicons name={item.icon} size={14} color={item.iconColor} />
                    </View>
                    <Text style={styles.quickText}>{item.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Categories */}
            <View style={styles.sectionPad}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>Start here</Text>
                  <Text style={styles.sectionTitle}>Hot right now</Text>
                </View>
                <Pressable
                  style={styles.viewAllBtn}
                  onPress={() => router.push('/(tabs)/categories')}
                >
                  <Text style={styles.viewAll}>All</Text>
                  <Ionicons name="arrow-forward" size={14} color={colors.tealDeep} />
                </Pressable>
              </View>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featureRow}
              decelerationRate="fast"
              snapToInterval={FEATURE_W + 12}
            >
              {categories.slice(0, 6).map((cat) => (
                <Pressable
                  key={cat.id}
                  style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}
                  onPress={() => router.push('/(tabs)/categories')}
                >
                  <LinearGradient
                    colors={[`${cat.color}28`, `${cat.color}10`]}
                    style={styles.featureGrad}
                  >
                    <View style={[styles.featureIcon, { backgroundColor: colors.white }]}>
                      <Ionicons
                        name={cat.icon as keyof typeof Ionicons.glyphMap}
                        size={26}
                        color={cat.color}
                      />
                    </View>
                    <Text style={styles.featureName}>{cat.name}</Text>
                    <Text style={styles.featureSub}>{cat.subtitle}</Text>
                  </LinearGradient>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.section}>
              <View style={styles.grid}>
                {homeGridCategories.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={({ pressed }) => [styles.gridTile, pressed && styles.pressed]}
                    onPress={() => router.push('/(tabs)/categories')}
                  >
                    <View style={[styles.gridIcon, { backgroundColor: `${cat.color}20` }]}>
                      <Ionicons
                        name={cat.icon as keyof typeof Ionicons.glyphMap}
                        size={20}
                        color={cat.color}
                      />
                    </View>
                    <Text style={styles.gridName} numberOfLines={1}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
                <Pressable
                  style={({ pressed }) => [styles.gridTile, styles.gridMore, pressed && styles.pressed]}
                  onPress={() => router.push('/(tabs)/categories')}
                >
                  <View style={[styles.gridIcon, { backgroundColor: colors.ink }]}>
                    <Ionicons name="apps" size={18} color={colors.white} />
                  </View>
                  <Text style={styles.gridName}>More</Text>
                </Pressable>
              </View>
            </View>

            {/* Real merchants */}
            <View style={styles.sectionPad}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionEyebrow}>Verified</Text>
                  <Text style={styles.sectionTitle}>Featured merchants</Text>
                </View>
              </View>
            </View>

            {merchantsLoading ? (
              <View style={styles.merchantLoading}>
                <ActivityIndicator color={colors.mango} />
                <Text style={styles.merchantLoadingText}>Loading live listings…</Text>
              </View>
            ) : merchantsError && merchants.length === 0 ? (
              <View style={styles.merchantEmpty}>
                <Text style={styles.merchantEmptyText}>{merchantsError}</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.merchantRow}
              >
                {merchants.map((merchant) => (
                  <MerchantCard
                    key={merchant.id}
                    merchant={merchant}
                    onPress={() => openMerchant(merchant)}
                  />
                ))}
              </ScrollView>
            )}

            {/* Trending */}
            <View style={styles.section}>
              <View style={styles.trendingCard}>
                <Text style={styles.sectionEyebrow}>Pulse</Text>
                <Text style={[styles.sectionTitle, { marginBottom: 8 }]}>Trending this week</Text>
                {TRENDING.map((item, idx) => (
                  <Pressable
                    key={item.label}
                    style={[
                      styles.trendRow,
                      idx === TRENDING.length - 1 && styles.trendRowLast,
                    ]}
                    onPress={() => router.push('/(tabs)/ai')}
                  >
                    <Text style={styles.trendRank}>{idx + 1}</Text>
                    <View style={[styles.trendDot, { backgroundColor: item.color }]} />
                    <Text style={styles.trendLabel}>{item.label}</Text>
                    <View style={styles.trendBadge}>
                      <Ionicons name="trending-up" size={12} color={colors.tealDeep} />
                      <Text style={styles.trendPct}>+{item.trend}%</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>

            <LinearGradient colors={[...gradients.promo]} style={styles.promo}>
              <Text style={styles.promoEyebrow}>FinderB AI</Text>
              <Text style={styles.promoTitle}>Ask anything.{'\n'}Get places, not links.</Text>
              <Pressable
                style={styles.promoCta}
                onPress={() => router.push('/(tabs)/ai')}
              >
                <Text style={styles.promoCtaText}>Open AI search</Text>
                <Ionicons name="arrow-forward" size={16} color={colors.ink} />
              </Pressable>
            </LinearGradient>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1 },
  scroll: {},
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },

  hero: {
    paddingHorizontal: 20,
    paddingTop: 6,
    overflow: 'hidden',
  },
  orb: { position: 'absolute', borderRadius: 999 },
  orbOne: {
    width: width * 0.55,
    height: width * 0.55,
    top: -50,
    right: -70,
    backgroundColor: '#FFB07A',
    opacity: 0.38,
  },
  orbTwo: {
    width: 140,
    height: 140,
    top: 140,
    left: -60,
    backgroundColor: '#FF8A9B',
    opacity: 0.2,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandWord: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.6,
  },
  brandB: { color: colors.mango },
  signInChip: {
    backgroundColor: colors.ink,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
  },
  signInText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 13,
  },
  locationChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.75)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
  },
  locationText: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.ink,
  },
  headline: {
    fontFamily: fonts.extraBold,
    fontSize: 42,
    lineHeight: 46,
    color: colors.ink,
    letterSpacing: -1.4,
  },
  headlineAccent: { color: colors.mangoDeep },
  subhead: {
    marginTop: 10,
    fontFamily: fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    maxWidth: 340,
    marginBottom: 18,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingLeft: 8,
    paddingRight: 8,
    minHeight: 64,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.mangoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchCopy: { flex: 1 },
  searchLabel: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.mangoDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  searchPlaceholder: {
    marginTop: 2,
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
    fontSize: 14,
  },
  micBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 14,
  },
  quickIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickText: {
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.ink,
  },

  section: { paddingHorizontal: 20, marginTop: 22 },
  sectionPad: { paddingHorizontal: 20, marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionEyebrow: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.mangoDeep,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  sectionTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 22,
    color: colors.ink,
    letterSpacing: -0.4,
  },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewAll: {
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.tealDeep,
  },

  featureRow: { paddingLeft: 20, paddingRight: 8, gap: 12 },
  featureCard: {
    width: FEATURE_W,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureGrad: { padding: 16, minHeight: 150 },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  featureName: {
    fontFamily: fonts.extraBold,
    fontSize: 17,
    color: colors.ink,
  },
  featureSub: {
    marginTop: 4,
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  gridTile: {
    width: '23%',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridMore: { backgroundColor: colors.canvasDeep },
  gridIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  gridName: {
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.ink,
    textAlign: 'center',
  },

  merchantRow: { paddingLeft: 20, paddingRight: 8, gap: 12 },
  merchantLoading: {
    marginHorizontal: 20,
    paddingVertical: 28,
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchantLoadingText: {
    fontFamily: fonts.semiBold,
    color: colors.textMuted,
  },
  merchantEmpty: {
    marginHorizontal: 20,
    padding: 18,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  merchantEmptyText: {
    fontFamily: fonts.medium,
    color: colors.textMuted,
    fontSize: 13,
  },

  trendingCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  trendRowLast: { borderBottomWidth: 0 },
  trendRank: {
    width: 18,
    fontFamily: fonts.bold,
    fontSize: 13,
    color: colors.textSoft,
  },
  trendDot: { width: 8, height: 8, borderRadius: 4 },
  trendLabel: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.tealSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  trendPct: {
    fontFamily: fonts.bold,
    fontSize: 11,
    color: colors.tealDeep,
  },

  promo: {
    marginHorizontal: 20,
    marginTop: 22,
    borderRadius: 26,
    padding: 22,
  },
  promoEyebrow: {
    fontFamily: fonts.bold,
    color: colors.mango,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  promoTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 26,
    lineHeight: 32,
    color: colors.white,
    marginBottom: 18,
  },
  promoCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  promoCtaText: {
    fontFamily: fonts.bold,
    fontSize: 14,
    color: colors.ink,
  },
});

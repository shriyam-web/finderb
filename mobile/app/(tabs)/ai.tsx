import AsyncStorage from '@react-native-async-storage/async-storage';
import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryMerchantRow } from '../../components/CategoryMerchantRow';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useLoginPrompt } from '../../context/LoginPromptContext';
import { useTheme } from '../../context/ThemeContext';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { useAppLocation } from '../../context/LocationContext';
import { getBusinessOpenStatus } from '../../lib/businessHours';
import {
  fetchExploreCategories,
  parseAiSearchIntents,
  runAiSearch,
  type AiSearchIntent,
  type HomeCategory,
} from '../../lib/api';
import { formatDistanceFromUser, getDistanceKm } from '../../lib/geo';
import type { Merchant } from '../../lib/merchants';
import { resolveMerchantSlug } from '../../lib/merchants';
import { goBackOrHome } from '../../lib/navigation';
import { TabSwipeHost } from '../../lib/tabSwipe';
import {
  alertVoiceUnavailable,
  startVoiceSearch,
} from '../../lib/voiceSearch';

const RECENT_KEY = '@finderb/ai-recent-v1';
const MAX_RECENT = 8;

const HINTS = [
  'dentist open now near me',
  'best salon with reviews',
  'emergency plumber nearby',
  'verified CA in my area',
  'gym with good ratings',
  'restaurants with offers',
];

const SUGGESTIONS: Array<{
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: string;
}> = [
  {
    label: 'Dentists near me',
    hint: 'Open · rated · close by',
    icon: 'medkit-outline',
    tone: '#FEE2E2',
  },
  {
    label: 'Best restaurants',
    hint: 'Top rated dining',
    icon: 'restaurant-outline',
    tone: '#FEF3C7',
  },
  {
    label: 'Salon open now',
    hint: 'Ready to book today',
    icon: 'cut-outline',
    tone: '#FCE7F3',
  },
  {
    label: 'Emergency plumber',
    hint: 'Urgent help nearby',
    icon: 'water-outline',
    tone: '#DBEAFE',
  },
  {
    label: 'CA or accountant',
    hint: 'Trusted professionals',
    icon: 'calculator-outline',
    tone: '#E0E7FF',
  },
  {
    label: 'Gym with good reviews',
    hint: 'Fitness near you',
    icon: 'barbell-outline',
    tone: '#DCFCE7',
  },
];

const CAPABILITIES: Array<{
  title: string;
  body: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  {
    title: 'Natural asks',
    body: 'Talk like a human — “open dentist near me”.',
    icon: 'chatbubbles-outline',
  },
  {
    title: 'Smart ranking',
    body: 'Distance, ratings, and verified badges first.',
    icon: 'sparkles-outline',
  },
  {
    title: 'Live intent',
    body: 'Open now, offers, and nearest are understood.',
    icon: 'flash-outline',
  },
];

const MODIFIERS: Array<{
  id: AiSearchIntent;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'open-now', label: 'Open now', icon: 'time-outline' },
  { id: 'nearest', label: 'Nearest', icon: 'navigate-outline' },
  { id: 'top-rated', label: 'Top rated', icon: 'star-outline' },
  { id: 'verified', label: 'Verified', icon: 'shield-checkmark-outline' },
  { id: 'offers', label: 'Offers', icon: 'pricetag-outline' },
];

const CHIP_INTENTS = new Set(MODIFIERS.map((mod) => mod.id));

function merchantHasOffer(m: Merchant) {
  return (
    Boolean(m.discountRange) &&
    m.discountRange !== 'No Discount' &&
    m.discountRange !== 'Seasonal Offer'
  );
}

export default function AiScreen() {
  const { colors, gradients, isDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string }>();
  const location = useAppLocation();
  const { user } = useAuth();
  const { requestLogin: promptLogin } = useLoginPrompt();
  const signedIn = Boolean(user);
  const scrollBottomPad = useTabScrollPadding(24);
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<HomeCategory[]>([]);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [exactMatch, setExactMatch] = useState(true);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [popular, setPopular] = useState<HomeCategory[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [hintIndex, setHintIndex] = useState(0);
  const [modifiers, setModifiers] = useState<AiSearchIntent[]>([]);
  const [detectedIntents, setDetectedIntents] = useState<AiSearchIntent[]>([]);

  const composerPop = useRef(new Animated.Value(0)).current;
  const hintFade = useRef(new Animated.Value(1)).current;
  const scan = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(composerPop, {
        toValue: 1,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.loop(
        Animated.timing(scan, {
          toValue: 1,
          duration: 2800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
          Animated.timing(pulse, {
            toValue: 0,
            duration: 1400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
      ),
    ]).start();
  }, [composerPop, pulse, scan]);

  useEffect(() => {
    if (searched || query.length > 0) return;
    const id = setInterval(() => {
      Animated.timing(hintFade, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start(() => {
        setHintIndex((i) => (i + 1) % HINTS.length);
        Animated.timing(hintFade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    }, 3200);
    return () => clearInterval(id);
  }, [hintFade, query.length, searched]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [cats, stored] = await Promise.all([
        fetchExploreCategories(40),
        AsyncStorage.getItem(RECENT_KEY).catch(() => null),
      ]);
      if (cancelled) return;
      setPopular(
        cats.categories
          .filter((cat) => Boolean(cat.icon?.trim()))
          .sort((a, b) => (b.businessCount || 0) - (a.businessCount || 0))
          .slice(0, 12),
      );
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as string[];
          if (Array.isArray(parsed)) setRecent(parsed.filter(Boolean).slice(0, MAX_RECENT));
        } catch {
          /* ignore */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const rememberRecent = useCallback(async (q: string) => {
    setRecent((prev) => {
      const next = [q, ...prev.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(
        0,
        MAX_RECENT,
      );
      void AsyncStorage.setItem(RECENT_KEY, JSON.stringify(next)).catch(() => undefined);
      return next;
    });
  }, []);

  const runSearch = useCallback(
    async (raw: string, forceIntents?: AiSearchIntent[]) => {
      const q = raw.trim();
      if (!q) {
        setError('Ask FinderB anything — e.g. dentist open now near me');
        return;
      }

      Keyboard.dismiss();
      setLoading(true);
      setError('');
      setSearched(true);
      setQuery(q);

      const spoken = parseAiSearchIntents(q);
      const activeIntents =
        forceIntents ??
        spoken;
      const result = await runAiSearch(q, {
        coords: location.coords,
        city: location.city,
        forceIntents: activeIntents,
      });

      setCategories(result.categories);
      setMerchants(result.merchants);
      setExactMatch(result.exactMatch);
      setSearchNotice(result.notice);
      setDetectedIntents(result.intents);
      setModifiers(result.intents.filter((id) => CHIP_INTENTS.has(id)));
      setError(
        result.error && result.merchants.length === 0 && result.categories.length === 0
          ? result.error
          : '',
      );
      setLoading(false);
      void rememberRecent(q);
    },
    [location.city, location.coords, rememberRecent],
  );

  useEffect(() => {
    const initial = typeof params.q === 'string' ? params.q.trim() : '';
    if (!initial) return;
    setQuery(initial);
    void runSearch(initial);
  }, [params.q, runSearch]);

  const clearSearch = () => {
    setQuery('');
    setSearched(false);
    setCategories([]);
    setMerchants([]);
    setExactMatch(true);
    setSearchNotice(null);
    setDetectedIntents([]);
    setError('');
    inputRef.current?.focus();
  };

  const toggleModifier = (id: AiSearchIntent) => {
    setModifiers((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      if (searched && query.trim()) {
        void runSearch(query, next);
      }
      return next;
    });
  };

  const handleVoice = async () => {
    if (listening || loading) return;
    const result = await startVoiceSearch({ onListeningChange: setListening });
    if (!result.ok) {
      alertVoiceUnavailable(result.error);
      return;
    }
    setQuery(result.transcript);
    void runSearch(result.transcript);
  };

  const visibleMerchants = useMemo(() => {
    let list = [...merchants];
    const active = [...new Set([...modifiers, ...detectedIntents])];

    if (active.includes('open-now')) {
      list = list.filter((m) => getBusinessOpenStatus(m.timings).status === 'Open');
    }
    if (active.includes('top-rated')) {
      list = list.filter(
        (m) => m.rating != null && m.rating > 0 && m.rating >= 4.2,
      );
    }
    if (active.includes('verified')) {
      list = list.filter((m) => m.isVerified);
    }
    if (active.includes('offers')) {
      list = list.filter(merchantHasOffer);
    }

    if (active.includes('nearest') && location.coords) {
      const dist = (merchant: Merchant) => {
        if (
          merchant.latitude == null ||
          merchant.longitude == null ||
          (merchant.latitude === 0 && merchant.longitude === 0)
        ) {
          return Number.POSITIVE_INFINITY;
        }
        return getDistanceKm(
          location.coords!.lat,
          location.coords!.lng,
          merchant.latitude,
          merchant.longitude,
        );
      };
      list.sort((a, b) => dist(a) - dist(b));
    }

    return list;
  }, [detectedIntents, location.coords, merchants, modifiers]);

  const insights = useMemo(() => {
    if (!searched || loading || visibleMerchants.length === 0) return [];
    const openCount = visibleMerchants.filter(
      (m) => getBusinessOpenStatus(m.timings).status === 'Open',
    ).length;
    const verifiedCount = visibleMerchants.filter((m) => m.isVerified).length;
    const offerCount = visibleMerchants.filter(merchantHasOffer).length;
    const chips: string[] = [];
    if (openCount > 0) chips.push(`${openCount} open now`);
    if (verifiedCount > 0) chips.push(`${verifiedCount} verified`);
    if (offerCount > 0) chips.push(`${offerCount} with offers`);
    if (location.city) chips.push(`Near ${location.city}`);
    return chips.slice(0, 4);
  }, [loading, location.city, searched, visibleMerchants]);

  const openMerchant = (merchant: Merchant) => {
    router.push(`/merchant/${resolveMerchantSlug(merchant)}` as Href);
  };

  const requestLogin = () => {
    promptLogin('/(tabs)/ai');
  };

  const showEmpty =
    searched &&
    !loading &&
    !error &&
    categories.length === 0 &&
    visibleMerchants.length === 0 &&
    !searchNotice;

  const scanStyle = {
    transform: [
      {
        translateY: scan.interpolate({
          inputRange: [0, 1],
          outputRange: [-8, 168],
        }),
      },
    ],
    opacity: scan.interpolate({
      inputRange: [0, 0.15, 0.85, 1],
      outputRange: [0, 0.55, 0.55, 0],
    }),
  };

  const pulseStyle = {
    opacity: pulse.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 0.85],
    }),
  };

  const composerAnim = {
    opacity: composerPop,
    transform: [
      {
        translateY: composerPop.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };

  return (
    <TabSwipeHost>
    <View style={styles.root}>
      <SafeAreaView edges={['top']} style={styles.safeTop}>
        <LinearGradient
          colors={gradients.ai}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={styles.hero}
        >
          <View style={styles.techBackdrop} pointerEvents="none">
            <View style={styles.gridColA} />
            <View style={styles.gridColB} />
            <View style={styles.gridColC} />
            <View style={styles.gridRowA} />
            <View style={styles.gridRowB} />
            <View style={styles.cornerTL} />
            <View style={styles.cornerBR} />
            <Animated.View style={[styles.scanLine, scanStyle]} />
            <Animated.View style={[styles.signalDot, pulseStyle]} />
          </View>

          <View style={styles.heroTop}>
            <Pressable
              style={styles.backBtn}
              onPress={() => goBackOrHome(router)}
              hitSlop={8}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={20} color={colors.frost} />
            </Pressable>
            <View style={styles.brandPill}>
              <View style={styles.aiLiveDot} />
              <Text style={styles.brandPillText}>FinderB AI</Text>
            </View>
            {location.city ? (
              <View style={styles.locPill}>
                <Ionicons name="location-outline" size={12} color={colors.frostMuted} />
                <Text style={styles.locText} numberOfLines={1}>
                  {location.city}
                </Text>
              </View>
            ) : (
              <View style={styles.spacer} />
            )}
          </View>

          <Text style={styles.heroTitle}>Ask anything.</Text>
          <Text style={styles.heroSub}>
            Local intelligence for open, nearby, verified, and top-rated places.
          </Text>

          <Animated.View style={[styles.composerWrap, composerAnim]}>
            <View style={[styles.composer, listening && styles.composerListening]}>
              <View style={styles.composerIcon}>
                <Ionicons
                  name={listening ? 'mic' : 'sparkles'}
                  size={16}
                  color={listening ? '#EA4335' : colors.ink}
                />
              </View>
              <View style={styles.inputCol}>
                <TextInput
                  ref={inputRef}
                  style={styles.input}
                  value={query}
                  onChangeText={(text) => {
                    setQuery(text);
                    if (error) setError('');
                  }}
                  placeholder=""
                  placeholderTextColor={colors.textSoft}
                  returnKeyType="search"
                  onSubmitEditing={() => void runSearch(query)}
                  editable={!loading}
                />
                {!query && !listening ? (
                  <Animated.Text
                    style={[styles.floatingHint, { opacity: hintFade }]}
                    numberOfLines={1}
                    pointerEvents="none"
                  >
                    Try “{HINTS[hintIndex]}”
                  </Animated.Text>
                ) : null}
                {listening ? (
                  <Text style={styles.listeningHint} numberOfLines={1}>
                    Listening…
                  </Text>
                ) : null}
              </View>
              {query.length > 0 ? (
                <Pressable onPress={clearSearch} hitSlop={8} style={styles.clearBtn}>
                  <Ionicons name="close" size={16} color={colors.textSoft} />
                </Pressable>
              ) : (
                <Pressable
                  onPress={() => void handleVoice()}
                  hitSlop={8}
                  style={[styles.micBtn, listening && styles.micBtnActive]}
                  accessibilityLabel="Voice search"
                >
                  <Ionicons
                    name="mic"
                    size={18}
                    color={listening ? '#EA4335' : '#4285F4'}
                  />
                </Pressable>
              )}
              <Pressable
                style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
                onPress={() => void runSearch(query)}
                disabled={loading}
                accessibilityLabel="Search"
              >
                {loading ? (
                  <ActivityIndicator color={colors.onDark} size="small" />
                ) : (
                  <Ionicons name="arrow-up" size={18} color={colors.onDark} />
                )}
              </Pressable>
            </View>
          </Animated.View>
        </LinearGradient>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.body}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modifierWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.modifierRow}
          >
            {MODIFIERS.map((mod) => {
              const on = modifiers.includes(mod.id);
              const nearestOff = mod.id === 'nearest' && !location.coords;
              return (
                <Pressable
                  key={mod.id}
                  disabled={nearestOff}
                  onPress={() => toggleModifier(mod.id)}
                  style={[
                    styles.modifierChip,
                    on && styles.modifierChipOn,
                    nearestOff && styles.modifierDisabled,
                  ]}
                >
                  <Ionicons
                    name={mod.icon}
                    size={14}
                    color={on ? colors.onDark : colors.ink}
                  />
                  <Text
                    style={[styles.modifierText, on && styles.modifierTextOn]}
                  >
                    {nearestOff ? 'Nearest (off)' : mod.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {error ? (
          <View style={styles.errorBanner}>
            <Ionicons name="alert-circle-outline" size={16} color={colors.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <FlatList
          style={styles.list}
          data={searched && !loading ? visibleMerchants : []}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: scrollBottomPad },
          ]}
          ListHeaderComponent={
              <View style={styles.listHead}>
                {!searched ? (
                  <>
                    <View style={styles.capabilityRow}>
                      {CAPABILITIES.map((cap) => (
                        <View key={cap.title} style={styles.capabilityCard}>
                          <View style={styles.capabilityIcon}>
                            <Ionicons name={cap.icon} size={16} color={colors.secondary500} />
                          </View>
                          <Text style={styles.capabilityTitle}>{cap.title}</Text>
                          <Text style={styles.capabilityBody}>{cap.body}</Text>
                        </View>
                      ))}
                    </View>

                    {recent.length > 0 ? (
                      <>
                        <Text style={styles.sectionLabel}>Recent asks</Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.recentRail}
                        >
                          {recent.map((item) => (
                            <Pressable
                              key={item}
                              style={({ pressed }) => [
                                styles.recentChip,
                                pressed && styles.pressed,
                              ]}
                              onPress={() => void runSearch(item)}
                            >
                              <Ionicons
                                name="time-outline"
                                size={13}
                                color={colors.textSoft}
                              />
                              <Text style={styles.recentText} numberOfLines={1}>
                                {item}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </>
                    ) : null}

                    <Text style={[styles.sectionLabel, recent.length > 0 && styles.sectionSpaced]}>
                      Powerful quick asks
                    </Text>
                    <View style={styles.suggestionWrap}>
                      {SUGGESTIONS.map((item) => (
                        <Pressable
                          key={item.label}
                          style={({ pressed }) => [
                            styles.suggestion,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => void runSearch(item.label)}
                        >
                          <View
                            style={[
                              styles.suggestionIcon,
                              { backgroundColor: item.tone },
                            ]}
                          >
                            <Ionicons
                              name={item.icon}
                              size={16}
                              color={isDark ? '#0C0A09' : colors.ink}
                            />
                          </View>
                          <View style={styles.suggestionCopy}>
                            <Text style={styles.suggestionText}>{item.label}</Text>
                            <Text style={styles.suggestionHint}>{item.hint}</Text>
                          </View>
                          <Ionicons
                            name="arrow-forward"
                            size={14}
                            color={colors.textSoft}
                          />
                        </Pressable>
                      ))}
                    </View>

                    {popular.length > 0 ? (
                      <>
                        <Text style={[styles.sectionLabel, styles.sectionSpaced]}>
                          Browse popular
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.catRail}
                        >
                          {popular.map((cat) => (
                            <Pressable
                              key={cat.id}
                              style={({ pressed }) => [
                                styles.catCard,
                                pressed && styles.pressed,
                              ]}
                              onPress={() => void runSearch(cat.name)}
                            >
                              <View style={styles.catIconWrap}>
                                <Image
                                  source={{ uri: cat.icon }}
                                  style={styles.catIcon}
                                  contentFit="contain"
                                />
                              </View>
                              <Text style={styles.catName} numberOfLines={2}>
                                {cat.name}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </>
                    ) : null}
                  </>
                ) : (
                  <>
                    {loading ? (
                      <View style={styles.loadingBox}>
                        <LinearGradient
                          colors={gradients.ai}
                          style={styles.loadingOrb}
                        >
                          <ActivityIndicator color={colors.secondary} />
                        </LinearGradient>
                        <View style={styles.loadingCopy}>
                          <Text style={styles.loadingTitle}>Thinking with FinderB AI…</Text>
                          <Text style={styles.loadingText}>
                            Matching “{query}” with nearby businesses
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {!loading && searchNotice ? (
                      <View style={styles.noticeBox}>
                        <Text style={styles.noticeTitle}>Exact match not found</Text>
                        <Text style={styles.noticeText}>{searchNotice}</Text>
                      </View>
                    ) : null}

                    {!loading && categories.length > 0 ? (
                      <View style={styles.resultBlock}>
                        <Text style={styles.sectionLabel}>
                          {exactMatch ? 'Matching categories' : 'Relevant categories'}
                        </Text>
                        <ScrollView
                          horizontal
                          showsHorizontalScrollIndicator={false}
                          contentContainerStyle={styles.catRail}
                        >
                          {categories.map((cat) => (
                            <Pressable
                              key={cat.id}
                              style={({ pressed }) => [
                                styles.catChip,
                                pressed && styles.pressed,
                              ]}
                              onPress={() => void runSearch(cat.name)}
                            >
                              {cat.icon ? (
                                <Image
                                  source={{ uri: cat.icon }}
                                  style={styles.catChipIcon}
                                  contentFit="contain"
                                />
                              ) : (
                                <Ionicons
                                  name="grid-outline"
                                  size={16}
                                  color={colors.ink}
                                />
                              )}
                              <Text style={styles.catChipName} numberOfLines={1}>
                                {cat.name}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    ) : null}

                    {!loading && visibleMerchants.length > 0 ? (
                      <View style={styles.resultsHead}>
                        <View style={styles.resultsHeadCopy}>
                          <Text style={styles.resultsCount}>
                            {visibleMerchants.length} place
                            {visibleMerchants.length === 1 ? '' : 's'} found
                          </Text>
                          {insights.length > 0 ? (
                            <Text style={styles.resultsInsight}>
                              {insights.join(' · ')}
                            </Text>
                          ) : null}
                        </View>
                        <Pressable onPress={clearSearch} hitSlop={6}>
                          <Text style={styles.newSearch}>New search</Text>
                        </Pressable>
                      </View>
                    ) : null}

                    {showEmpty ? (
                      <View style={styles.emptyBox}>
                        <View style={styles.emptyIcon}>
                          <Ionicons name="search-outline" size={22} color={colors.ink} />
                        </View>
                        <Text style={styles.emptyTitle}>No matches yet</Text>
                        <Text style={styles.emptyText}>
                          Try a simpler ask, or turn off a filter chip above.
                        </Text>
                        <Pressable style={styles.emptyCta} onPress={clearSearch}>
                          <Text style={styles.emptyCtaText}>Try another ask</Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </>
                )}
              </View>
          }
          renderItem={({ item }) => (
            <View style={styles.rowWrap}>
              <CategoryMerchantRow
                merchant={item}
                distanceLabel={formatDistanceFromUser(
                  location.coords,
                  item.latitude,
                  item.longitude,
                )}
                contactRevealed={signedIn}
                onRequestLogin={requestLogin}
                onPress={() => openMerchant(item)}
              />
            </View>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={null}
        />
      </KeyboardAvoidingView>
    </View>
    </TabSwipeHost>
  );
}

const useStyles = createThemedStyles((colors, gradients) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safeTop: { backgroundColor: gradients.ai[0] },
  body: { flex: 1, backgroundColor: colors.canvas },
  list: { flex: 1 },
  hero: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 18,
    overflow: 'hidden',
  },
  techBackdrop: {
    ...StyleSheet.absoluteFill,
  },
  gridColA: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '22%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  gridColB: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '54%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  gridColC: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: '18%',
    width: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  gridRowA: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '34%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  gridRowB: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '68%',
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 18,
    height: 18,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderColor: 'rgba(249,184,100,0.55)',
  },
  cornerBR: {
    position: 'absolute',
    right: 14,
    bottom: 18,
    width: 18,
    height: 18,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(130,210,255,0.55)',
    shadowColor: '#7DD3FC',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  signalDot: {
    position: 'absolute',
    top: 22,
    right: 54,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(7,25,41,0.35)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  aiLiveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  brandPillText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.frost,
    letterSpacing: 0.3,
  },
  locPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '36%',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  locText: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.frostMuted,
  },
  spacer: { width: 36 },
  heroTitle: {
    fontFamily: fonts.extraBold,
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -1,
    color: colors.frost,
    marginBottom: 8,
  },
  heroSub: {
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: colors.frostMuted,
    marginBottom: 16,
    maxWidth: 340,
  },
  composerWrap: { gap: 8 },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 56,
    paddingLeft: 10,
    paddingRight: 8,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0A2844',
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  composerListening: {
    borderColor: 'rgba(234,67,53,0.35)',
  },
  composerIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  inputCol: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
  },
  input: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
  },
  floatingHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textSoft,
  },
  listeningHint: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontFamily: fonts.medium,
    fontSize: 14,
    color: '#EA4335',
  },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.muted,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  micBtnActive: {
    backgroundColor: colors.dangerBg,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.7 },
  modifierWrap: {
    backgroundColor: colors.canvas,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modifierRow: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    gap: 8,
    alignItems: 'center',
  },
  modifierChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modifierChipOn: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  modifierDisabled: { opacity: 0.4 },
  modifierText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  modifierTextOn: {
    color: colors.onDark,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.dangerBg,
  },
  errorText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.danger,
  },
  listContent: {
    paddingTop: 10,
  },
  listHead: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  capabilityRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  capabilityCard: {
    flex: 1,
    minHeight: 118,
    borderRadius: 16,
    padding: 12,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
  },
  capabilityIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.secondary100,
    marginBottom: 2,
  },
  capabilityTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  capabilityBody: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textSoft,
  },
  sectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },
  sectionSpaced: {
    marginTop: 20,
  },
  recentRail: {
    gap: 8,
    paddingBottom: 2,
  },
  recentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 220,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.muted,
  },
  recentText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  suggestionWrap: {
    gap: 8,
  },
  suggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  suggestionText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  suggestionHint: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  pressed: { opacity: 0.92 },
  catRail: {
    gap: 10,
    paddingRight: 8,
  },
  catCard: {
    width: 88,
    padding: 10,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 8,
  },
  catIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catIcon: { width: 26, height: 26 },
  catName: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    textAlign: 'center',
    color: colors.ink,
    minHeight: 28,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    marginBottom: 14,
  },
  loadingOrb: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCopy: { flex: 1, gap: 3 },
  loadingTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  resultBlock: { marginBottom: 14 },
  noticeBox: {
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noticeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
    marginBottom: 4,
  },
  noticeText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  catChipIcon: { width: 18, height: 18 },
  catChipName: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
    maxWidth: 140,
  },
  resultsHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  resultsHeadCopy: { flex: 1, gap: 3 },
  resultsCount: {
    fontFamily: fonts.semiBold,
    fontSize: 15,
    color: colors.ink,
  },
  resultsInsight: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.textSoft,
  },
  newSearch: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.brand,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 18,
    gap: 8,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSoft,
    textAlign: 'center',
  },
  emptyCta: {
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.brand,
  },
  emptyCtaText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.onDark,
  },
  rowWrap: {
    paddingHorizontal: 16,
  },
}));

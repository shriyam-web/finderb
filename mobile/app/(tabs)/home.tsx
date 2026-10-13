import { StatusBar } from 'expo-status-bar';
import { Href, useRouter, useScrollToTop } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedBrandMark } from '../../components/AnimatedBrandMark';
import { BusinessRegisterBanner } from '../../components/BusinessRegisterBanner';
import { HeaderWeatherChip } from '../../components/HeaderWeatherChip';
import { HourlyForecastSheet } from '../../components/HourlyForecastSheet';
import { HomeAiTeaser } from '../../components/HomeAiTeaser';
import { HomeFeaturedGroup } from '../../components/HomeFeaturedGroup';
import { InteractiveCategoryDeck } from '../../components/InteractiveCategoryDeck';
import { LocationPickerModal } from '../../components/LocationPickerModal';
import { lightColors } from '../../constants/colors';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useAppLocation } from '../../context/LocationContext';
import { useNotificationInbox } from '../../context/NotificationInboxContext';
import { useTheme } from '../../context/ThemeContext';
import { useLocalWeather } from '../../hooks/useLocalWeather';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import { getClimateTheme } from '../../lib/climateThemes';
import type { LocalWeather } from '../../lib/weather';
import type { HomeCategory } from '../../lib/api';
import { peekBusinessesByCategory, subscribeCategoryCatalog } from '../../lib/api';
import {
  clearHomeSessionCaches,
  getHomeBootstrapCache,
  loadHomeBootstrap,
  prefetchAppBackground,
} from '../../lib/homeBootstrap';
import { hideNativeSplash } from '../../lib/nativeSplash';
import { TabSwipeHost } from '../../lib/tabSwipe';
import type { Merchant } from '../../lib/merchants';
import { resolveMerchantSlug } from '../../lib/merchants';
import { getAppVersionLabel } from '../../lib/appVersion';

function weatherChipMeta(weather: LocalWeather): {
  climate: string;
  temp: string | null;
  night: boolean;
  skyWeather: LocalWeather['skyWeather'];
  dayPart: LocalWeather['dayPart'];
} {
  const temp =
    weather.temperatureC != null && Number.isFinite(weather.temperatureC)
      ? `${Math.round(weather.temperatureC)}°`
      : null;

  const night = !weather.isDay;
  const skyWeather = weather.skyWeather;
  const dayPart = weather.dayPart;

  switch (skyWeather) {
    case 'rain':
      return { climate: 'Rain', temp, night, skyWeather, dayPart };
    case 'storm':
      return { climate: 'Storm', temp, night, skyWeather, dayPart };
    case 'cloudy':
      return { climate: 'Cloudy', temp, night, skyWeather, dayPart };
    case 'fog':
      return { climate: 'Fog', temp, night, skyWeather, dayPart };
    case 'snow':
      return { climate: 'Snow', temp, night, skyWeather, dayPart };
    case 'heat':
      return { climate: 'Hot', temp, night: false, skyWeather, dayPart };
    case 'clear':
    default:
      if (night) {
        return { climate: 'Clear', temp, night: true, skyWeather, dayPart };
      }
      if (dayPart === 'afternoon') {
        return { climate: 'Sunny', temp, night: false, skyWeather, dayPart };
      }
      return { climate: 'Clear', temp, night: false, skyWeather, dayPart };
  }
}

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { user } = useAuth();
  const { unreadCount } = useNotificationInbox();
  const location = useAppLocation();
  const weather = useLocalWeather(location.coords);
  const climateTheme = useMemo(
    () => getClimateTheme(weather.mood),
    [weather.mood],
  );
  const weatherChip = useMemo(() => weatherChipMeta(weather), [weather]);
  const initialCache = useRef(getHomeBootstrapCache()).current;
  const [categoriesLoading, setCategoriesLoading] = useState(!initialCache);
  const [homeCategories, setHomeCategories] = useState<HomeCategory[]>(
    initialCache?.categories ?? [],
  );
  const [reloadToken, setReloadToken] = useState(0);
  const [emptySectionIds, setEmptySectionIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [hourlyOpen, setHourlyOpen] = useState(false);
  const [showDevCredit, setShowDevCredit] = useState(false);
  const scrollBottomPad = useTabScrollPadding(24);
  const scrollRef = useRef<ScrollView>(null);
  useScrollToTop(scrollRef);
  const selectedParentIdRef = useRef<string | null>(null);
  const madeInIndiaTaps = useRef(0);
  const madeInIndiaTapAt = useRef(0);
  const scrollY = useRef(0);
  const pullStartY = useRef<number | null>(null);
  const lastLocationKey = useRef('');
  const splashHidden = useRef(false);

  const loadHomeData = useCallback(async (force = false) => {
    const data = await loadHomeBootstrap(force);
    setHomeCategories(data.categories);
    setCategoriesLoading(false);
    return data;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!initialCache) setCategoriesLoading(true);
      await loadHomeData(false);
      if (cancelled) return;
    })();
    return () => {
      cancelled = true;
    };
  }, [initialCache, loadHomeData]);

  useEffect(() => {
    return subscribeCategoryCatalog(() => {
      void loadHomeData(false);
    });
  }, [loadHomeData]);

  // When user picks / refreshes location, re-rank businesses.
  useEffect(() => {
    const key = [
      location.source,
      location.city || '',
      location.region || '',
      location.coords
        ? `${location.coords.lat.toFixed(3)},${location.coords.lng.toFixed(3)}`
        : '',
    ].join('|');
    if (!key || key === lastLocationKey.current) return;
    if (!lastLocationKey.current) {
      lastLocationKey.current = key;
      return;
    }
    lastLocationKey.current = key;
    setReloadToken((n) => n + 1);
  }, [location.city, location.coords, location.region, location.source]);

  const revealHome = useCallback(() => {
    if (splashHidden.current) return;
    splashHidden.current = true;
    hideNativeSplash();
  }, []);

  useEffect(() => {
    revealHome();
    const t = setTimeout(() => {
      prefetchAppBackground();
    }, 2500);
    return () => clearTimeout(t);
  }, [revealHome]);

  const onRefresh = useCallback(async () => {
    if (refreshing) return;
    setRefreshing(true);
    clearHomeSessionCaches();
    setEmptySectionIds(new Set());
    setReloadToken((n) => n + 1);
    void location.refresh();
    await loadHomeData(true).catch(() => undefined);
    setRefreshing(false);
    prefetchAppBackground();
  }, [loadHomeData, location, refreshing]);

  const onTouchStart = (pageY: number) => {
    if (scrollY.current <= 2) pullStartY.current = pageY;
    else pullStartY.current = null;
  };

  const onTouchEnd = (pageY: number) => {
    if (pullStartY.current == null || refreshing) return;
    const delta = pageY - pullStartY.current;
    pullStartY.current = null;
    if (scrollY.current <= 2 && delta > 72) {
      void onRefresh();
    }
  };

  const openMerchant = (merchant: Merchant) => {
    router.push(`/merchant/${resolveMerchantSlug(merchant)}` as Href);
  };

  const onMadeInIndiaTap = () => {
    if (showDevCredit) return;
    const now = Date.now();
    if (now - madeInIndiaTapAt.current > 800) {
      madeInIndiaTaps.current = 0;
    }
    madeInIndiaTapAt.current = now;
    madeInIndiaTaps.current += 1;
    if (madeInIndiaTaps.current < 7) return;
    madeInIndiaTaps.current = 0;
    setShowDevCredit(true);
    Alert.alert('Designed and Developed by Shriyam Parashar');
  };

  const onSelectParent = useCallback((category: HomeCategory) => {
    const prev = selectedParentIdRef.current;
    if (prev === category.id) return;
    selectedParentIdRef.current = category.id;
    setSelectedParentId(category.id);
    if (prev) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const featuredGroups = useMemo(() => {
    if (!selectedParentId) return homeCategories;
    const selected = homeCategories.find((group) => group.id === selectedParentId);
    if (!selected) return homeCategories;
    return [
      selected,
      ...homeCategories.filter((group) => group.id !== selectedParentId),
    ];
  }, [homeCategories, selectedParentId]);

  const hideEmptySection = useCallback((groupId: string) => {
    setEmptySectionIds((prev) => {
      if (prev.has(groupId)) return prev;
      const next = new Set(prev);
      next.add(groupId);
      return next;
    });
  }, []);

  const visibleGroups = useMemo(
    () =>
      featuredGroups.filter((group) => {
        if (emptySectionIds.has(group.id)) return false;
        const page = peekBusinessesByCategory(group.queryName || group.name, {
          page: 1,
          pageSize: 24,
        });
        return !page || page.merchants.length > 0;
      }),
    [emptySectionIds, featuredGroups],
  );

  const city = location.city;
  const insets = useSafeAreaInsets();
  // Top bar chrome height — leave a little air above the search pill
  const stickyBarH = 50;
  const stickyPadTop = Math.max(insets.top, 0);
  // Top row only — less top padding (search inset stays full)
  const topRowPadTop = Math.max(0, stickyPadTop - Math.round(stickyPadTop * 0.1 + 2));
  const stickyHeaderInset = stickyPadTop + stickyBarH;
  const [stickySolid, setStickySolid] = useState(false);

  const stickyChrome = stickySolid
    ? {
        ink: colors.heading,
        inkMuted: colors.textSoft,
        chipBg: colors.surfaceSoft,
        chipBorder: colors.border,
        avatarBorder: colors.borderStrong,
        avatarWash: colors.muted,
      }
    : {
        ink: lightColors.onDark,
        inkMuted: 'rgba(255,255,255,0.85)',
        chipBg: 'rgba(12,10,9,0.2)',
        chipBorder: 'rgba(255,255,255,0.18)',
        avatarBorder: 'rgba(255,255,255,0.7)',
        avatarWash: 'rgba(255,255,255,0.35)',
      };

  const stickyTopBar = (
    <View style={styles.topBar}>
      <View style={styles.profileSide}>
        <Pressable
          onPress={() => router.replace('/(tabs)/account' as Href)}
          accessibilityLabel="Account"
          hitSlop={4}
        >
          <Image
            source={
              user?.avatarUrl
                ? { uri: user.avatarUrl }
                : require('../../assets/default-avatar.png')
            }
            style={[
              styles.avatar,
              {
                backgroundColor: stickyChrome.avatarWash,
                borderColor: stickyChrome.avatarBorder,
              },
            ]}
            contentFit="cover"
            transition={120}
          />
        </Pressable>

        <Pressable
          style={styles.locationChip}
          onPress={() => setLocationPickerOpen(true)}
          accessibilityLabel="Change location"
          hitSlop={6}
        >
          <Text
            style={[styles.locationText, { color: stickyChrome.ink }]}
            numberOfLines={1}
          >
            {location.shortLabel}
          </Text>
          <Ionicons
            name="chevron-down"
            size={10}
            color={stickyChrome.inkMuted}
          />
        </Pressable>
      </View>

      <View style={styles.brandCenter}>
        <AnimatedBrandMark
          wordColor={stickySolid ? colors.heading : '#FFFFFF'}
        />
      </View>

      <View style={styles.topBarSideRight}>
        <HeaderWeatherChip
          temp={weatherChip.temp}
          night={weatherChip.night}
          skyWeather={weatherChip.skyWeather}
          dayPart={weatherChip.dayPart}
          onLight={stickySolid && !isDark}
          ink={stickyChrome.ink}
          background={stickyChrome.chipBg}
          border={stickyChrome.chipBorder}
          onPress={() => setHourlyOpen(true)}
          accessibilityLabel={
            weatherChip.temp
              ? `${weatherChip.temp} ${weatherChip.climate}. Hourly forecast`
              : `${weatherChip.climate}. Hourly forecast`
          }
        />
        <Pressable
          style={styles.notifBtn}
          onPress={() =>
            router.push(
              (user?.isBusinessAccount ? '/business-console/alerts' : '/(tabs)/notifications') as Href,
            )
          }
          accessibilityLabel={
            unreadCount
              ? `Notifications, ${unreadCount} unread`
              : 'Notifications'
          }
        >
          <Ionicons
            name="notifications-outline"
            size={22}
            color={stickyChrome.ink}
          />
          {unreadCount > 0 ? <View style={styles.notifDot} /> : null}
        </Pressable>
      </View>
    </View>
  );

  return (
    <TabSwipeHost>
    <View style={[styles.root, { backgroundColor: climateTheme.base }]}>
      <StatusBar style={stickySolid && !isDark ? 'dark' : 'light'} />
      <SafeAreaView
        style={[styles.safe, { backgroundColor: climateTheme.base }]}
        edges={['left', 'right']}
      >
        <View style={styles.homeBody}>
          <ScrollView
            ref={scrollRef}
            style={styles.scrollFlex}
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: scrollBottomPad, flexGrow: 1 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            bounces
            alwaysBounceVertical
            overScrollMode="always"
            scrollEventThrottle={16}
            onScroll={(e) => {
              const y = e.nativeEvent.contentOffset.y;
              scrollY.current = y;
              // Same climate wash only after the blue header scrolls away
              const solid = y > stickyBarH;
              if (solid !== stickySolid) setStickySolid(solid);
            }}
            onTouchStart={(e) => onTouchStart(e.nativeEvent.pageY)}
            onTouchEnd={(e) => onTouchEnd(e.nativeEvent.pageY)}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void onRefresh()}
                tintColor={colors.brand}
                colors={[colors.brand]}
                progressBackgroundColor={colors.white}
                progressViewOffset={
                  Platform.OS === 'android' ? stickyHeaderInset : stickyPadTop
                }
              />
            }
          >
            <View>
              <InteractiveCategoryDeck
                categories={featuredGroups}
                userCoords={location.coords}
                city={city}
                reloadToken={reloadToken}
                onSearchPress={() => router.push('/(tabs)/ai' as Href)}
                onVoiceSearch={(transcript) =>
                  router.push(
                    `/(tabs)/ai?q=${encodeURIComponent(transcript)}` as Href,
                  )
                }
                onSeeAll={() => router.push('/(tabs)/categories' as Href)}
                onOpenCategory={(category) =>
                  router.push(
                    `/(tabs)/categories?category=${encodeURIComponent(category.slug)}&fresh=${Date.now()}` as Href,
                  )
                }
                onOpenMerchant={openMerchant}
                onSelectCategory={onSelectParent}
                showMerchantSheet={false}
                headerTopInset={stickyHeaderInset}
              />

              {visibleGroups.map((group, index) => (
                <View key={group.id}>
                  <HomeFeaturedGroup
                    group={group}
                    city={city}
                    userCoords={location.coords}
                    reloadToken={reloadToken}
                    eager
                    muted={index % 2 === 1}
                    onEmptyAll={hideEmptySection}
                    onOpenCategory={(category) =>
                      router.push(
                        `/(tabs)/categories?category=${encodeURIComponent(category.slug)}&fresh=${Date.now()}` as Href,
                      )
                    }
                    onOpenMerchant={openMerchant}
                    onExpand={() =>
                      router.push(
                        `/(tabs)/category/${encodeURIComponent(group.slug)}` as Href,
                      )
                    }
                  />
                  {index === 0 ? (
                    <View style={styles.bannerWrap}>
                      <BusinessRegisterBanner />
                    </View>
                  ) : null}
                  {index === 1 || (visibleGroups.length < 2 && index === 0) ? (
                    <HomeAiTeaser
                      onPress={() => router.push('/(tabs)/ai' as Href)}
                    />
                  ) : null}
                </View>
              ))}

              <View style={styles.section}>
                <Pressable
                  style={styles.madeInIndia}
                  onPress={onMadeInIndiaTap}
                  accessibilityRole="text"
                  accessibilityLabel="Proudly Made in India by FinderB Team"
                >
                  <Text style={styles.madeInIndiaText}>
                    Proudly Made in India{' '}
                    <Text style={styles.madeInIndiaFlag}>🇮🇳</Text>
                    {' '}by FinderB Team
                  </Text>
                  <Text style={styles.appVersion}>{getAppVersionLabel()}</Text>
                  {showDevCredit ? (
                    <Text style={styles.devCredit}>
                      Designed and Developed by Shriyam Parashar
                    </Text>
                  ) : null}
                </Pressable>
              </View>
            </View>
          </ScrollView>

          <View
            pointerEvents="box-none"
            style={[
              styles.stickyHero,
              {
                paddingTop: topRowPadTop,
                // Theme canvas when scrolled — not climate blue (stays dark in light mode)
                backgroundColor: stickySolid ? colors.canvas : 'transparent',
              },
            ]}
          >
            {stickyTopBar}
          </View>
        </View>
      </SafeAreaView>

      <LocationPickerModal
        visible={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
      />
      <HourlyForecastSheet
        visible={hourlyOpen}
        weather={weather}
        placeLabel={location.shortLabel}
        onClose={() => setHourlyOpen(false)}
      />

    </View>
    </TabSwipeHost>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvas },
  safe: { flex: 1, backgroundColor: colors.canvas },
  homeBody: { flex: 1, position: 'relative' },
  stickyHero: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  scrollFlex: { flex: 1, backgroundColor: colors.canvas },
  scroll: { paddingTop: 0, backgroundColor: colors.canvas },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 4,
    backgroundColor: 'transparent',
    zIndex: 10,
    minHeight: 44,
  },
  profileSide: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    maxWidth: '42%',
    paddingRight: 4,
    zIndex: 2,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  locationChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    minWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: -0.1,
  },
  topBarSideRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    zIndex: 2,
    flexShrink: 0,
  },
  brandCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  notifBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.95)',
  },
  bannerWrap: {
    marginTop: 8,
    paddingHorizontal: 16,
    backgroundColor: colors.canvas,
  },
  section: {
    marginTop: 6,
    paddingTop: 4,
    backgroundColor: colors.canvas,
  },
  madeInIndia: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    gap: 4,
  },
  madeInIndiaText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 18,
    letterSpacing: 0.1,
    color: colors.textSoft,
    textAlign: 'center',
  },
  madeInIndiaFlag: {
    fontSize: 13,
  },
  appVersion: {
    fontFamily: fonts.regular,
    fontSize: 10,
    lineHeight: 14,
    color: colors.textSoft,
    opacity: 0.75,
    textAlign: 'center',
  },
  devCredit: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.08,
    color: colors.textSoft,
    textAlign: 'center',
    opacity: 0.85,
  },
}));

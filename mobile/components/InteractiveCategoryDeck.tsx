import type { ReactNode } from 'react';
import { Image } from 'expo-image';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchBusinessesByCategory, type HomeCategory } from '../lib/api';
import { getBusinessOpenStatus } from '../lib/businessHours';
import {
  formatDistanceFromUser,
  getDistanceKm,
  sortByUserLocation,
  type Coords,
} from '../lib/geo';
import type { Merchant } from '../lib/merchants';
import {
  alertVoiceUnavailable,
  startVoiceSearch,
} from '../lib/voiceSearch';
import { lightColors } from '../constants/colors';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';
import { ClimateHeaderBackdrop } from './ClimateHeaderBackdrop';
import { useLocalWeather } from '../hooks/useLocalWeather';
import { getClimateTheme } from '../lib/climateThemes';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/** Fallback dark header — climate theme overrides the live header */
const BLUE = '#44403C';
export const HEADER_GRADIENT = ['#1C1917', '#292524', '#44403C'] as const;

const GRID_ROWS_COLLAPSED = 2;

function categoryGridMetrics(width: number, height: number) {
  // Columns adapt to width; short phones keep 4 so cells stay tappable.
  const cols = width < 360 ? 4 : width >= 520 ? 6 : 5;
  const gap = width < 360 ? 2 : width >= 430 ? 6 : 4;
  const hPad = width < 360 ? 6 : width >= 430 ? 14 : 8;
  const usable = Math.max(0, width - hPad * 2 - gap * (cols - 1));
  const cellW = Math.floor((usable / cols) * 1000) / 1000;

  // Height budget: keep the collapsed 2-row rail within ~22–30% of screen.
  const short = height < 700;
  const tall = height >= 860;
  const targetRailH = Math.round(
    Math.min(tall ? height * 0.28 : height * 0.24, short ? 132 : 180),
  );
  const rowBudget = Math.max(48, Math.floor(targetRailH / GRID_ROWS_COLLAPSED));

  const wScale = Math.min(1.25, Math.max(0.72, cellW / 70));
  const hScale = Math.min(1.22, Math.max(0.68, rowBudget / 68));
  const scale = Math.min(wScale, hScale);
  const compact = width < 360 || short;

  const iconBox = Math.round(Math.min(rowBudget * 0.42, (compact ? 28 : 34) * scale));
  const iconImg = Math.round(iconBox * 0.86);
  const ionSize = Math.round(iconBox * 0.78);
  const fontSize = Math.max(8, Math.min(12, Math.round(9.2 * scale * 10) / 10));
  const lineHeight = Math.round(fontSize + 2.5);
  const cellPadV = Math.max(2, Math.round((compact ? 3 : 5) * scale));
  const cellGap = Math.max(2, Math.round(4 * scale));
  const cellH = Math.min(
    rowBudget,
    iconBox + cellGap + lineHeight + cellPadV * 2,
  );

  return {
    cols,
    gap,
    hPad,
    cellW,
    cellH,
    railLimit: cols * GRID_ROWS_COLLAPSED,
    iconBox,
    iconImg,
    ionSize,
    fontSize,
    lineHeight,
    cellPadV,
    cellPadH: Math.max(1, Math.round(2 * scale)),
    cellGap,
    cellRadius: Math.round((compact ? 10 : 14) * Math.min(scale, 1.08)),
    searchZonePadH: width < 360 ? 12 : width >= 430 ? 18 : 16,
    searchZonePadBottom: short ? 4 : 10,
    searchMinH: short ? 42 : width >= 430 ? 52 : 48,
    searchFont: short ? 14 : width >= 430 ? 16 : 15,
  };
}

type CategoryGridMetrics = ReturnType<typeof categoryGridMetrics>;
const SMART_HINTS = [
  'Try “dentist near me”',
  'Ask: salon open now',
  'Find a plumber nearby',
  'Best restaurants tonight',
  'Gyms with good reviews',
  'Emergency hospital near me',
  'CA or accountant nearby',
  'Pet clinic open late',
];

function categoryHints(name: string, city?: string | null): string[] {
  const where = city?.trim() ? ` in ${city.trim()}` : ' near me';
  const leaf = name.trim();
  if (!leaf) return [];
  return [
    `“${leaf} open now${where}”`,
    `Best ${leaf.toLowerCase()}${where}`,
    `Trusted ${leaf.toLowerCase()} with reviews`,
  ];
}

function buildHintPool(activeName?: string | null, city?: string | null): string[] {
  const tailored = activeName ? categoryHints(activeName, city) : [];
  // Mix: keep smart intents first, sprinkle category-aware ones
  return [...SMART_HINTS.slice(0, 4), ...tailored, ...SMART_HINTS.slice(4)];
}

type ShelfFilterId =
  | 'nearest'
  | 'open-now'
  | 'top-rated'
  | 'verified'
  | 'offers';

type ShelfSortId = 'recommended' | 'nearest' | 'top-rated' | 'name';

const SHELF_FILTERS: Array<{
  id: ShelfFilterId;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
}> = [
  {
    id: 'open-now',
    label: 'Open now',
    description: 'Only places open at this moment',
    icon: 'time-outline',
    accent: '#ECFDF5',
  },
  {
    id: 'nearest',
    label: 'Nearest first',
    description: 'Sort by distance from your location',
    icon: 'navigate-outline',
    accent: '#EFF6FF',
  },
  {
    id: 'top-rated',
    label: 'Top rated',
    description: '4.5★ and above, highly reviewed',
    icon: 'star-outline',
    accent: '#FFFBEB',
  },
  {
    id: 'verified',
    label: 'FinderB verified',
    description: 'Trusted businesses with a verified badge',
    icon: 'shield-checkmark-outline',
    accent: '#F0FDF4',
  },
  {
    id: 'offers',
    label: 'Offers & deals',
    description: 'Places currently running discounts',
    icon: 'pricetag-outline',
    accent: '#FFF7ED',
  },
];

const SHELF_SORTS: Array<{
  id: ShelfSortId;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { id: 'recommended', label: 'Best match', icon: 'sparkles-outline' },
  { id: 'nearest', label: 'Nearest', icon: 'navigate-outline' },
  { id: 'top-rated', label: 'Rating', icon: 'star-outline' },
  { id: 'name', label: 'A → Z', icon: 'text-outline' },
];

function merchantRatingValue(merchant: Merchant): number {
  return merchant.rating != null && merchant.rating > 0 ? merchant.rating : 5;
}

function merchantHasOffer(merchant: Merchant): boolean {
  return (
    Boolean(merchant.discountRange) &&
    merchant.discountRange !== 'No Discount' &&
    merchant.discountRange !== 'Seasonal Offer'
  );
}

function applyShelfFilters(
  merchants: Merchant[],
  activeFilters: ShelfFilterId[],
  userCoords?: Coords | null,
  sort: ShelfSortId = 'recommended',
): Merchant[] {
  let rows = [...merchants];

  if (activeFilters.includes('open-now')) {
    rows = rows.filter(
      (biz) => getBusinessOpenStatus(biz.timings).status === 'Open',
    );
  }
  if (activeFilters.includes('top-rated')) {
    rows = rows.filter((biz) => merchantRatingValue(biz) >= 4.5);
  }
  if (activeFilters.includes('verified')) {
    rows = rows.filter((biz) => biz.isVerified);
  }
  if (activeFilters.includes('offers')) {
    rows = rows.filter(merchantHasOffer);
  }

  const preferNearest =
    (activeFilters.includes('nearest') || sort === 'nearest') && userCoords;
  const preferRated =
    activeFilters.includes('top-rated') || sort === 'top-rated';
  const preferOpen = activeFilters.includes('open-now');

  if (sort === 'name') {
    rows.sort((a, b) => a.name.localeCompare(b.name));
    return rows;
  }

  rows.sort((a, b) => {
    if (preferOpen) {
      const aOpen =
        getBusinessOpenStatus(a.timings).status === 'Open' ? 1 : 0;
      const bOpen =
        getBusinessOpenStatus(b.timings).status === 'Open' ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;
    }

    if (preferNearest && userCoords) {
      const distA =
        a.latitude != null && a.longitude != null
          ? getDistanceKm(
              userCoords.lat,
              userCoords.lng,
              a.latitude,
              a.longitude,
            )
          : Number.POSITIVE_INFINITY;
      const distB =
        b.latitude != null && b.longitude != null
          ? getDistanceKm(
              userCoords.lat,
              userCoords.lng,
              b.latitude,
              b.longitude,
            )
          : Number.POSITIVE_INFINITY;
      if (distA !== distB) return distA - distB;
    }

    if (preferRated) {
      const ratingDiff = merchantRatingValue(b) - merchantRatingValue(a);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.reviewsCount ?? 0) - (a.reviewsCount ?? 0);
    }

    if (a.isVerified !== b.isVerified) {
      return Number(b.isVerified) - Number(a.isVerified);
    }
    return merchantRatingValue(b) - merchantRatingValue(a);
  });

  return rows;
}

function pinSelectedFirst(
  items: HomeCategory[],
  selectedId: string | null,
): HomeCategory[] {
  if (!selectedId) return items;
  const selected = items.find((cat) => cat.id === selectedId);
  if (!selected) return items;
  return [selected, ...items.filter((cat) => cat.id !== selectedId)];
}

type Props = {
  categories: HomeCategory[];
  searchHint?: string;
  city?: string | null;
  onSearchPress: () => void;
  onVoiceSearch?: (transcript: string) => void;
  onOpenCategory: (category: HomeCategory) => void;
  onSeeAll: () => void;
  onOpenMerchant: (merchant: Merchant) => void;
  onSelectCategory?: (category: HomeCategory) => void;
  /** Home renders parent sections below the grid; skip the in-hero merchant rail. */
  showMerchantSheet?: boolean;
  userCoords?: Coords | null;
  /** Rendered inside the same header gradient (e.g. home top bar) */
  topBar?: ReactNode;
  /** Override safe-area padding on the blue header (0 when sticky bar owns the inset). */
  headerTopInset?: number;
  /** Bump to force merchant rail reload (pull-to-refresh). */
  reloadToken?: number;
  /** Fires once first category content fetch settles (ready for first paint). */
  onContentReady?: () => void;
};

const FALLBACK_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  doctor: 'medkit-outline',
  restaurant: 'restaurant-outline',
  hotel: 'bed-outline',
  beauty: 'cut-outline',
  spa: 'cut-outline',
  gym: 'barbell-outline',
  repair: 'construct-outline',
  electronic: 'tv-outline',
  auto: 'car-outline',
  pg: 'home-outline',
  hostel: 'home-outline',
  lawyer: 'document-text-outline',
  tutor: 'school-outline',
  plumber: 'water-outline',
  electric: 'flash-outline',
  photo: 'camera-outline',
  pet: 'paw-outline',
  college: 'library-outline',
};

function isRemoteIcon(icon?: string | null): boolean {
  const value = icon?.trim() || '';
  return value.startsWith('http') || value.startsWith('data:');
}

function fallbackIonicon(name: string): keyof typeof Ionicons.glyphMap {
  const key = name.toLowerCase();
  for (const [needle, icon] of Object.entries(FALLBACK_ICONS)) {
    if (key.includes(needle)) return icon;
  }
  return 'grid-outline';
}

function CategoryTab({
  category,
  selected,
  onPress,
}: {
  category: HomeCategory;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const remote = isRemoteIcon(category.icon);
  const ion =
    category.icon && category.icon in Ionicons.glyphMap
      ? (category.icon as keyof typeof Ionicons.glyphMap)
      : fallbackIonicon(category.name);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabItem,
        selected && styles.tabItemActive,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.tabLogo}>
        {remote ? (
          <Image
            source={{ uri: category.icon }}
            style={styles.tabImage}
            contentFit="contain"
          />
        ) : (
          <Ionicons
            name={ion}
            size={selected ? 20 : 18}
            color={selected ? lightColors.ink : lightColors.onDark}
          />
        )}
      </View>
      <Text
        style={[styles.tabLabel, selected && styles.tabLabelSelected]}
        numberOfLines={2}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

function CategoryGridCell({
  category,
  selected,
  onPress,
  metrics,
}: {
  category: HomeCategory;
  selected: boolean;
  onPress: () => void;
  metrics: CategoryGridMetrics;
}) {
  const styles = useStyles();
  const remote = isRemoteIcon(category.icon);
  const ion =
    category.icon && category.icon in Ionicons.glyphMap
      ? (category.icon as keyof typeof Ionicons.glyphMap)
      : fallbackIonicon(category.name);
  // Hero stays light-themed even when the rest of the app is dark.
  const iconColor = selected ? lightColors.ink : lightColors.onDark;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.gridCell,
        {
          width: metrics.cellW,
          minHeight: metrics.cellH,
          gap: metrics.cellGap,
          paddingTop: metrics.cellPadV,
          paddingBottom: metrics.cellPadV,
          paddingHorizontal: metrics.cellPadH,
          borderRadius: metrics.cellRadius,
        },
        selected && styles.gridCellSelected,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={category.name}
    >
      <View
        style={[
          styles.gridIcon,
          { width: metrics.iconBox, height: metrics.iconBox },
        ]}
      >
        {remote ? (
          <Image
            source={{ uri: category.icon }}
            style={{ width: metrics.iconImg, height: metrics.iconImg }}
            contentFit="contain"
          />
        ) : (
          <Ionicons name={ion} size={metrics.ionSize} color={iconColor} />
        )}
      </View>
      <Text
        style={[
          styles.gridLabel,
          {
            fontSize: metrics.fontSize,
            lineHeight: metrics.lineHeight,
          },
          selected && styles.gridLabelSelected,
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {category.name}
      </Text>
    </Pressable>
  );
}

/** Active category sits on the merchant sheet as a white tab. */
function ActiveCategoryDrop({
  category,
  filterCount,
  onFilterPress,
  onSeeAll,
}: {
  category: HomeCategory;
  filterCount: number;
  onFilterPress: () => void;
  onSeeAll: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const remote = isRemoteIcon(category.icon);
  const ion =
    category.icon && category.icon in Ionicons.glyphMap
      ? (category.icon as keyof typeof Ionicons.glyphMap)
      : fallbackIonicon(category.name);

  return (
    <View style={styles.activeDropTab}>
      <View style={styles.activeDropIcon}>
        {remote ? (
          <Image
            source={{ uri: category.icon! }}
            style={styles.dockIconImg}
            contentFit="contain"
          />
        ) : (
          <Ionicons name={ion} size={20} color={colors.ink} />
        )}
      </View>
      <Text style={styles.activeDropTitle} numberOfLines={1}>
        {category.name}
      </Text>
      <Pressable
        onPress={onFilterPress}
        style={({ pressed }) => [
          styles.activeDropFilter,
          filterCount > 0 && styles.activeDropFilterOn,
          pressed && styles.pressed,
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={
          filterCount > 0
            ? `Filters, ${filterCount} active`
            : `Filter ${category.name}`
        }
      >
        <Ionicons
          name="options-outline"
          size={16}
          color={filterCount > 0 ? colors.brand : colors.ink}
        />
        {filterCount > 0 ? (
          <View style={styles.activeDropFilterDot}>
            <Text style={styles.activeDropFilterCount}>{filterCount}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable
        onPress={onSeeAll}
        style={({ pressed }) => [
          styles.activeDropSeeAll,
          pressed && styles.pressed,
        ]}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={`See all ${category.name}`}
      >
        <Text style={styles.sectionSeeAll}>See all</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.ink} />
      </Pressable>
    </View>
  );
}

/** Always-visible expand control with a light bounce. */
function PulsingExpandArrow({
  expanded,
  onPress,
}: {
  expanded: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 750,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      pulse.setValue(0);
    };
  }, [pulse]);

  const bounceY = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: expanded ? [0, -4] : [0, 4],
  });
  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.55, 0.85],
  });

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.expandHit, pressed && styles.pressed]}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={
        expanded ? 'Show fewer categories' : 'View more'
      }
    >
      <Animated.View
        style={[
          styles.expandRow,
          {
            opacity: pulseOpacity,
            transform: [{ translateY: bounceY }],
          },
        ]}
      >
        <Text style={styles.expandLabel}>
          {expanded ? 'Show less' : 'View more'}
        </Text>
        <View style={styles.expandArrows}>
          {expanded ? (
            <>
              <Ionicons
                name="chevron-up"
                size={16}
                color="rgba(255,255,255,0.95)"
                style={styles.chevronStack}
              />
              <Ionicons
                name="chevron-up"
                size={16}
                color="rgba(255,255,255,0.95)"
              />
            </>
          ) : (
            <>
              <Ionicons
                name="chevron-down"
                size={16}
                color="rgba(255,255,255,0.95)"
                style={styles.chevronStack}
              />
              <Ionicons
                name="chevron-down"
                size={16}
                color="rgba(255,255,255,0.95)"
              />
            </>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

function leafCategory(raw: string): string {
  if (!raw) return 'Business';
  const leaf = raw.includes('›') ? raw.split('›').pop()!.trim() : raw.trim();
  return leaf || 'Business';
}

function BusinessCard({
  merchant,
  distanceLabel,
  onPress,
}: {
  merchant: Merchant;
  distanceLabel?: string | null;
  onPress: () => void;
}) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const rating =
    merchant.rating != null && merchant.rating > 0
      ? merchant.rating.toFixed(1)
      : null;
  const open = getBusinessOpenStatus(merchant.timings);
  const place = (merchant.location || merchant.city || '').trim();
  const about = (merchant.about || '').trim();
  const hasOffer =
    Boolean(merchant.discountRange) &&
    merchant.discountRange !== 'No Discount' &&
    merchant.discountRange !== 'Seasonal Offer';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.bizCard, pressed && styles.pressed]}
    >
      <View style={styles.photo}>
        {merchant.image ? (
          <Image
            source={{ uri: merchant.image }}
            style={styles.photoImg}
            contentFit="cover"
            transition={160}
          />
        ) : (
          <LinearGradient colors={[...gradients.spotlight]} style={styles.photoImg}>
            <Text style={styles.initial}>{merchant.name.slice(0, 1)}</Text>
          </LinearGradient>
        )}
      </View>

      <View style={styles.body}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={2}>
            {merchant.name}
          </Text>
          {merchant.isVerified ? (
            <View style={styles.verified}>
              <Ionicons name="checkmark" size={10} color={colors.onDark} />
            </View>
          ) : null}
        </View>

        <Text style={styles.category} numberOfLines={1}>
          {leafCategory(merchant.category)}
        </Text>

        <View style={styles.metaRow}>
          {rating ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={13} color={colors.star} />
              <Text style={styles.metaStrong}>{rating}</Text>
              {merchant.reviewsCount > 0 ? (
                <Text style={styles.meta}>({merchant.reviewsCount})</Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.meta}>New on FinderB</Text>
          )}
          {merchant.yearsInBusiness ? (
            <Text style={styles.meta}>· {merchant.yearsInBusiness}+ yrs</Text>
          ) : null}
        </View>

        <View style={styles.statusRow}>
          {open.status === 'Open' || open.status === 'Closed' ? (
            <Text
              style={[
                styles.statusInline,
                open.status === 'Open' ? styles.statusTextOpen : styles.statusTextClosed,
              ]}
            >
              {open.label || open.status}
            </Text>
          ) : null}
          {distanceLabel ? (
            <Text style={styles.distanceInline}>
              {open.status === 'Open' || open.status === 'Closed' ? ' · ' : ''}
              {distanceLabel}
            </Text>
          ) : null}
        </View>

        {place ? (
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={13} color={colors.textSoft} />
            <Text style={styles.locText} numberOfLines={1}>
              {place}
            </Text>
          </View>
        ) : null}

        {hasOffer ? (
          <View style={styles.offerRow}>
            <Ionicons name="pricetag-outline" size={12} color={colors.open} />
            <Text style={styles.offer} numberOfLines={1}>
              {merchant.discountRange}
            </Text>
          </View>
        ) : null}

        {about ? (
          <Text style={styles.about} numberOfLines={1}>
            {about}
          </Text>
        ) : null}

        <View style={styles.ctaRow}>
          <Text style={styles.ctaText}>View details</Text>
          <Ionicons name="arrow-forward" size={13} color={colors.ink} />
        </View>
      </View>
    </Pressable>
  );
}

export function InteractiveCategoryDeck({
  categories,
  searchHint = 'Ask FinderB anything…',
  city,
  onSearchPress,
  onVoiceSearch,
  onOpenCategory,
  onSeeAll,
  onOpenMerchant,
  onSelectCategory,
  showMerchantSheet = true,
  userCoords,
  topBar,
  headerTopInset,
  reloadToken = 0,
  onContentReady,
}: Props) {
  const { colors } = useTheme();
  const styles = useStyles();
  const allItems = useMemo(
    () =>
      [...categories].sort(
        (a, b) => (b.businessCount || 0) - (a.businessCount || 0),
      ),
    [categories],
  );
  const populatedItems = useMemo(
    () => allItems.filter((cat) => (cat.businessCount || 0) > 0),
    [allItems],
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [catsExpanded, setCatsExpanded] = useState(false);
  const [listening, setListening] = useState(false);
  const [hintIndex, setHintIndex] = useState(0);
  const hintFade = useRef(new Animated.Value(1)).current;
  const listFade = useRef(new Animated.Value(1)).current;
  const readySent = useRef(false);
  const weather = useLocalWeather(userCoords);
  const climateTheme = useMemo(
    () => getClimateTheme(weather.mood),
    [weather.mood],
  );
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const grid = useMemo(
    () => categoryGridMetrics(windowWidth, windowHeight),
    [windowHeight, windowWidth],
  );
  const headerPadTop =
    headerTopInset != null ? headerTopInset : Math.max(insets.top, 0);

  useEffect(() => {
    const pool = populatedItems.length > 0 ? populatedItems : allItems;
    if (pool.length === 0) {
      setActiveId(null);
      return;
    }
    setActiveId((prev) =>
      prev && pool.some((cat) => cat.id === prev) ? prev : pool[0].id,
    );
  }, [allItems, populatedItems]);

  const active =
    populatedItems.find((cat) => cat.id === activeId) ||
    allItems.find((cat) => cat.id === activeId) ||
    null;

  useEffect(() => {
    if (!active) return;
    onSelectCategory?.(active);
  }, [active, onSelectCategory]);

  const railItems = useMemo(() => {
    const pool = populatedItems.length > 0 ? populatedItems : allItems;
    const selected = pool.find((cat) => cat.id === activeId) ?? null;
    const rest = pool.filter((cat) => cat.id !== selected?.id);
    const ordered = selected ? [selected, ...rest] : pool;
    return ordered.slice(0, grid.railLimit);
  }, [activeId, allItems, grid.railLimit, populatedItems]);
  const visibleCats = catsExpanded
    ? pinSelectedFirst(
        populatedItems.length > 0 ? populatedItems : allItems,
        activeId,
      )
    : railItems;
  const canExpand =
    (populatedItems.length > 0 ? populatedItems : allItems).length >
    railItems.length;

  const toggleCategoriesExpanded = () => {
    LayoutAnimation.configureNext({
      duration: 280,
      create: { type: 'easeInEaseOut', property: 'opacity' },
      update: { type: 'easeInEaseOut' },
      delete: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setCatsExpanded((v) => !v);
  };

  const selectCategory = (id: string) => {
    if (id === activeId) return;
    LayoutAnimation.configureNext({
      duration: 220,
      update: { type: 'easeInEaseOut' },
      create: { type: 'easeInEaseOut', property: 'opacity' },
    });
    setActiveId(id);
    setCatsExpanded(false);
    listFade.setValue(0.25);
    Animated.timing(listFade, {
      toValue: 1,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  };

  const hintPool = useMemo(
    () => buildHintPool(active?.name, city),
    [active?.name, city],
  );

  useEffect(() => {
    setHintIndex(0);
  }, [active?.id, city]);

  useEffect(() => {
    if (listening || hintPool.length === 0) return;

    const id = setInterval(() => {
      Animated.timing(hintFade, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(() => {
        setHintIndex((i) => (i + 1) % hintPool.length);
        Animated.timing(hintFade, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start();
      });
    }, 3200);

    return () => clearInterval(id);
  }, [hintFade, hintPool.length, listening]);

  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<ShelfFilterId[]>([]);
  const [sort, setSort] = useState<ShelfSortId>('recommended');
  const [draftFilters, setDraftFilters] = useState<ShelfFilterId[]>([]);
  const [draftSort, setDraftSort] = useState<ShelfSortId>('recommended');
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    setFilters([]);
    setSort('recommended');
    setDraftFilters([]);
    setDraftSort('recommended');
    setFilterOpen(false);
  }, [active?.id]);

  useEffect(() => {
    if (!showMerchantSheet || !active) {
      if (!showMerchantSheet && !readySent.current && allItems.length > 0) {
        readySent.current = true;
        onContentReady?.();
      }
      if (!active) {
        setMerchants([]);
        setLoading(false);
        setError('');
      }
      return;
    }

    // Unblock home splash as soon as categories are on screen —
    // merchants can load in the background.
    if (!readySent.current) {
      readySent.current = true;
      onContentReady?.();
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError('');
      const result = await fetchBusinessesByCategory(active.name, {
        page: 1,
        pageSize: 24,
      });
      if (cancelled) return;
      const ranked = sortByUserLocation(result.merchants, {
        coords: userCoords,
        city,
      });
      setMerchants(ranked);
      setError(result.error || '');
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [active?.id, active?.name, allItems.length, city, onContentReady, reloadToken, showMerchantSheet, userCoords]);

  const visibleMerchants = useMemo(() => {
    const filtered = applyShelfFilters(merchants, filters, userCoords, sort);
    return filtered.slice(0, 8);
  }, [merchants, filters, userCoords, sort]);

  const draftMatchCount = useMemo(
    () => applyShelfFilters(merchants, draftFilters, userCoords, draftSort).length,
    [merchants, draftFilters, userCoords, draftSort],
  );

  const openFilters = () => {
    setDraftFilters(filters);
    setDraftSort(sort);
    setFilterOpen(true);
  };

  const closeFilters = () => setFilterOpen(false);

  const toggleDraftFilter = (id: ShelfFilterId) => {
    setDraftFilters((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id],
    );
  };

  const clearDraft = () => {
    setDraftFilters([]);
    setDraftSort('recommended');
  };

  const applyDraft = () => {
    setFilters(draftFilters);
    setSort(draftSort);
    setFilterOpen(false);
  };

  const handleVoicePress = async () => {
    if (listening) return;
    const result = await startVoiceSearch({
      onListeningChange: setListening,
    });
    if (!result.ok) {
      alertVoiceUnavailable(result.error);
      return;
    }
    if (onVoiceSearch) {
      onVoiceSearch(result.transcript);
      return;
    }
    onSearchPress();
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.blueHeader,
          {
            backgroundColor: climateTheme.base,
            paddingTop: headerPadTop,
          },
        ]}
      >
        <ClimateHeaderBackdrop weather={weather} />

        <View style={styles.headerForeground}>
          {topBar}

          {/* Search first — Google-like pill */}
          <View
            style={[
              styles.searchZone,
              {
                paddingHorizontal: grid.searchZonePadH,
                paddingBottom: grid.searchZonePadBottom,
              },
            ]}
          >
            <View
              style={[
                styles.searchBar,
                { minHeight: grid.searchMinH },
                listening && styles.searchBarListening,
              ]}
            >
              <Ionicons
                name="search"
                size={Math.round(grid.searchFont + 3)}
                color="#5F6368"
                style={styles.searchLeadingIcon}
              />
              <Pressable
                style={styles.searchMain}
                onPress={onSearchPress}
                accessibilityRole="button"
                accessibilityLabel="Search"
              >
                <Animated.Text
                  style={[
                    styles.searchHint,
                    { fontSize: grid.searchFont },
                    listening && styles.searchHintListening,
                    !listening && { opacity: hintFade },
                  ]}
                  numberOfLines={1}
                >
                  {listening
                    ? 'Listening…'
                    : hintPool[hintIndex] || searchHint}
                </Animated.Text>
              </Pressable>
              <Pressable
                style={[styles.micBtn, listening && styles.micBtnActive]}
                onPress={() => {
                  void handleVoicePress();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Voice search"
              >
                <Ionicons
                  name={listening ? 'mic' : 'mic'}
                  size={20}
                  color={listening ? '#EA4335' : '#4285F4'}
                />
              </Pressable>
            </View>
          </View>

          {/* Category grid — 10 on home (5×2); expand for the rest */}
          <View style={styles.topBlue}>
            <View
              style={[
                styles.expandedBlock,
                { paddingHorizontal: grid.hPad },
              ]}
            >
              <View style={[styles.grid, { gap: grid.gap }]}>
                {visibleCats.map((cat) => (
                  <CategoryGridCell
                    key={cat.id}
                    category={cat}
                    selected={active?.id === cat.id}
                    metrics={grid}
                    onPress={() => selectCategory(cat.id)}
                  />
                ))}
              </View>
            </View>

            {canExpand ? (
              <PulsingExpandArrow
                expanded={catsExpanded}
                onPress={toggleCategoriesExpanded}
              />
            ) : null}
          </View>
        </View>
      </View>

      {showMerchantSheet ? (
      <>
      {/* White sheet: active category + merchants (no blue bleed behind cards) */}
      <View style={styles.merchantSheet}>
        {active ? (
          <ActiveCategoryDrop
            category={active}
            filterCount={filters.length + (sort !== 'recommended' ? 1 : 0)}
            onFilterPress={openFilters}
            onSeeAll={() => onOpenCategory(active)}
          />
        ) : null}

        <Animated.View style={{ opacity: listFade }}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.ink} />
              <Text style={styles.loadingText}>Finding places…</Text>
            </View>
          ) : error && merchants.length === 0 ? (
            <Text style={styles.emptyMerchants}>{error}</Text>
          ) : merchants.length === 0 ? (
            <Text style={styles.emptyMerchants}>
              No places found in this category
            </Text>
          ) : visibleMerchants.length === 0 ? (
            <View style={styles.filterEmptyBox}>
              <Text style={styles.emptyMerchants}>
                No places match these filters
              </Text>
              <Pressable
                onPress={() => {
                  setFilters([]);
                  setSort('recommended');
                }}
                style={({ pressed }) => [
                  styles.clearFiltersBtn,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.clearFiltersText}>Clear filters</Text>
              </Pressable>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.storeRail}
              nestedScrollEnabled
              decelerationRate="fast"
              style={styles.storeScroll}
            >
              {visibleMerchants.map((merchant) => (
                <BusinessCard
                  key={merchant.id}
                  merchant={merchant}
                  distanceLabel={formatDistanceFromUser(
                    userCoords,
                    merchant.latitude,
                    merchant.longitude,
                  )}
                  onPress={() => onOpenMerchant(merchant)}
                />
              ))}
              <Pressable
                onPress={() => (active ? onOpenCategory(active) : onSeeAll())}
                style={({ pressed }) => [
                  styles.seeAllCard,
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="See all"
              >
                <View style={styles.seeAllCircle}>
                  <Ionicons name="arrow-forward" size={18} color={colors.ink} />
                </View>
                <Text style={styles.seeAllCardText}>See all</Text>
              </Pressable>
            </ScrollView>
          )}
        </Animated.View>
      </View>

      <Modal
        visible={filterOpen}
        transparent
        animationType="slide"
        onRequestClose={closeFilters}
      >
        <View style={styles.sheetRoot}>
          <Pressable style={styles.sheetBackdrop} onPress={closeFilters} />
          <View
            style={[
              styles.sheet,
              { paddingBottom: Math.max(insets.bottom, 16) + 8 },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <View style={styles.sheetHeaderCopy}>
                <Text style={styles.sheetEyebrow}>
                  {active?.name || 'Category'}
                </Text>
                <Text style={styles.sheetTitle}>Refine listings</Text>
                <Text style={styles.sheetSubtitle}>
                  {draftMatchCount} place{draftMatchCount === 1 ? '' : 's'} match
                  {draftFilters.length > 0 || draftSort !== 'recommended'
                    ? ' your picks'
                    : ' right now'}
                </Text>
              </View>
              <Pressable
                style={styles.sheetClose}
                onPress={closeFilters}
                hitSlop={8}
                accessibilityLabel="Close filters"
              >
                <Ionicons name="close" size={18} color={colors.ink} />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={styles.sheetScroll}
            >
              <Text style={styles.sheetSectionLabel}>Quick filters</Text>
              <View style={styles.filterCardList}>
                {SHELF_FILTERS.map((filter) => {
                  const on = draftFilters.includes(filter.id);
                  const nearestDisabled =
                    filter.id === 'nearest' && !userCoords;
                  return (
                    <Pressable
                      key={filter.id}
                      disabled={nearestDisabled}
                      onPress={() => toggleDraftFilter(filter.id)}
                      style={({ pressed }) => [
                        styles.filterCard,
                        on && styles.filterCardOn,
                        nearestDisabled && styles.filterCardDisabled,
                        pressed && !nearestDisabled && styles.pressed,
                      ]}
                    >
                      <View
                        style={[
                          styles.filterCardIcon,
                          { backgroundColor: filter.accent },
                          on && styles.filterCardIconOn,
                        ]}
                      >
                        <Ionicons
                          name={filter.icon}
                          size={18}
                          color={on ? colors.frost : colors.ink}
                        />
                      </View>
                      <View style={styles.filterCardCopy}>
                        <Text
                          style={[
                            styles.filterCardTitle,
                            on && styles.filterCardTitleOn,
                          ]}
                        >
                          {filter.label}
                        </Text>
                        <Text style={styles.filterCardDesc} numberOfLines={2}>
                          {nearestDisabled
                            ? 'Turn on location to use nearest sorting'
                            : filter.description}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.filterCheck,
                          on && styles.filterCheckOn,
                        ]}
                      >
                        {on ? (
                          <Ionicons
                            name="checkmark"
                            size={14}
                            color={colors.frost}
                          />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              <Text style={[styles.sheetSectionLabel, styles.sheetSectionSpaced]}>
                Sort by
              </Text>
              <View style={styles.sortGrid}>
                {SHELF_SORTS.map((option) => {
                  const on = draftSort === option.id;
                  const nearestDisabled =
                    option.id === 'nearest' && !userCoords;
                  return (
                    <Pressable
                      key={option.id}
                      disabled={nearestDisabled}
                      onPress={() => setDraftSort(option.id)}
                      style={({ pressed }) => [
                        styles.sortCard,
                        on && styles.sortCardOn,
                        nearestDisabled && styles.filterCardDisabled,
                        pressed && !nearestDisabled && styles.pressed,
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={16}
                        color={on ? colors.teal : colors.ink}
                      />
                      <Text
                        style={[
                          styles.sortCardText,
                          on && styles.sortCardTextOn,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.sheetFooter}>
              <Pressable
                style={styles.clearBtn}
                onPress={clearDraft}
                disabled={
                  draftFilters.length === 0 && draftSort === 'recommended'
                }
              >
                <Text style={styles.clearText}>Reset</Text>
              </Pressable>
              <Pressable style={styles.doneBtn} onPress={applyDraft}>
                <Text style={styles.doneText}>
                  Show {draftMatchCount} result{draftMatchCount === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
      </>
      ) : null}
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  empty: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: fonts.regular,
    color: 'rgba(255,255,255,0.85)',
  },
  wrap: {
    backgroundColor: colors.canvas,
  },
  blueHeader: {
    position: 'relative',
    overflow: 'hidden',
    paddingBottom: 0,
  },
  headerForeground: {
    position: 'relative',
    zIndex: 2,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  lightSheet: {
    ...StyleSheet.absoluteFill,
  },
  edgeAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 120,
    height: 120,
    borderBottomLeftRadius: 120,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  horizonLift: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 56,
  },
  searchZone: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
  },
  topBlue: {
    backgroundColor: 'transparent',
    paddingTop: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingLeft: 16,
    paddingRight: 10,
    borderRadius: 999,
    // Always light — sits on climate hero
    backgroundColor: lightColors.surface,
    borderWidth: 1,
    borderColor: lightColors.border,
    shadowColor: lightColors.ink,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  searchBarListening: {
    borderColor: lightColors.borderStrong,
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  searchLeadingIcon: {
    marginRight: 12,
  },
  searchMain: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    paddingRight: 8,
  },
  searchHint: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: lightColors.textMuted,
  },
  searchHintListening: {
    fontFamily: fonts.medium,
    color: lightColors.ink,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micBtnActive: {
    backgroundColor: 'rgba(234,67,53,0.1)',
  },
  expandHit: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
    paddingBottom: 8,
    paddingHorizontal: 12,
    minHeight: 36,
  },
  expandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    letterSpacing: -0.1,
  },
  expandArrows: {
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.55,
  },
  chevronStack: {
    marginBottom: -10,
  },
  expandedBlock: {
    paddingTop: 2,
    paddingBottom: 2,
  },
  expandedHint: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: 'rgba(255,255,255,0.78)',
    marginBottom: 10,
    marginLeft: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridCell: {
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  gridCellSelected: {
    backgroundColor: lightColors.canvas,
  },
  gridIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  gridLabel: {
    fontFamily: fonts.medium,
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
    width: '100%',
  },
  gridLabelSelected: {
    fontFamily: fonts.bold,
    color: lightColors.ink,
  },
  tabRail: {
    paddingHorizontal: 8,
    gap: 4,
    alignItems: 'stretch',
    paddingBottom: 0,
    minHeight: 70,
  },
  tabItem: {
    width: 76,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 4,
  },
  tabItemActive: {
    backgroundColor: lightColors.canvas,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 10,
  },
  tabLogo: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabImage: {
    width: 30,
    height: 30,
  },
  tabLabel: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 12,
    color: 'rgba(255,255,255,0.82)',
    textAlign: 'center',
    paddingHorizontal: 2,
  },
  tabLabelSelected: {
    fontFamily: fonts.semiBold,
    color: lightColors.ink,
  },
  /** Merchant block under header — flush, no sheet / radius */
  merchantSheet: {
    backgroundColor: 'transparent',
    paddingTop: 4,
    paddingBottom: 10,
  },
  activeDropTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  activeDropIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  activeDropTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.25,
    color: colors.heading,
  },
  activeDropSeeAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 4,
    paddingLeft: 4,
  },
  activeDropFilter: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  activeDropFilterOn: {
    backgroundColor: colors.brandSoft,
    borderColor: colors.brand,
  },
  activeDropFilterDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brand,
  },
  activeDropFilterCount: {
    fontFamily: fonts.semiBold,
    fontSize: 9,
    color: colors.white,
  },
  filterEmptyBox: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: 'center',
    gap: 10,
  },
  clearFiltersBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  clearFiltersText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  sheetRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%',
    paddingTop: 8,
    shadowColor: colors.ink,
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 18,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 999,
    backgroundColor: colors.borderStrong,
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  sheetHeaderCopy: {
    flex: 1,
    gap: 2,
  },
  sheetEyebrow: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.textSoft,
  },
  sheetTitle: {
    fontFamily: fonts.bold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  sheetSubtitle: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: colors.textMuted,
    marginTop: 2,
  },
  sheetClose: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sheetScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  sheetSectionLabel: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 10,
  },
  sheetSectionSpaced: {
    marginTop: 18,
  },
  filterCardList: {
    gap: 8,
  },
  filterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterCardOn: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  filterCardDisabled: {
    opacity: 0.45,
  },
  filterCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCardIconOn: {
    backgroundColor: colors.teal,
  },
  filterCardCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  filterCardTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  filterCardTitleOn: {
    color: colors.heading,
  },
  filterCardDesc: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSoft,
  },
  filterCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  filterCheckOn: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  sortGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sortCard: {
    width: '47.5%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sortCardOn: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  sortCardText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  sortCardTextOn: {
    color: colors.heading,
  },
  sheetFooter: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  clearBtn: {
    minWidth: 92,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  clearText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  doneBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: colors.ink,
  },
  doneText: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.onDark,
  },
  storeScroll: {
    backgroundColor: 'transparent',
  },
  dockTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  dockTabLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  dockIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandSoft,
  },
  dockIconImg: {
    width: 18,
    height: 18,
  },
  dockTitle: {
    flex: 1,
    fontFamily: fonts.bold,
    fontSize: 17,
    letterSpacing: -0.25,
    color: colors.heading,
  },
  sectionSeeAll: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },  loadingRow: {
    paddingHorizontal: 16,
    paddingVertical: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loadingText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  emptyMerchants: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSoft,
    textAlign: 'center',
  },
  storeRail: {
    paddingHorizontal: 14,
    gap: 10,
    paddingBottom: 2,
  },
  bizCard: {
    width: 196,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  photo: {
    height: 112,
    backgroundColor: colors.muted,
  },
  photoImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.semiBold,
    fontSize: 28,
    color: colors.onDark,
  },
  body: {
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
  },
  name: {
    flex: 1,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    color: colors.heading,
  },
  verified: {
    marginTop: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
  },
  category: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 3,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaStrong: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.heading,
  },
  meta: {
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  statusInline: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
  },
  statusTextOpen: {
    color: colors.open,
  },
  statusTextClosed: {
    color: colors.closed,
  },
  distanceInline: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
  },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locText: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: colors.textSoft,
  },
  about: {
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 15,
    color: colors.textMuted,
  },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    backgroundColor: colors.successBg,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  offer: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 11,
    color: colors.open,
  },
  ctaRow: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  ctaText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  seeAllCard: {
    width: 120,
    minHeight: 220,
    borderRadius: 14,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  seeAllCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  seeAllCardText: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.ink,
  },
  pressed: { opacity: 0.92 },
}));

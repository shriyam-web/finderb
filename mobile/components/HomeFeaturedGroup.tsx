import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CategorySymbol } from './CategorySymbol';
import {
  MerchantFilterSheet,
  MerchantFilterTrigger,
} from './MerchantFilterSheet';
import { applyFixedSlotOrder } from '../lib/categoryFixedSlots';
import {
  fetchBusinessesByCategory,
  getCategoryMerchantPool,
  getCategorySlotIds,
  peekBusinessesByCategory,
  type HomeCategory,
} from '../lib/api';
import { getBusinessOpenStatus } from '../lib/businessHours';
import { sortByUserLocation, type Coords } from '../lib/geo';
import { useDrivingDistanceLabel, useRoadDistanceOrder } from '../lib/drivingDistance';
import {
  DEFAULT_FILTERS,
  applyFilters,
  isDefaultFilters,
  type FilterState,
} from '../lib/merchantFilters';
import { getRatingDisplay, UNRATED_LABEL } from '../lib/ratingDisplay';
import { listingThumbUrl, type Merchant } from '../lib/merchants';
import { fonts } from '../constants/typography';
import { useTheme } from '../context/ThemeContext';
import { createThemedStyles } from '../hooks/useThemedStyles';

function isAllCategory(cat: Pick<HomeCategory, 'id'> | null | undefined) {
  return Boolean(cat?.id?.startsWith('all:'));
}

function realCategoriesOf(parent: HomeCategory) {
  return (parent.children ?? []).filter((cat) => !isAllCategory(cat));
}

function pickDefaultCategory(parent: HomeCategory): HomeCategory {
  const tabs = parent.children ?? [];
  const real = tabs.filter((cat) => !isAllCategory(cat));
  if (real.length === 1) return real[0];
  const allTab = tabs.find((cat) => isAllCategory(cat));
  if (allTab) return allTab;
  const withBiz = tabs.find((cat) => (cat.businessCount || 0) > 0);
  return withBiz ?? tabs[0] ?? parent;
}

function nestedTabsFor(category: HomeCategory | null): HomeCategory[] {
  if (!category || isAllCategory(category)) return [];
  const kids = category.children ?? [];
  if (kids.length === 0) return [];
  return [
    {
      ...category,
      id: `all:${category.id}`,
      name: 'All',
      queryName: category.queryName || category.name,
    },
    ...kids,
  ];
}

function leafCategory(raw: string) {
  if (!raw) return 'Business';
  const leaf = raw.includes('›') ? raw.split('›').pop()!.trim() : raw.trim();
  return leaf || 'Business';
}

function shortAbout(raw: string | null | undefined) {
  if (!raw) return '';
  return raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function shuffleMerchants<T>(items: T[], seed: number): T[] {
  const arr = [...items];
  let state = seed || 1;
  const next = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(next() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function hexAlpha(hex: string, alpha: number) {
  const value = hex.replace('#', '').slice(0, 6);
  if (value.length !== 6) return hex;
  const a = Math.round(Math.min(1, Math.max(0, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${value}${a}`;
}

const webNameRow = {
  display: 'flex',
  maxWidth: '100%',
  alignSelf: 'flex-start',
} as const;

const webNameWrap = {
  minWidth: 0,
  maxWidth: '100%',
  overflow: 'hidden',
} as const;

const webNameText = {
  maxWidth: '100%',
} as const;

const webNameTextCompact = {
  ...webNameText,
} as const;

const webTabScroll = {
  overflowX: 'auto',
  overflowY: 'hidden',
} as const;

function webSelectedTabShadow(isDark: boolean) {
  return {
    boxShadow: isDark
      ? 'inset 0 1px 0 rgba(255,255,255,0.14), inset 0 -1px 0 rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.16), 0 4px 14px rgba(0,0,0,0.45)'
      : 'inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(28,25,23,0.1), 0 0 0 1px rgba(28,25,23,0.14), 0 3px 10px rgba(28,25,23,0.12)',
  } as const;
}

function MerchantCard({
  merchant,
  compact,
  fill,
  wash,
  userCoords,
  onPress,
}: {
  merchant: Merchant;
  compact?: boolean;
  fill?: boolean;
  wash: string;
  userCoords?: Coords | null;
  onPress: () => void;
}) {
  const { colors, gradients } = useTheme();
  const styles = useStyles();
  const rating = getRatingDisplay(merchant.rating, merchant.reviewsCount);
  const open = getBusinessOpenStatus(merchant.timings);
  const distanceLabel = useDrivingDistanceLabel(merchant.latitude, merchant.longitude);
  const place = (merchant.location || merchant.city || '').trim();
  const showLocation = Boolean(distanceLabel || place);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        compact && !fill && styles.cardCompact,
        fill && styles.cardFill,
        pressed && styles.pressed,
      ]}
      accessibilityLabel={
        shortAbout(merchant.about)
          ? `${merchant.name}. ${shortAbout(merchant.about)}`
          : merchant.name
      }
    >
      <View
        style={[
          styles.photo,
          compact && styles.photoCompact,
          fill && styles.photoFill,
        ]}
      >
        {merchant.image ? (
          <Image
            source={{ uri: listingThumbUrl(merchant.image) || merchant.image }}
            style={styles.photoImg}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="high"
            recyclingKey={merchant.id}
          />
        ) : (
          <LinearGradient
            colors={[...gradients.spotlight]}
            style={styles.photoImg}
          >
            <Text style={styles.initial}>{merchant.name.slice(0, 1)}</Text>
          </LinearGradient>
        )}
        <LinearGradient
          pointerEvents="none"
          colors={[
            hexAlpha(wash, 0),
            // Bottom wash reduced ~40% so photos stay clearer
            hexAlpha(wash, 0.05),
            hexAlpha(wash, 0.25),
            hexAlpha(wash, 0.49),
            hexAlpha(wash, 0.6),
          ]}
          locations={[0.45, 0.62, 0.78, 0.9, 1]}
          style={[styles.photoFade, compact && styles.photoFadeCompact]}
        />
      </View>
      <View
        style={[
          styles.body,
          compact && styles.bodyCompact,
          fill && styles.bodyFill,
        ]}
      >
        <View
          style={[styles.nameRow, Platform.OS === 'web' && webNameRow]}
        >
          <View
            style={[styles.nameWrap, Platform.OS === 'web' && webNameWrap]}
          >
            <Text
              style={[
                styles.name,
                Platform.OS === 'web' && webNameText,
                compact && styles.nameCompact,
                compact && Platform.OS === 'web' && webNameTextCompact,
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {merchant.name}
            </Text>
          </View>
          {merchant.isVerified ? (
            <View style={styles.verified} pointerEvents="none">
              <Ionicons name="checkmark" size={9} color={colors.onDark} />
            </View>
          ) : null}
        </View>
        <Text style={styles.category} numberOfLines={1}>
          {leafCategory(merchant.category)}
        </Text>
        <View style={styles.metaRow}>
          {rating.rated ? (
            <View style={styles.rating}>
              <Ionicons name="star" size={12} color={colors.star} />
              <Text style={styles.metaStrong}>{rating.label}</Text>
              {rating.showCount ? <Text style={styles.meta}>({rating.reviewCount})</Text> : null}
            </View>
          ) : (
            <View style={styles.rating}>
              <Text style={styles.metaNew}>New</Text>
              <Text style={styles.meta}>· {UNRATED_LABEL}</Text>
            </View>
          )}
          {open.status === 'Open' || open.status === 'Closed' ? (
            <Text
              style={[
                styles.status,
                open.status === 'Open'
                  ? styles.statusOpen
                  : styles.statusClosed,
              ]}
            >
              · {open.status === 'Open' ? 'Open now' : 'Closed'}
            </Text>
          ) : null}
        </View>
        {showLocation ? (
          <View style={styles.locRow}>
            <Ionicons
              name="location-outline"
              size={12}
              color={colors.textSoft}
            />
            <Text style={styles.distance} numberOfLines={1}>
              {distanceLabel
                ? `${distanceLabel}${place ? ` · ${place}` : ''}`
                : place}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function SeeAllCard({
  compact,
  fill,
  onPress,
}: {
  compact?: boolean;
  fill?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.seeAllCard,
        compact && styles.seeAllCardCompact,
        fill && styles.seeAllCardFill,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.seeAllCircle}>
        <Ionicons name="arrow-forward" size={18} color={colors.ink} />
      </View>
      <Text style={styles.seeAllCardText}>See all</Text>
    </Pressable>
  );
}

function MerchantSkeletonCard() {
  const styles = useStyles();
  return (
    <View style={styles.card}>
      <View style={styles.photo} />
      <View style={styles.skeletonBody}>
        <View style={styles.skeletonLine} />
        <View style={[styles.skeletonLine, styles.skeletonLineShort]} />
        <View style={[styles.skeletonLine, styles.skeletonLineTiny]} />
      </View>
    </View>
  );
}

function MerchantSkeletonRow({ folderOpen }: { folderOpen?: boolean }) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.rail, folderOpen && styles.railInFolder]}
    >
      {Array.from({ length: 4 }).map((_, index) => (
        <MerchantSkeletonCard key={index} />
      ))}
    </ScrollView>
  );
}

/** Reserved height for a parent section before its category row exists. */
export function HomeSectionSkeleton() {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <View style={styles.head}>
        <View style={styles.skeletonTitle} />
      </View>
      <MerchantSkeletonRow />
    </View>
  );
}

function MerchantRow({
  merchants,
  compact,
  nested,
  folderOpen,
  wash,
  userCoords,
  showSeeAll,
  onOpenMerchant,
  onSeeAll,
}: {
  merchants: Merchant[];
  compact?: boolean;
  nested?: boolean;
  folderOpen?: boolean;
  wash: string;
  userCoords?: Coords | null;
  showSeeAll?: boolean;
  onOpenMerchant: (merchant: Merchant) => void;
  onSeeAll: () => void;
}) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[
        styles.rail,
        folderOpen && styles.railInFolder,
        nested && styles.railInSplit,
      ]}
      nestedScrollEnabled
      decelerationRate="fast"
    >
      {merchants.map((merchant) => (
        <MerchantCard
          key={merchant.id}
          merchant={merchant}
          compact={compact}
          wash={wash}
          userCoords={userCoords}
          onPress={() => onOpenMerchant(merchant)}
        />
      ))}
      {showSeeAll ? (
        <SeeAllCard compact={compact} onPress={onSeeAll} />
      ) : null}
    </ScrollView>
  );
}

type Props = {
  group: HomeCategory;
  city?: string | null;
  userCoords?: Coords | null;
  reloadToken?: number;
  eager?: boolean;
  muted?: boolean;
  onReady?: () => void;
  onEmptyAll?: (groupId: string) => void;
  onOpenCategory: (category: HomeCategory) => void;
  onOpenMerchant: (merchant: Merchant) => void;
  onExpand?: () => void;
};

export function HomeFeaturedGroup({
  group,
  city,
  userCoords,
  reloadToken = 0,
  eager = false,
  muted = false,
  onReady,
  onEmptyAll,
  onOpenCategory,
  onOpenMerchant,
  onExpand,
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = useStyles();
  const categoryTabs = group.children ?? [];
  const hideCategoryRow = realCategoriesOf(group).length <= 1;
  const [categoryId, setCategoryId] = useState(
    () => pickDefaultCategory(group).id,
  );
  const [nestedId, setNestedId] = useState<string | null>(null);
  const initialQuery =
    pickDefaultCategory(group).queryName || group.queryName || group.name;
  const initialPool = getCategoryMerchantPool(initialQuery);
  const initialCached = peekBusinessesByCategory(initialQuery, {
    page: 1,
    pageSize: 24,
  });
  const [merchants, setMerchants] = useState<Merchant[]>(
    () => initialPool ?? initialCached?.merchants ?? [],
  );
  const [slotIds, setSlotIds] = useState<Array<string | null>>(() =>
    getCategorySlotIds(initialQuery),
  );
  const [loading, setLoading] = useState(!initialPool && !initialCached);
  const [orderSeed, setOrderSeed] = useState(() => Math.floor(Math.random() * 1e9) || 1);
  const skipSeedReset = useRef(true);
  const [active, setActive] = useState(eager);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);
  const readySent = useRef(false);
  const tabRailRef = useRef<ScrollView>(null);
  const tabLayoutW = useRef(0);
  const tabContentW = useRef(0);
  const tabOffsetX = useRef(0);
  const [tabCanScrollLeft, setTabCanScrollLeft] = useState(false);
  const [tabCanScrollRight, setTabCanScrollRight] = useState(false);
  const onReadyRef = useRef(onReady);
  const onEmptyAllRef = useRef(onEmptyAll);
  const coordsRef = useRef(userCoords);
  const listingQueryRef = useRef('');
  onReadyRef.current = onReady;
  onEmptyAllRef.current = onEmptyAll;
  coordsRef.current = userCoords;

  const selectedCategory = useMemo(() => {
    if (categoryTabs.length === 0) return group;
    return categoryTabs.find((cat) => cat.id === categoryId) ?? pickDefaultCategory(group);
  }, [categoryId, categoryTabs, group]);

  const orderedCategoryTabs = categoryTabs;

  const nestedTabs = useMemo(
    () => nestedTabsFor(selectedCategory),
    [selectedCategory],
  );

  useEffect(() => {
    setTabCanScrollLeft(tabOffsetX.current > 12);
    setTabCanScrollRight(
      tabContentW.current - tabLayoutW.current - tabOffsetX.current > 12,
    );
  }, [selectedCategory.id]);

  useEffect(() => {
    setNestedId(null);
  }, [selectedCategory.id]);

  const syncTabScrollHint = () => {
    setTabCanScrollLeft(tabOffsetX.current > 12);
    setTabCanScrollRight(
      tabContentW.current - tabLayoutW.current - tabOffsetX.current > 12,
    );
  };

  const nestedSelected = useMemo(() => {
    if (nestedTabs.length === 0) return null;
    return nestedTabs.find((cat) => cat.id === nestedId) ?? nestedTabs[0];
  }, [nestedId, nestedTabs]);

  const folderOpen = !hideCategoryRow && orderedCategoryTabs.length > 0;
  const pageWash = muted ? colors.surfaceSoft : colors.canvas;
  const panelWash = folderOpen ? colors.surface : pageWash;

  const listingSource = useMemo(() => {
    if (nestedSelected && !isAllCategory(nestedSelected)) return nestedSelected;
    if (selectedCategory && !isAllCategory(selectedCategory)) return selectedCategory;
    return group;
  }, [group, nestedSelected, selectedCategory]);

  const listingQuery = listingSource.queryName || listingSource.name;
  listingQueryRef.current = listingQuery;
  const seeAllTarget =
    listingSource && !isAllCategory(listingSource) ? listingSource : group;

  useEffect(() => {
    if (eager) setActive(true);
  }, [eager]);

  useEffect(() => {
    if (!active || !listingQuery) return;

    const allQuery = (group.queryName || group.name).trim();
    const applyList = (
      list: Merchant[],
      query: string,
      confirmedEmpty: boolean,
    ) => {
      const pool = getCategoryMerchantPool(query);
      setMerchants(pool ? [...pool] : list);
      setSlotIds(getCategorySlotIds(query));
      setLoading(false);
      if (!readySent.current) {
        readySent.current = true;
        onReadyRef.current?.();
      }
      if (
        confirmedEmpty &&
        query.trim().toLowerCase() === allQuery.toLowerCase() &&
        list.length === 0
      ) {
        onEmptyAllRef.current?.(group.id);
      }
    };

    const cached = peekBusinessesByCategory(listingQuery, {
      page: 1,
      pageSize: 24,
    });
    if (cached) {
      applyList(cached.merchants, listingQuery, true);
      return;
    }

    const requested = listingQuery;
    setLoading(true);
    void fetchBusinessesByCategory(requested, {
      page: 1,
      pageSize: 24,
    })
      .then((result) => {
        if (listingQueryRef.current !== requested) return;
        applyList(result.merchants, requested, !result.error);
      })
      .catch(() => {
        if (listingQueryRef.current !== requested) return;
        applyList([], requested, false);
      });
  }, [active, listingQuery, listingSource.id, reloadToken, city, group.id, group.name, group.queryName]);

  useEffect(() => {
    if (skipSeedReset.current) {
      skipSeedReset.current = false;
      return;
    }
    setOrderSeed(Math.floor(Math.random() * 1e9) || 1);
  }, [listingQuery, reloadToken]);

  const filtersIdle = isDefaultFilters(filters);

  const previewMerchants = useMemo(() => {
    if (filtersIdle) {
      return applyFixedSlotOrder(shuffleMerchants(merchants, orderSeed), slotIds).slice(0, 8);
    }
    const ranked = sortByUserLocation(merchants, {
      coords: userCoords,
      city,
    });
    return applyFilters(ranked, filters, userCoords).slice(0, 8);
  }, [city, filters, filtersIdle, merchants, orderSeed, slotIds, userCoords]);
  const roadOrdered = useRoadDistanceOrder(previewMerchants);
  const visibleMerchants = filters.distance !== 'any' ? roadOrdered : previewMerchants;

  const filterMatchCount = useMemo(
    () => applyFilters(merchants, filters, userCoords).length,
    [filters, merchants, userCoords],
  );

  return (
    <View style={[styles.section, muted && styles.sectionMuted]}>
      <View style={styles.head}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {group.name}
          </Text>
          {onExpand ? (
            <Pressable
              onPress={onExpand}
              style={({ pressed }) => [
                styles.expandBtn,
                pressed && styles.pressed,
              ]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Open full ${group.name} view`}
            >
              <Ionicons
                name="arrow-up-outline"
                size={16}
                color={colors.textMuted}
                style={styles.expandIcon}
              />
            </Pressable>
          ) : null}
        </View>
        <MerchantFilterTrigger
          filters={filters}
          onOpen={() => setFilterOpen(true)}
          onClear={() => setFilters(DEFAULT_FILTERS)}
        />
      </View>

      <View style={folderOpen ? styles.folder : undefined}>
        {folderOpen ? (
          <View style={styles.tabBar}>
            <ScrollView
              ref={tabRailRef}
              horizontal
              style={[
                styles.tabScroll,
                Platform.OS === 'web' && webTabScroll,
              ]}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabRailWrap}
              scrollEventThrottle={16}
              onLayout={(event) => {
                tabLayoutW.current = event.nativeEvent.layout.width;
                syncTabScrollHint();
              }}
              onContentSizeChange={(width) => {
                tabContentW.current = width;
                syncTabScrollHint();
              }}
              onScroll={(event) => {
                tabOffsetX.current = event.nativeEvent.contentOffset.x;
                syncTabScrollHint();
              }}
            >
              <View
                style={styles.tabRail}
                onLayout={(event) => {
                  tabContentW.current = event.nativeEvent.layout.width;
                  syncTabScrollHint();
                }}
              >
              {orderedCategoryTabs.map((cat, index) => {
                const selected = selectedCategory.id === cat.id;
                const afterSelected =
                  index > 0 &&
                  orderedCategoryTabs[index - 1].id === selectedCategory.id;
                const showSplit = index > 0 && !selected && !afterSelected;
                const showSymbol =
                  !isAllCategory(cat) && Boolean(cat.icon?.trim());
                return (
                  <View key={cat.id} style={styles.tabSlot}>
                    {showSplit ? <View style={styles.tabSplit} /> : null}
                    <View style={selected ? styles.tabSlotOn : undefined}>
                      <Pressable
                        onPress={() => setCategoryId(cat.id)}
                        style={[
                          styles.tab,
                          selected && styles.tabOn,
                          selected &&
                            Platform.OS === 'web' &&
                            webSelectedTabShadow(isDark),
                        ]}
                      >
                      {selected ? (
                        <>
                          <LinearGradient
                            pointerEvents="none"
                            colors={
                              isDark
                                ? [
                                    colors.surfaceSoft,
                                    colors.surface,
                                    colors.muted,
                                  ]
                                : [
                                    colors.surface,
                                    colors.surfaceSoft,
                                    colors.muted,
                                  ]
                            }
                            locations={[0, 0.45, 1]}
                            start={{ x: 0.12, y: 0 }}
                            end={{ x: 0.88, y: 1 }}
                            style={styles.tabOnFill}
                          />
                          <LinearGradient
                            pointerEvents="none"
                            colors={
                              isDark
                                ? [
                                    hexAlpha('#FFFFFF', 0.16),
                                    hexAlpha('#FFFFFF', 0),
                                  ]
                                : [
                                    hexAlpha(colors.frost, 0.92),
                                    hexAlpha(colors.frost, 0),
                                  ]
                            }
                            start={{ x: 0.5, y: 0 }}
                            end={{ x: 0.5, y: 1 }}
                            style={styles.tabOnShine}
                          />
                          <LinearGradient
                            pointerEvents="none"
                            colors={
                              isDark
                                ? [
                                    hexAlpha('#FFFFFF', 0.1),
                                    hexAlpha('#FFFFFF', 0),
                                  ]
                                : [
                                    hexAlpha(colors.frost, 0.4),
                                    hexAlpha(colors.frost, 0),
                                  ]
                            }
                            start={{ x: 0, y: 0.5 }}
                            end={{ x: 1, y: 0.5 }}
                            style={styles.tabOnBevel}
                          />
                          <View pointerEvents="none" style={styles.tabOnEdge} />
                        </>
                      ) : null}
                      <View style={styles.tabInner} pointerEvents="none">
                        {showSymbol ? (
                          <CategorySymbol
                            category={cat}
                            size={16}
                            color={selected ? colors.heading : colors.textMuted}
                          />
                        ) : null}
                        <Text
                          style={[styles.tabText, selected && styles.tabTextOn]}
                          numberOfLines={1}
                        >
                          {cat.name}
                        </Text>
                      </View>
                    </Pressable>
                    </View>
                  </View>
                );
              })}
              </View>
            </ScrollView>
            {tabCanScrollLeft ? (
              <Pressable
                onPress={() =>
                  tabRailRef.current?.scrollTo({
                    x: Math.max(0, tabOffsetX.current - 140),
                    animated: true,
                  })
                }
                style={styles.tabMoreLeft}
                accessibilityRole="button"
                accessibilityLabel="Previous categories"
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={[pageWash, hexAlpha(pageWash, 0)]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.tabMoreFade}
                />
                <View
                  pointerEvents="none"
                  style={[styles.tabMoreSolidLeft, { backgroundColor: pageWash }]}
                />
                <Ionicons
                  name="chevron-back"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            ) : null}
            {tabCanScrollRight ? (
              <Pressable
                onPress={() =>
                  tabRailRef.current?.scrollTo({
                    x: tabOffsetX.current + 140,
                    animated: true,
                  })
                }
                style={styles.tabMoreRight}
                accessibilityRole="button"
                accessibilityLabel="More categories"
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={[hexAlpha(pageWash, 0), pageWash]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.tabMoreFade}
                />
                <View
                  pointerEvents="none"
                  style={[styles.tabMoreSolidRight, { backgroundColor: pageWash }]}
                />
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={colors.textMuted}
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={folderOpen ? styles.folderPanel : undefined}>
          {nestedTabs.length > 0 ? (
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRail}
            >
              {nestedTabs.map((cat) => {
                const selected = nestedSelected?.id === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setNestedId(cat.id)}
                    style={[styles.pill, selected && styles.pillOn]}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    {!isAllCategory(cat) && cat.icon?.trim() ? (
                      <CategorySymbol
                        category={cat}
                        size={14}
                        color={selected ? colors.frost : colors.textMuted}
                      />
                    ) : null}
                    <Text
                      style={[styles.pillText, selected && styles.pillTextOn]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          ) : null}

          {loading ? (
            <MerchantSkeletonRow folderOpen={folderOpen} />
          ) : visibleMerchants.length === 0 ? (
            <Text style={[styles.empty, folderOpen && styles.emptyInFolder]}>
              {filtersIdle
                ? 'No places found in this category'
                : 'No places match these filters'}
            </Text>
          ) : (
            <MerchantRow
              merchants={visibleMerchants}
              folderOpen={folderOpen}
              wash={panelWash}
              userCoords={userCoords}
              showSeeAll
              onOpenMerchant={onOpenMerchant}
              onSeeAll={() => onOpenCategory(seeAllTarget)}
            />
          )}
        </View>
      </View>

      <MerchantFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        matchCount={filterMatchCount}
        placeName={group.name}
        hasLocation={Boolean(userCoords)}
      />
    </View>
  );
}

const useStyles = createThemedStyles((colors) => ({
  section: {
    paddingTop: 12,
    paddingBottom: 5,
    backgroundColor: colors.canvas,
  },
  sectionMuted: {
    backgroundColor: colors.surfaceSoft,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 8,
  },
  title: {
    flexShrink: 1,
    minWidth: 0,
    fontFamily: fonts.extraBold,
    fontSize: 20,
    letterSpacing: -0.35,
    color: colors.heading,
  },
  expandBtn: {
    flexGrow: 0,
    flexShrink: 0,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expandIcon: {
    transform: [{ rotate: '45deg' }],
  },
  folder: {
    paddingHorizontal: 0,
    minWidth: 0,
    alignSelf: 'stretch',
  },
  tabBar: {
    zIndex: 2,
    marginBottom: -1,
    overflow: 'visible',
    position: 'relative',
    width: '100%',
    minWidth: 0,
    alignSelf: 'stretch',
  },
  tabScroll: {
    width: '100%',
    minWidth: 0,
  },
  tabRailWrap: {
    flexGrow: 0,
  },
  tabRail: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 12,
    paddingRight: 40,
    paddingTop: 6,
    paddingBottom: 0,
  },
  tabMoreLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 2,
    paddingTop: 6,
    zIndex: 4,
  },
  tabMoreRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 2,
    paddingTop: 6,
    zIndex: 4,
  },
  tabMoreFade: {
    ...StyleSheet.absoluteFill,
  },
  tabMoreSolidLeft: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 18,
  },
  tabMoreSolidRight: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 18,
  },
  tabSlot: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tabSlotOn: {
    zIndex: 4,
    elevation: 5,
    shadowColor: '#000000',
    shadowOpacity: colors.statusBarStyle === 'light' ? 0.5 : 0.14,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
  },
  tabSplit: {
    width: StyleSheet.hairlineWidth * 2,
    height: 14,
    marginHorizontal: 4,
    borderRadius: 1,
    backgroundColor: colors.borderStrong,
    opacity: 0.45,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 9,
    paddingBottom: 8,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  tabOn: {
    zIndex: 3,
    paddingTop: 10,
    paddingBottom: 9,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderStrong,
    borderTopColor:
      colors.statusBarStyle === 'light'
        ? hexAlpha('#FFFFFF', 0.28)
        : hexAlpha(colors.ink, 0.16),
    borderLeftColor:
      colors.statusBarStyle === 'light'
        ? hexAlpha('#FFFFFF', 0.18)
        : hexAlpha(colors.ink, 0.12),
    borderRightColor:
      colors.statusBarStyle === 'light'
        ? hexAlpha('#FFFFFF', 0.18)
        : hexAlpha(colors.ink, 0.12),
    overflow: 'hidden',
  },
  tabInner: {
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabOnFill: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tabOnShine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 13,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  tabOnBevel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 9,
    borderTopLeftRadius: 12,
  },
  tabOnEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth * 2,
    backgroundColor:
      colors.statusBarStyle === 'light'
        ? hexAlpha('#000000', 0.45)
        : hexAlpha(colors.ink, 0.1),
  },
  tabText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  tabTextOn: {
    fontFamily: fonts.semiBold,
    color: colors.heading,
  },
  pillRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 16,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: 168,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pillOn: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  pillText: {
    flexShrink: 1,
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.textMuted,
  },
  pillTextOn: {
    color: colors.frost,
  },
  folderPanel: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    borderColor: colors.borderStrong,
    borderRadius: 0,
    paddingTop: 8,
    paddingBottom: 12,
    overflow: 'hidden',
  },
  folderPanelSplit: {
    paddingTop: 0,
    paddingBottom: 0,
  },
  split: {
    flexDirection: 'row',
    alignItems: 'stretch',
    width: '100%',
  },
  subList: {
    width: 140,
    maxWidth: 140,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: 140,
    overflow: 'visible',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  subListScroll: {
    flex: 1,
    overflow: 'visible',
  },
  subListRail: {
    paddingVertical: 10,
    paddingLeft: 8,
    paddingRight: 10,
  },
  subItem: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  subItemOn: {
    backgroundColor: colors.brandSoft,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    paddingRight: 16,
    marginRight: -8,
    zIndex: 2,
  },
  subItemText: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 17,
    color: colors.textMuted,
    flexWrap: 'wrap',
  },
  subItemTextOn: {
    fontFamily: fonts.semiBold,
    color: colors.heading,
  },
  subItemCaret: {
    position: 'absolute',
    right: -7,
    top: '50%',
    width: 14,
    height: 14,
    marginTop: -7,
    backgroundColor: colors.brandSoft,
    transform: [{ rotate: '45deg' }],
  },
  subSplit: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 4,
    marginHorizontal: 6,
    backgroundColor: colors.border,
  },
  splitMain: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'flex-start',
    paddingVertical: 6,
  },
  splitStack: {
    gap: 8,
    paddingTop: 6,
    paddingBottom: 6,
  },
  nestedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 16,
    paddingHorizontal: 8,
    paddingTop: 4,
    paddingBottom: 10,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 22,
  },
  loadingInFolder: {
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  loadingInSplit: {
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  emptyInFolder: {
    paddingHorizontal: 12,
  },
  emptyInSplit: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  railInFolder: {
    paddingLeft: 12,
    paddingRight: 16,
  },
  railInSplit: {
    paddingLeft: 8,
    paddingRight: 10,
    paddingBottom: 0,
    gap: 8,
    alignItems: 'flex-start',
  },
  loadingText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.textMuted,
  },
  empty: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
  },
  rail: {
    paddingLeft: 12,
    paddingRight: 16,
    gap: 12,
    paddingBottom: 6,
  },
  card: {
    width: 184,
  },
  cardCompact: {
    width: 156,
  },
  cardFill: {
    width: '47%',
    flexGrow: 1,
    minWidth: 0,
  },
  skeletonTitle: {
    width: 148,
    height: 18,
    borderRadius: 6,
    backgroundColor: colors.muted,
  },
  skeletonBody: {
    paddingTop: 8,
    gap: 6,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.muted,
  },
  skeletonLineShort: {
    width: '72%',
  },
  skeletonLineTiny: {
    width: '46%',
  },
  photo: {
    height: 142,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.muted,
  },
  photoCompact: {
    height: 108,
    borderRadius: 12,
  },
  photoFill: {
    height: 118,
    borderRadius: 12,
  },
  photoFadeCompact: {
    height: 36,
  },
  bodyCompact: {
    paddingTop: 5,
    gap: 2,
  },
  bodyFill: {
    paddingTop: 6,
    gap: 3,
  },
  nameCompact: {
    fontSize: 13,
    lineHeight: 16,
    maxHeight: 32,
  },
  photoImg: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 53,
  },
  initial: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.onDark,
  },
  body: {
    paddingTop: 8,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    alignSelf: 'flex-start',
    maxWidth: '100%',
    gap: 4,
  },
  nameWrap: {
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
    overflow: 'hidden',
  },
  name: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    lineHeight: 18,
    maxHeight: 36,
    color: colors.heading,
  },
  verified: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginBottom: 2,
    flexGrow: 0,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.verified,
  },
  category: {
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaStrong: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  meta: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textSoft,
  },
  metaNew: {
    fontFamily: fonts.semiBold,
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.brand,
  },
  status: {
    fontFamily: fonts.medium,
    fontSize: 12,
  },
  statusOpen: { color: colors.open },
  statusClosed: { color: colors.closed },
  locRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  distance: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 11,
    color: colors.textSoft,
  },
  seeAllCard: {
    width: 88,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  seeAllCardCompact: {
    alignSelf: 'center',
  },
  seeAllCardFill: {
    width: '47%',
    flexGrow: 1,
    minWidth: 0,
    minHeight: 140,
    alignSelf: 'stretch',
  },
  seeAllCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  seeAllCardText: {
    fontFamily: fonts.semiBold,
    fontSize: 12,
    color: colors.ink,
  },
  pressed: { opacity: 0.88 },
}));

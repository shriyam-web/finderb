import { Href, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryMerchantRow } from '../../../components/CategoryMerchantRow';
import { CategorySymbol } from '../../../components/CategorySymbol';
import {
  MerchantFilterSheet,
  MerchantFilterTrigger,
} from '../../../components/MerchantFilterSheet';
import { fonts } from '../../../constants/typography';
import { useAppLocation } from '../../../context/LocationContext';
import { useTheme } from '../../../context/ThemeContext';
import { useTabScrollPadding } from '../../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../../hooks/useThemedStyles';
import {
  fetchBusinessesByCategory,
  peekBusinessesByCategory,
  type HomeCategory,
} from '../../../lib/api';
import { formatDistanceFromUser, sortByUserLocation } from '../../../lib/geo';
import { goBackOrHome } from '../../../lib/navigation';
import {
  getHomeBootstrapCache,
  loadHomeBootstrap,
} from '../../../lib/homeBootstrap';
import {
  DEFAULT_FILTERS,
  applyFilters,
  isDefaultFilters,
  type FilterState,
} from '../../../lib/merchantFilters';
import type { Merchant } from '../../../lib/merchants';
import { resolveMerchantSlug } from '../../../lib/merchants';

const PAGE_SIZE = 16;
const NAV_W = 136;

function isAllCategory(cat: Pick<HomeCategory, 'id'> | null | undefined) {
  return Boolean(cat?.id?.startsWith('all:'));
}

function findGroup(
  categories: HomeCategory[],
  slug: string,
): HomeCategory | null {
  const key = slug.trim().toLowerCase();
  if (!key) return null;
  return (
    categories.find((cat) => cat.slug.toLowerCase() === key) ||
    categories.find((cat) => cat.id === slug) ||
    null
  );
}

function realCategoriesOf(parent: HomeCategory) {
  return (parent.children ?? []).filter((cat) => !isAllCategory(cat));
}

function defaultCategoryId(group: HomeCategory | null) {
  if (!group) return null;
  const kids = realCategoriesOf(group);
  const nested = kids.find((cat) => (cat.children?.length ?? 0) > 0);
  return (nested ?? kids[0] ?? group).id;
}

function nestedTabsFor(category: HomeCategory | null): HomeCategory[] {
  if (!category || isAllCategory(category)) return [];
  const kids = (category.children ?? []).filter((cat) => !isAllCategory(cat));
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

export default function CategoryExpandScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const location = useAppLocation();
  const listPad = useTabScrollPadding(16);
  const params = useLocalSearchParams<{ slug?: string | string[] }>();
  const slug = useMemo(() => {
    const raw = params.slug;
    const value = Array.isArray(raw) ? raw[0] : raw;
    try {
      return decodeURIComponent(value?.trim() || '');
    } catch {
      return value?.trim() || '';
    }
  }, [params.slug]);

  const [group, setGroup] = useState<HomeCategory | null>(() =>
    findGroup(getHomeBootstrapCache()?.categories ?? [], slug),
  );
  const [loadingGroup, setLoadingGroup] = useState(!group);
  const [categoryId, setCategoryId] = useState<string | null>(() =>
    defaultCategoryId(group),
  );
  const [nestedId, setNestedId] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [filterOpen, setFilterOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cached = findGroup(getHomeBootstrapCache()?.categories ?? [], slug);
      if (cached) {
        setGroup(cached);
        setCategoryId((id) => id || defaultCategoryId(cached));
        setLoadingGroup(false);
        return;
      }
      setLoadingGroup(true);
      const data = await loadHomeBootstrap();
      if (cancelled) return;
      const next = findGroup(data.categories, slug);
      setGroup(next);
      setCategoryId((id) => id || defaultCategoryId(next));
      setLoadingGroup(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const categoryTabs = useMemo(() => {
    if (!group) return [];
    const kids = realCategoriesOf(group);
    const allTab: HomeCategory = {
      ...group,
      id: `all:${group.id}`,
      name: 'All',
      queryName: group.queryName || group.name,
    };
    return kids.length > 0 ? [allTab, ...kids] : [allTab];
  }, [group]);

  const selectedCategory = useMemo(() => {
    if (!group) return null;
    return (
      categoryTabs.find((cat) => cat.id === categoryId) ??
      categoryTabs[0] ??
      group
    );
  }, [categoryId, categoryTabs, group]);

  const nestedTabs = useMemo(
    () => nestedTabsFor(selectedCategory),
    [selectedCategory],
  );

  const nestedSelected = useMemo(() => {
    if (nestedTabs.length === 0) return null;
    return nestedTabs.find((cat) => cat.id === nestedId) ?? nestedTabs[0];
  }, [nestedId, nestedTabs]);

  const listingSource = useMemo(() => {
    if (nestedSelected && !isAllCategory(nestedSelected)) return nestedSelected;
    if (selectedCategory && !isAllCategory(selectedCategory)) {
      return selectedCategory;
    }
    return group;
  }, [group, nestedSelected, selectedCategory]);

  const listingQuery = listingSource?.queryName || listingSource?.name || '';

  const loadPage = useCallback(
    async (nextPage: number, replace: boolean) => {
      if (!listingQuery) return;
      if (replace) {
        const cached = peekBusinessesByCategory(listingQuery, {
          page: nextPage,
          pageSize: PAGE_SIZE,
        });
        if (cached) {
          const ranked = sortByUserLocation(cached.merchants, {
            coords: location.coords,
            city: location.city,
          });
          setMerchants(ranked);
          setPage(cached.page);
          setHasMore(cached.hasMore);
          setLoadingList(false);
          setLoadingMore(false);
          return;
        }
        setLoadingList(true);
      } else {
        setLoadingMore(true);
      }
      const result = await fetchBusinessesByCategory(listingQuery, {
        page: nextPage,
        pageSize: PAGE_SIZE,
      });
      const ranked = sortByUserLocation(result.merchants, {
        coords: location.coords,
        city: location.city,
      });
      setMerchants((prev) => (replace ? ranked : [...prev, ...ranked]));
      setPage(nextPage);
      setHasMore(result.hasMore);
      setLoadingList(false);
      setLoadingMore(false);
    },
    [listingQuery, location.city, location.coords],
  );

  useEffect(() => {
    setPage(1);
    if (!listingQuery) {
      setMerchants([]);
      return;
    }
    const cached = peekBusinessesByCategory(listingQuery, {
      page: 1,
      pageSize: PAGE_SIZE,
    });
    if (!cached) setMerchants([]);
    void loadPage(1, true);
  }, [loadPage, listingQuery]);

  const filtersIdle = isDefaultFilters(filters);
  const visibleMerchants = useMemo(
    () =>
      filtersIdle
        ? merchants
        : applyFilters(merchants, filters, location.coords),
    [filters, filtersIdle, location.coords, merchants],
  );
  const filterMatchCount = visibleMerchants.length;

  useEffect(() => {
    if (filtersIdle || loadingList || loadingMore || !hasMore) return;
    if (visibleMerchants.length >= PAGE_SIZE) return;
    void loadPage(page + 1, false);
  }, [
    filtersIdle,
    hasMore,
    loadingList,
    loadingMore,
    loadPage,
    page,
    visibleMerchants.length,
  ]);

  const goBack = () => {
    goBackOrHome(router);
  };

  const openMerchant = (merchant: Merchant) => {
    router.push(
      `/(tabs)/merchant/${resolveMerchantSlug(merchant)}` as Href,
    );
  };

  const showNav = categoryTabs.length > 1;
  const heading =
    nestedSelected && !isAllCategory(nestedSelected)
      ? nestedSelected.name
      : selectedCategory && !isAllCategory(selectedCategory)
        ? selectedCategory.name
        : group?.name || 'Places';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Ionicons name="chevron-back" size={22} color={colors.heading} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>
          {group?.name || 'Category'}
        </Text>
        {group ? (
          <MerchantFilterTrigger
            filters={filters}
            onOpen={() => setFilterOpen(true)}
            onClear={() => setFilters(DEFAULT_FILTERS)}
          />
        ) : null}
      </View>

      {loadingGroup || !group ? (
        <View style={styles.boot}>
          <ActivityIndicator color={colors.ink} />
        </View>
      ) : (
        <View style={styles.split}>
          {showNav ? (
            <View style={styles.navWrap}>
              <ScrollView
                style={styles.navScroll}
                contentContainerStyle={styles.navRail}
                showsVerticalScrollIndicator={false}
              >
                {categoryTabs.map((cat) => {
                  const selected = selectedCategory?.id === cat.id;
                  const showSymbol =
                    !isAllCategory(cat) && Boolean(cat.icon?.trim());
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => {
                        setCategoryId(cat.id);
                        setNestedId(null);
                      }}
                      style={[styles.navItem, selected && styles.navItemOn]}
                    >
                      {showSymbol ? (
                        <CategorySymbol
                          category={cat}
                          size={14}
                          color={
                            selected ? colors.heading : colors.textMuted
                          }
                        />
                      ) : null}
                      <Text
                        style={[styles.navText, selected && styles.navTextOn]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          <View style={styles.main}>
            {nestedTabs.length > 0 ? (
              <View style={styles.subWrap}>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  style={styles.subScroll}
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.subRail}
                >
                  {nestedTabs.map((cat) => {
                    const selected = nestedSelected?.id === cat.id;
                    const showSymbol =
                      !isAllCategory(cat) && Boolean(cat.icon?.trim());
                    return (
                      <Pressable
                        key={cat.id}
                        onPress={() => setNestedId(cat.id)}
                        style={[styles.subChip, selected && styles.subChipOn]}
                      >
                        {showSymbol ? (
                          <CategorySymbol
                            category={cat}
                            size={14}
                            color={
                              selected ? colors.onDark : colors.textMuted
                            }
                          />
                        ) : null}
                        <Text
                          style={[
                            styles.subChipText,
                            selected && styles.subChipTextOn,
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <Text style={styles.listEyebrow} numberOfLines={1}>
              {heading}
            </Text>

            {loadingList ? (
              <View style={styles.boot}>
                <ActivityIndicator color={colors.ink} />
              </View>
            ) : (
              <FlatList
                style={styles.listFlex}
                data={visibleMerchants}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.list, { paddingBottom: listPad }]}
                showsVerticalScrollIndicator={false}
                onEndReachedThreshold={0.4}
                onEndReached={() => {
                  if (hasMore && !loadingMore) void loadPage(page + 1, false);
                }}
                ItemSeparatorComponent={() => <View style={styles.sep} />}
                ListEmptyComponent={
                  <Text style={styles.empty}>
                    {filtersIdle
                      ? 'No places here yet.'
                      : 'No places match these filters'}
                  </Text>
                }
                ListFooterComponent={
                  loadingMore ? (
                    <ActivityIndicator
                      color={colors.ink}
                      style={styles.more}
                    />
                  ) : null
                }
                renderItem={({ item }) => (
                  <CategoryMerchantRow
                    merchant={item}
                    distanceLabel={formatDistanceFromUser(
                      location.coords,
                      item.latitude,
                      item.longitude,
                    )}
                    onPress={() => openMerchant(item)}
                  />
                )}
              />
            )}
          </View>
        </View>
      )}
      <MerchantFilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onChange={setFilters}
        matchCount={filterMatchCount}
        placeName={heading}
        hasLocation={Boolean(location.coords)}
      />
    </SafeAreaView>
  );
}

const useStyles = createThemedStyles((colors) => ({
  safe: {
    flex: 1,
    backgroundColor: colors.canvas,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    minWidth: 0,
    fontFamily: fonts.extraBold,
    fontSize: 18,
    letterSpacing: -0.3,
    color: colors.heading,
  },
  split: {
    flex: 1,
    flexDirection: 'row',
    minWidth: 0,
  },
  navWrap: {
    width: NAV_W,
    maxWidth: NAV_W,
    minWidth: NAV_W,
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: NAV_W,
    backgroundColor: colors.canvas,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    paddingRight: 10,
  },
  navScroll: {
    flex: 1,
  },
  navRail: {
    paddingTop: 6,
    paddingBottom: 20,
    paddingLeft: 8,
    paddingRight: 2,
    gap: 4,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingVertical: 9,
    paddingLeft: 8,
    paddingRight: 10,
    borderRadius: 10,
    borderLeftWidth: 2,
    borderLeftColor: 'transparent',
  },
  navItemOn: {
    backgroundColor: colors.surfaceSoft,
    borderLeftColor: colors.heading,
  },
  navText: {
    flex: 1,
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.textMuted,
  },
  navTextOn: {
    fontFamily: fonts.semiBold,
    color: colors.heading,
  },
  main: {
    flex: 1,
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
    backgroundColor: colors.canvas,
  },
  subWrap: {
    flexGrow: 0,
    flexShrink: 0,
    minHeight: 44,
  },
  subScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
  subRail: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 6,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: colors.surfaceSoft,
  },
  subChipOn: {
    backgroundColor: colors.heading,
  },
  subChipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
  subChipTextOn: {
    fontFamily: fonts.semiBold,
    color: colors.onDark,
  },
  listEyebrow: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.heading,
  },
  listFlex: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 12,
  },
  sep: {
    height: 8,
  },
  boot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    paddingVertical: 36,
    textAlign: 'center',
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.textMuted,
  },
  more: {
    marginVertical: 16,
  },
  pressed: { opacity: 0.72 },
}));

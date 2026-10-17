import { Href, useLocalSearchParams, useRouter, useScrollToTop } from 'expo-router';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CategoryMerchantRow } from '../../components/CategoryMerchantRow';
import { categories as fallbackCategories } from '../../constants/categories';
import { fonts } from '../../constants/typography';
import { useAuth } from '../../context/AuthContext';
import { useLoginPrompt } from '../../context/LoginPromptContext';
import { useAppLocation } from '../../context/LocationContext';
import { useTheme } from '../../context/ThemeContext';
import { useTabScrollPadding } from '../../hooks/useAppSafeArea';
import { createThemedStyles } from '../../hooks/useThemedStyles';
import {
  fetchAllCategories,
  fetchBusinessesByCategory,
  fetchSubCategories,
  peekAllCategories,
  peekBusinessesByCategory,
  searchDirectory,
  type HomeCategory,
  type SubCategory,
} from '../../lib/api';
import { getBusinessOpenStatus } from '../../lib/businessHours';
import { compareText } from '../../lib/compareText';
import { formatDistanceFromUser, sortByUserLocation } from '../../lib/geo';
import type { Merchant } from '../../lib/merchants';
import { resolveMerchantSlug } from '../../lib/merchants';
import { TabSwipeHost } from '../../lib/tabSwipe';

const EXPLORE_PAD = 12;
const EXPLORE_GAP = 8;
const RAIL_W = 66;

function exploreColumnCount(innerWidth: number) {
  if (innerWidth >= 820) return 6;
  if (innerWidth >= 640) return 5;
  if (innerWidth >= 340) return 4;
  return 3;
}

function tileWidth(innerWidth: number, cols: number, gap: number) {
  if (innerWidth <= 0 || cols <= 0) return 0;
  return Math.floor((innerWidth - gap * (cols - 1)) / cols);
}
type ViewMode = 'explore' | 'merchants' | 'search';
type FilterKey = 'open' | 'rated' | 'nearest' | 'verified';
type SortOrder = 'best' | 'asc' | 'desc';

const FALLBACK_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  doctors: 'medkit-outline',
  restaurants: 'restaurant-outline',
  hotels: 'bed-outline',
  'beauty-spa': 'cut-outline',
  gym: 'barbell-outline',
  'repairs-services': 'construct-outline',
  electronics: 'tv-outline',
  automobile: 'car-outline',
  lawyers: 'document-text-outline',
  tutors: 'school-outline',
  photography: 'camera-outline',
  plumbers: 'water-outline',
  electricians: 'flash-outline',
  'pet-care': 'paw-outline',
  college: 'library-outline',
};

function CategoryGlyph({
  category,
  size = 26,
  color,
}: {
  category: Pick<HomeCategory, 'icon' | 'slug'>;
  size?: number;
  color?: string;
}) {
  const { colors } = useTheme();
  if (category.icon) {
    return (
      <Image
        source={{ uri: category.icon }}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    );
  }
  const name = FALLBACK_ICON[category.slug] || 'grid-outline';
  return <Ionicons name={name} size={size} color={color ?? colors.textMuted} />;
}

export default function CategoriesScreen() {
  const { colors } = useTheme();
  const styles = useStyles();
  const router = useRouter();
  const { width: windowWidth } = useWindowDimensions();
  const [gridWidth, setGridWidth] = useState(0);
  const gridInner = gridWidth > 0 ? gridWidth : Math.max(0, windowWidth - EXPLORE_PAD * 2);
  const exploreCols = exploreColumnCount(gridInner);
  const exploreTileW = tileWidth(gridInner, exploreCols, EXPLORE_GAP);
  const exploreGlyph = Math.round(Math.min(56, Math.max(34, exploreTileW * 0.48)));
  const searchCols = gridInner >= 520 ? 4 : 3;
  const searchTileW = tileWidth(gridInner, searchCols, 8);
  const params = useLocalSearchParams<{
    category?: string | string[];
    fresh?: string | string[];
  }>();
  const categoryParam = useMemo(() => {
    const raw = params.category;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value?.trim() || '';
  }, [params.category]);
  const freshParam = useMemo(() => {
    const raw = params.fresh;
    const value = Array.isArray(raw) ? raw[0] : raw;
    return value?.trim() || '';
  }, [params.fresh]);
  const appliedCategoryParam = useRef<string | null>(null);
  const { user } = useAuth();
  const { requestLogin: promptLogin } = useLoginPrompt();
  const location = useAppLocation();
  const listPad = useTabScrollPadding(24);
  const signedIn = Boolean(user);

  const [viewMode, setViewMode] = useState<ViewMode>('explore');
  const [query, setQuery] = useState('');
  const initialCategories = peekAllCategories()?.categories ?? [];
  const [categories, setCategories] = useState<HomeCategory[]>(initialCategories);
  const [categoriesLoading, setCategoriesLoading] = useState(
    initialCategories.length === 0,
  );
  const [selected, setSelected] = useState<HomeCategory | null>(null);
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [activeSubId, setActiveSubId] = useState<string | null>(null);
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [merchantsLoading, setMerchantsLoading] = useState(false);
  const [merchantTotal, setMerchantTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [filters, setFilters] = useState<FilterKey[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>('best');
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchCats, setSearchCats] = useState<HomeCategory[]>([]);
  const [searchMerchants, setSearchMerchants] = useState<Merchant[]>([]);
  const [searchNotice, setSearchNotice] = useState<string | null>(null);
  const [searchExact, setSearchExact] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const listRef = useRef<FlatList>(null);
  const exploreScrollRef = useRef<ScrollView>(null);
  const searchScrollRef = useRef<ScrollView>(null);
  useScrollToTop(listRef);
  useScrollToTop(exploreScrollRef);
  useScrollToTop(searchScrollRef);

  const browseCategories = useMemo(() => {
    return [...categories].sort((a, b) => compareText(a.name, b.name));
  }, [categories]);

  const railCategories = useMemo(() => {
    if (!selected) return browseCategories;
    return [
      selected,
      ...browseCategories.filter((cat) => cat.id !== selected.id),
    ];
  }, [browseCategories, selected]);

  const activeSub = useMemo(
    () => subs.find((s) => s.id === activeSubId) || subs[0] || null,
    [subs, activeSubId],
  );

  const loadCategories = useCallback(async () => {
    const cached = peekAllCategories();
    if (cached?.categories.length) {
      setCategories(cached.categories);
      setCategoriesLoading(false);
    } else {
      setCategoriesLoading(true);
    }
    const result = await fetchAllCategories();
    if (result.categories.length > 0) {
      setCategories(result.categories);
    } else if (!cached?.categories.length) {
      setCategories(
        fallbackCategories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          icon: '',
          image: '',
          businessCount: 0,
        })),
      );
    }
    setCategoriesLoading(false);
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const loadMerchants = useCallback(
    async (queryName: string, nextPage = 1, append = false) => {
      const cached =
        !append
          ? peekBusinessesByCategory(queryName, { page: nextPage, pageSize: 24 })
          : null;
      if (cached) {
        setMerchants(cached.merchants);
        setMerchantTotal(cached.total);
        setPage(cached.page);
        setHasMore(cached.hasMore);
        setMerchantsLoading(false);
        return;
      }
      setMerchantsLoading(true);
      const result = await fetchBusinessesByCategory(queryName, {
        page: nextPage,
        pageSize: 24,
      });
      setMerchants((prev) =>
        append ? [...prev, ...result.merchants] : result.merchants,
      );
      setMerchantTotal(result.total);
      setPage(result.page);
      setHasMore(result.hasMore);
      setMerchantsLoading(false);
    },
    [],
  );

  const openCategory = useCallback(async (cat: HomeCategory) => {
    setSelected(cat);
    setViewMode('merchants');
    setFilters([]);
    setSortOrder('best');
    const subResult = await fetchSubCategories(cat.id, cat.name);
    setSubs(subResult.subCategories);
    const first = subResult.subCategories[0];
    setActiveSubId(first?.id || null);
    const queryName = first?.queryName || cat.name;
    const cached = peekBusinessesByCategory(queryName, { page: 1, pageSize: 24 });
    if (cached) {
      setMerchants(cached.merchants);
      setMerchantTotal(cached.total);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setMerchantsLoading(false);
      return;
    }
    setMerchants([]);
    setMerchantsLoading(true);
    await loadMerchants(queryName, 1, false);
  }, [loadMerchants]);

  // Deep-link from home "See all" — open the selected category on Explore.
  useEffect(() => {
    if (!categoryParam || categoriesLoading || categories.length === 0) return;
    const applyKey = `${categoryParam}::${freshParam}`;
    if (appliedCategoryParam.current === applyKey) return;

    const needle = categoryParam.toLowerCase();
    const match =
      categories.find((c) => c.slug.toLowerCase() === needle) ||
      categories.find((c) => c.id === categoryParam) ||
      categories.find((c) => c.name.toLowerCase() === needle) ||
      categories.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, '-') === needle,
      );

    if (!match) return;
    appliedCategoryParam.current = applyKey;
    void openCategory(match);
  }, [
    categoryParam,
    freshParam,
    categories,
    categoriesLoading,
    openCategory,
  ]);

  const selectSub = async (sub: SubCategory) => {
    setActiveSubId(sub.id);
    const cached = peekBusinessesByCategory(sub.queryName, {
      page: 1,
      pageSize: 24,
    });
    if (cached) {
      setMerchants(cached.merchants);
      setMerchantTotal(cached.total);
      setPage(cached.page);
      setHasMore(cached.hasMore);
      setMerchantsLoading(false);
    } else {
      setMerchants([]);
    }
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    if (!cached) await loadMerchants(sub.queryName, 1, false);
  };

  const goBack = () => {
    if (viewMode === 'search') {
      setQuery('');
      setViewMode(selected ? 'merchants' : 'explore');
      return;
    }
    if (viewMode === 'merchants') {
      setViewMode('explore');
      setSelected(null);
      setSubs([]);
      setMerchants([]);
      appliedCategoryParam.current = null;
      if (categoryParam) {
        router.replace('/(tabs)/categories' as Href);
      }
      return;
    }
    router.push('/(tabs)/home');
  };

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    const q = query.trim();
    if (!q) {
      setSearchCats([]);
      setSearchMerchants([]);
      setSearchNotice(null);
      setSearchExact(true);
      setSearchLoading(false);
      setViewMode((prev) =>
        prev === 'search' ? (selected ? 'merchants' : 'explore') : prev,
      );
      return;
    }

    setViewMode('search');
    setSearchLoading(true);
    searchTimer.current = setTimeout(async () => {
      const result = await searchDirectory(q, {
        coords: location.coords,
        city: location.city,
      });
      setSearchCats(result.categories.slice(0, 12));
      setSearchMerchants(result.merchants.slice(0, 24));
      setSearchNotice(result.notice);
      setSearchExact(result.exactMatch);
      setSearchLoading(false);
    }, 350);

    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query, selected, location.coords, location.city]);

  const filteredMerchants = useMemo(() => {
    let list = [...merchants];
    if (filters.includes('verified')) list = list.filter((m) => m.isVerified);
    if (filters.includes('rated')) {
      list = list.filter((m) => (m.rating ?? 0) >= 4.5);
    }
    if (filters.includes('open')) {
      list = list.filter((m) => getBusinessOpenStatus(m.timings).status === 'Open');
    }

    if (sortOrder === 'asc' || sortOrder === 'desc') {
      list.sort((a, b) => {
        const cmp = compareText(a.name, b.name);
        return sortOrder === 'asc' ? cmp : -cmp;
      });
      return list;
    }

    // Default + nearest: prefer selected city, then distance from user.
    if (filters.includes('nearest') || location.coords || location.city) {
      list = sortByUserLocation(list, {
        coords: location.coords,
        city: location.city,
      });
      if (!filters.includes('nearest')) {
        // Keep open/rated preference lightly after geo rank.
        list.sort((a, b) => {
          const aOpen = getBusinessOpenStatus(a.timings).status === 'Open' ? 1 : 0;
          const bOpen = getBusinessOpenStatus(b.timings).status === 'Open' ? 1 : 0;
          if (bOpen !== aOpen) return bOpen - aOpen;
          return 0;
        });
      }
      return list;
    }

    list.sort((a, b) => {
      const aOpen = getBusinessOpenStatus(a.timings).status === 'Open' ? 1 : 0;
      const bOpen = getBusinessOpenStatus(b.timings).status === 'Open' ? 1 : 0;
      if (bOpen !== aOpen) return bOpen - aOpen;
      return (b.rating ?? 0) - (a.rating ?? 0);
    });

    return list;
  }, [merchants, filters, sortOrder, location.coords, location.city]);

  const toggleFilter = (key: FilterKey) => {
    setFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  const openMerchant = (merchant: Merchant) => {
    router.push(`/merchant/${resolveMerchantSlug(merchant)}` as Href);
  };

  const requestLogin = () => {
    promptLogin('/(tabs)/categories');
  };

  const merchantHeader = (
    <View>
      <View style={styles.mainHead}>
        <View style={styles.mainHeadText}>
          <Text style={styles.mainTitle} numberOfLines={1}>
            {selected?.name}
            {activeSub && activeSub.name !== 'All' ? ` › ${activeSub.name}` : ''}
          </Text>
          <Text style={styles.mainMeta}>
            {merchantTotal} business{merchantTotal === 1 ? '' : 'es'}
          </Text>
        </View>
        <Pressable onPress={() => setViewMode('explore')} hitSlop={8}>
          <Text style={styles.changeLink}>Change</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipRow}
        style={styles.chipScroll}
      >
        {subs.map((sub) => {
          const active = sub.id === activeSubId;
          return (
            <Pressable
              key={sub.id}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => selectSub(sub)}
            >
              {sub.icon ? (
                <Image
                  source={{ uri: sub.icon }}
                  style={styles.chipIcon}
                  contentFit="contain"
                />
              ) : null}
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {sub.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <TabSwipeHost>
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Ionicons name="chevron-back" size={20} color={colors.ink} />
          </Pressable>

          <View style={styles.searchPill}>
            <Ionicons name="search-outline" size={16} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="Search categories or businesses"
              placeholderTextColor={colors.textSoft}
              autoCorrect={false}
              returnKeyType="search"
            />
            {query ? (
              <Pressable onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={16} color={colors.textSoft} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            style={[styles.filterBtn, viewMode !== 'merchants' && styles.filterBtnHidden]}
            onPress={() => viewMode === 'merchants' && setFilterOpen(true)}
            disabled={viewMode !== 'merchants'}
          >
            <Ionicons name="options-outline" size={18} color={colors.ink} />
            {filters.length > 0 && viewMode === 'merchants' ? (
              <View style={styles.filterDot} />
            ) : null}
          </Pressable>
        </View>

        <View style={styles.body}>
          {viewMode === 'explore' ? (
            <ScrollView
              ref={exploreScrollRef}
              style={styles.flex}
              contentContainerStyle={[
                styles.explorePad,
                { paddingBottom: listPad + 12 },
                browseCategories.length === 0 && styles.explorePadEmpty,
              ]}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              <View style={styles.exploreHead}>
                <Text style={styles.exploreTitle}>Explore</Text>
                <Text style={styles.exploreSub}>
                  {categoriesLoading
                    ? 'Loading categories…'
                    : `${browseCategories.length} categories, A–Z`}
                </Text>
              </View>
              {categoriesLoading && browseCategories.length === 0 ? (
                <View style={styles.centerBox}>
                  <ActivityIndicator color={colors.brand} />
                </View>
              ) : browseCategories.length === 0 ? (
                <Text style={styles.emptyText}>No categories found</Text>
              ) : (
                <>
                  <View
                    style={styles.exploreGrid}
                    onLayout={(e) => {
                      const next = Math.round(e.nativeEvent.layout.width);
                      if (next > 0 && next !== gridWidth) setGridWidth(next);
                    }}
                  >
                    {browseCategories.map((item) => (
                      <Pressable
                        key={item.id}
                        style={({ pressed }) => [
                          styles.tile,
                          {
                            width: exploreTileW,
                            minHeight: Math.max(104, exploreGlyph + 52),
                          },
                          pressed && styles.pressed,
                        ]}
                        onPress={() => openCategory(item)}
                      >
                        <View
                          style={[
                            styles.tileGlyph,
                            { width: exploreGlyph, height: exploreGlyph },
                          ]}
                        >
                          <CategoryGlyph category={item} size={exploreGlyph} />
                        </View>
                        <Text
                          style={[
                            styles.tileName,
                            { fontSize: exploreTileW < 78 ? 9 : 10 },
                          ]}
                          numberOfLines={2}
                        >
                          {item.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.exploreFoot}>
                    All {browseCategories.length} categories
                  </Text>
                </>
              )}
            </ScrollView>
          ) : null}

          {viewMode === 'merchants' && selected ? (
            <View style={styles.browseShell}>
              <FlatList
                style={styles.rail}
                data={railCategories}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: listPad, paddingTop: 4 }}
                renderItem={({ item: cat }) => {
                  const active = cat.id === selected.id;
                  return (
                    <Pressable
                      style={[styles.railItem, active && styles.railItemActive]}
                      onPress={() => openCategory(cat)}
                    >
                      {active ? <View style={styles.railBar} /> : null}
                      <View style={[styles.railIcon, active && styles.railIconActive]}>
                        <CategoryGlyph category={cat} size={18} />
                      </View>
                      <Text
                        style={[styles.railLabel, active && styles.railLabelActive]}
                        numberOfLines={2}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                }}
              />

              <FlatList
                ref={listRef}
                style={styles.mainPane}
                data={filteredMerchants}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={merchantHeader}
                contentContainerStyle={[styles.merchantList, { paddingBottom: listPad }]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  merchantsLoading ? (
                    <View style={styles.centerBox}>
                      <ActivityIndicator color={colors.brand} />
                      <Text style={styles.emptyText}>Loading businesses…</Text>
                    </View>
                  ) : (
                    <View style={styles.centerBox}>
                      <Text style={styles.emptyText}>No businesses in this category yet</Text>
                    </View>
                  )
                }
                renderItem={({ item }) => (
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
                )}
                ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
                ListFooterComponent={
                  hasMore && !merchantsLoading ? (
                    <Pressable
                      style={styles.loadMore}
                      onPress={() =>
                        activeSub && loadMerchants(activeSub.queryName, page + 1, true)
                      }
                    >
                      <Text style={styles.loadMoreText}>Load more</Text>
                    </Pressable>
                  ) : merchantsLoading && merchants.length > 0 ? (
                    <ActivityIndicator style={{ marginVertical: 16 }} color={colors.brand} />
                  ) : (
                    <View style={{ height: 8 }} />
                  )
                }
              />
            </View>
          ) : null}

          {viewMode === 'search' ? (
            <ScrollView
              ref={searchScrollRef}
              style={styles.flex}
              contentContainerStyle={[styles.searchPad, { paddingBottom: listPad }]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.searchTitle}>Results for “{query.trim()}”</Text>
              {searchNotice ? (
                <View style={styles.searchNotice}>
                  <Text style={styles.searchNoticeTitle}>Exact match not found</Text>
                  <Text style={styles.searchNoticeText}>{searchNotice}</Text>
                </View>
              ) : null}
              {searchLoading ? (
                <ActivityIndicator style={{ marginTop: 24 }} color={colors.brand} />
              ) : (
                <>
                  {searchCats.length > 0 ? (
                    <>
                      <Text style={styles.sectionLabel}>
                        {searchExact ? 'Categories' : 'Relevant categories'}
                      </Text>
                      <View
                        style={styles.searchCatGrid}
                        onLayout={(e) => {
                          const next = Math.round(e.nativeEvent.layout.width);
                          if (next > 0 && next !== gridWidth) setGridWidth(next);
                        }}
                      >
                        {searchCats.map((cat) => (
                          <Pressable
                            key={cat.id}
                            style={[styles.searchCatTile, { width: searchTileW }]}
                            onPress={() => {
                              setQuery('');
                              openCategory(cat);
                            }}
                          >
                            <View
                              style={[
                                styles.tileGlyph,
                                { width: exploreGlyph, height: exploreGlyph },
                              ]}
                            >
                              <CategoryGlyph category={cat} size={Math.min(48, exploreGlyph)} />
                            </View>
                            <Text style={styles.searchCatName} numberOfLines={2}>
                              {cat.name}
                            </Text>
                          </Pressable>
                        ))}
                      </View>
                    </>
                  ) : null}

                  <Text style={[styles.sectionLabel, { marginTop: 18 }]}>
                    {searchExact ? 'Businesses' : 'Relevant businesses'}
                  </Text>
                  {searchMerchants.length === 0 ? (
                    <Text style={styles.emptyText}>No matching businesses</Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {searchMerchants.map((m) => (
                        <CategoryMerchantRow
                          key={m.id}
                          merchant={m}
                          distanceLabel={formatDistanceFromUser(
                            location.coords,
                            m.latitude,
                            m.longitude,
                          )}
                          contactRevealed={signedIn}
                          onRequestLogin={requestLogin}
                          onPress={() => openMerchant(m)}
                        />
                      ))}
                    </View>
                  )}
                </>
              )}
            </ScrollView>
          ) : null}
        </View>
      </SafeAreaView>

      <Modal visible={filterOpen} transparent animationType="slide" onRequestClose={() => setFilterOpen(false)}>
        <Pressable style={styles.sheetBackdrop} onPress={() => setFilterOpen(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <View style={styles.sheetChips}>
            {(
              [
                ['open', 'Open now'],
                ['rated', 'Top rated'],
                ['nearest', 'Nearest'],
                ['verified', 'FinderB verified'],
              ] as const
            ).map(([key, label]) => {
              const on = filters.includes(key);
              return (
                <Pressable
                  key={key}
                  style={[styles.sheetChip, on && styles.sheetChipOn]}
                  onPress={() => toggleFilter(key)}
                >
                  <Text style={[styles.sheetChipText, on && styles.sheetChipTextOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={[styles.sheetTitle, { marginTop: 18 }]}>Sort</Text>
          <View style={styles.sheetChips}>
            {(
              [
                ['best', 'Best match'],
                ['asc', 'A → Z'],
                ['desc', 'Z → A'],
              ] as const
            ).map(([key, label]) => {
              const on = sortOrder === key;
              return (
                <Pressable
                  key={key}
                  style={[styles.sheetChip, on && styles.sheetChipOn]}
                  onPress={() => setSortOrder(key)}
                >
                  <Text style={[styles.sheetChipText, on && styles.sheetChipTextOn]}>{label}</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.sheetActions}>
            <Pressable
              style={styles.clearBtn}
              onPress={() => {
                setFilters([]);
                setSortOrder('best');
              }}
            >
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <Pressable style={styles.doneBtn} onPress={() => setFilterOpen(false)}>
              <Text style={styles.doneText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
    </TabSwipeHost>
  );
}

const useStyles = createThemedStyles((colors) => ({
  root: { flex: 1, backgroundColor: colors.canvasDeep },
  safe: { flex: 1, paddingTop: 8 },
  flex: { flex: 1 },
  body: { flex: 1, minHeight: 0 },
  pressed: { opacity: 0.92 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.canvasDeep,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchPill: {
    flex: 1,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: colors.canvasDeep,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 8,
  },
  filterBtn: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtnHidden: { opacity: 0 },
  filterDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.brand,
  },

  explorePad: {
    paddingHorizontal: EXPLORE_PAD,
  },
  explorePadEmpty: {
    flexGrow: 1,
  },
  exploreGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: EXPLORE_GAP,
  },
  exploreFoot: {
    marginTop: 16,
    marginBottom: 8,
    fontFamily: fonts.medium,
    fontSize: 12,
    textAlign: 'center',
    color: colors.textSoft,
  },
  exploreHead: {
    marginBottom: 14,
    marginTop: 6,
    width: '100%',
  },
  exploreTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 23,
    letterSpacing: -0.4,
    color: colors.ink,
  },
  exploreSub: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  tileRow: {
    gap: EXPLORE_GAP,
    marginBottom: EXPLORE_GAP,
  },
  tile: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  tileGlyph: {
    width: 56,
    height: 56,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileName: {
    fontFamily: fonts.medium,
    fontSize: 10,
    lineHeight: 13,
    letterSpacing: -0.1,
    color: colors.textMuted,
    textAlign: 'center',
    minHeight: 26,
  },

  browseShell: {
    flex: 1,
    flexDirection: 'row',
    minHeight: 0,
  },
  rail: {
    width: RAIL_W,
    flexGrow: 0,
    flexShrink: 0,
    backgroundColor: colors.muted,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  railItem: {
    width: RAIL_W,
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 3,
    gap: 5,
  },
  railItemActive: {
    backgroundColor: colors.tealSoft,
  },
  railBar: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.teal,
  },
  railIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railIconActive: {
    backgroundColor: colors.surface,
  },
  railLabel: {
    fontFamily: fonts.medium,
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
    color: colors.textSoft,
    width: RAIL_W - 6,
  },
  railLabelActive: {
    color: colors.teal,
    fontFamily: fonts.semiBold,
  },

  mainPane: {
    flex: 1,
    minWidth: 0,
    minHeight: 0,
    backgroundColor: colors.canvasDeep,
  },
  mainHead: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.canvasDeep,
  },
  mainHeadText: { flex: 1, minWidth: 0 },
  mainTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 14,
    color: colors.ink,
  },
  mainMeta: {
    marginTop: 2,
    fontFamily: fonts.regular,
    fontSize: 11,
    color: colors.textMuted,
  },
  changeLink: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.brand,
    marginTop: 2,
  },
  chipScroll: {
    maxHeight: 48,
    marginBottom: 8,
  },
  chipRow: {
    paddingHorizontal: 10,
    gap: 8,
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  chipIcon: { width: 16, height: 16 },
  chipText: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.ink,
  },
  chipTextActive: {
    color: colors.onDark,
  },
  merchantList: {
    paddingHorizontal: 8,
    paddingTop: 0,
    flexGrow: 1,
  },
  loadMore: {
    marginTop: 12,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  loadMoreText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.brand,
  },

  searchPad: { paddingHorizontal: 12, paddingTop: 8, flexGrow: 1 },
  searchTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 14,
  },
  searchNotice: {
    marginTop: -6,
    marginBottom: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchNoticeTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 13,
    color: colors.heading,
    marginBottom: 3,
  },
  searchNoticeText: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 17,
    color: colors.textMuted,
  },
  sectionLabel: {
    fontFamily: fonts.medium,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 10,
  },
  searchCatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  searchCatTile: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
    gap: 8,
    minHeight: 96,
  },
  searchCatName: {
    fontFamily: fonts.medium,
    fontSize: 11,
    textAlign: 'center',
    color: colors.ink,
  },

  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 28,
  },
  sheetTitle: {
    fontFamily: fonts.semiBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 10,
  },
  sheetChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sheetChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: colors.canvasDeep,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sheetChipOn: {
    backgroundColor: colors.tealSoft,
    borderColor: colors.teal,
  },
  sheetChipText: {
    fontFamily: fonts.medium,
    fontSize: 13,
    color: colors.ink,
  },
  sheetChipTextOn: {
    color: colors.teal,
    fontFamily: fonts.semiBold,
  },
  sheetActions: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    paddingVertical: 13,
  },
  clearText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.textMuted,
  },
  doneBtn: {
    flex: 1,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: 'center',
    paddingVertical: 13,
  },
  doneText: {
    fontFamily: fonts.medium,
    fontSize: 14,
    color: colors.onDark,
  },
}));

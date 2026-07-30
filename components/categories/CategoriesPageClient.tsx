'use client';

import { useState, useEffect, useLayoutEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronRight, LayoutGrid, MapPin, Phone, Loader2 } from 'lucide-react';
import {
  getCategories,
  getSubCategories,
  searchCategoriesByQuery,
  type CategorySearchHit,
} from '@/app/actions/category';
import { getFeaturedBusinesses } from '@/app/actions/business';
import { getSession } from '@/app/actions/user';
import CategoryIcon from '@/components/CategoryIcon';
import {
  businessMatchesNaturalSearch,
  parseNaturalSearchQuery,
  partitionBySearchRelevance,
  sortBySearchRelevance,
  textMatchesSearch,
} from '@/lib/searchMatch';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import { recordSearchAnalytics } from '@/lib/searchAnalytics';
import Image from 'next/image';
import CategoryMerchantList from '@/components/category/CategoryMerchantList';
import CategoryListingsLoading from '@/components/category/CategoryListingsLoading';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { categoryBrowseHref, slugifyCategoryName, subMatchesQueryParam } from '@/lib/categoryDisplay';
import { formatLocalityCityLabel } from '@/lib/businessAddress';
import { getBusinessListingImage } from '@/lib/businessMapping';
import { formatDistanceFromUser } from '@/lib/geo';
import { useUserCoords } from '@/hooks/useUserCoords';
import MerchantListingRating from '@/components/business/MerchantListingRating';
import { VerifiedBusinessName } from '@/components/business/VerifiedMark';

const RESERVED_CATEGORY_SEGMENTS = new Set(['job', 'admissions']);

function categorySlugFromPath(pathname: string | null): string | null {
  if (!pathname) return null;
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] !== 'categories' || parts.length !== 2) return null;
  const slug = parts[1];
  if (!slug || RESERVED_CATEGORY_SEGMENTS.has(slug)) return null;
  return slug;
}

function categoryMatchesSlug(cat: { slug?: string | null; name?: string }, slug: string) {
  if (cat.slug && cat.slug === slug) return true;
  if (cat.name && slugifyCategoryName(cat.name) === slug) return true;
  return false;
}

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  businessCount?: number;
  /** Prefer for Business.category match (All tab = parent display name). */
  queryName?: string;
}

function allSubCategoryFor(cat: {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  icon?: string | null;
  businessCount?: number;
}): SubCategory {
  return {
    id: `all:${cat.id}`,
    name: 'All',
    // Keep parent slug for URLs; listings must query by display name (see queryName).
    slug: cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-'),
    image: cat.image ?? null,
    icon: cat.icon ?? null,
    businessCount: cat.businessCount,
    queryName: cat.name,
  };
}

function isAllSubCategory(sub: SubCategory | null | undefined) {
  return Boolean(sub?.id?.startsWith('all:'));
}

function sortSubCategoriesByMerchants(subs: SubCategory[]) {
  return [...subs].sort((a, b) => {
    const countDiff = (b.businessCount ?? 0) - (a.businessCount ?? 0);
    if (countDiff !== 0) return countDiff;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function subcategoryLabel(category?: string) {
  if (!category?.trim()) return null;
  const parts = category.split('›').map((part) => part.trim()).filter(Boolean);
  if (parts.length < 2) return parts[0] || null;
  return parts[parts.length - 1] || null;
}

export default function CategoriesPage({
  initialCategorySlug = null,
  initialSubSlug = null,
}: {
  initialCategorySlug?: string | null;
  initialSubSlug?: string | null;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const userCoords = useUserCoords();
  const slugFromPath = categorySlugFromPath(pathname) ?? initialCategorySlug;
  const categoryIdFromUrl = searchParams.get('id');
  const subIdFromUrl = searchParams.get('sub') ?? initialSubSlug;
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') ?? '');

  const [viewMode, setViewMode] = useState<
    'categories' | 'subcategories' | 'merchants' | 'global-search'
  >(
    searchParams.get('search')?.trim()
      ? 'global-search'
      : slugFromPath || searchParams.get('id')
        ? 'merchants'
        : 'categories'
  );

  const [categorySearchHits, setCategorySearchHits] = useState<CategorySearchHit[]>([]);
  const [isSearchCategoriesLoading, setIsSearchCategoriesLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [listingStats, setListingStats] = useState<{
    shown: number;
    total: number;
    loading: boolean;
  } | null>(null);

  const isGlobalSearch = viewMode === 'global-search';
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchGenerationRef = useRef(0);
  const lastExecutedSearchRef = useRef('');
  const mainScrollRef = useRef<HTMLElement>(null);
  const asideScrollRef = useRef<HTMLElement>(null);
  const subCategoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollSubsRight, setCanScrollSubsRight] = useState(false);
  /** Prevents stale URL from overwriting a subcategory the user just tapped. */
  const pendingSubIdRef = useRef<string | null>(null);

  const urlSearchQ = searchParams.get('search')?.trim() ?? '';

  useEffect(() => {
    let cancelled = false;
    void getSession().then((result) => {
      if (!cancelled) setIsLoggedIn(!!result?.success);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [catResult, bizResult] = await Promise.all([
        getCategories(),
        getFeaturedBusinesses()
      ]);

      if (catResult.success && catResult.categories) {
        setCategories(catResult.categories);
      }
      
      if (bizResult.success && bizResult.businesses) {
        setBusinesses(bizResult.businesses);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const executeSearch = useCallback(
    async (trimmed: string, options?: { syncUrl?: boolean; force?: boolean }) => {
      const { syncUrl = false, force = false } = options ?? {};

      if (!trimmed) {
        searchGenerationRef.current += 1;
        lastExecutedSearchRef.current = '';
        setCategorySearchHits([]);
        setIsSearchCategoriesLoading(false);
        return;
      }

      if (!force && trimmed === lastExecutedSearchRef.current) {
        return;
      }
      lastExecutedSearchRef.current = trimmed;
      recordSearchAnalytics(trimmed);

      setViewMode('global-search');
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setSubCategories([]);

      const generation = ++searchGenerationRef.current;
      setIsSearchCategoriesLoading(true);

      const result = await searchCategoriesByQuery(trimmed);
      if (generation !== searchGenerationRef.current) return;

      setCategorySearchHits(result.success ? result.results : []);
      setIsSearchCategoriesLoading(false);

      if (syncUrl && urlSearchQ !== trimmed) {
        router.replace(`/categories?search=${encodeURIComponent(trimmed)}`, { scroll: false });
      }
    },
    [router, urlSearchQ]
  );

  // FinderB AI / shared links: refetch whenever URL ?search= changes
  useEffect(() => {
    if (urlSearchQ) {
      lastExecutedSearchRef.current = '';
      setSearchQuery(urlSearchQ);
      setViewMode('global-search');
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setSubCategories([]);
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      void executeSearch(urlSearchQ, { force: true });
      return;
    }

    lastExecutedSearchRef.current = '';
    setCategorySearchHits([]);

    if (slugFromPath && categories.length > 0) {
      const category = categories.find((cat) => categoryMatchesSlug(cat, slugFromPath));
      if (category) {
        setSelectedCategory((prev: any) => (prev?.id === category.id ? prev : category));
        setViewMode('merchants');
      }
      return;
    }

    // Legacy `/categories?id=` → canonical `/categories/{slug}`
    if (categoryIdFromUrl && categories.length > 0) {
      const category = categories.find((cat) => cat.id === categoryIdFromUrl);
      if (category) {
        setSelectedCategory((prev: any) => (prev?.id === category.id ? prev : category));
        setViewMode('merchants');
        router.replace(
          categoryBrowseHref(
            category,
            subIdFromUrl && !String(subIdFromUrl).startsWith('all:')
              ? subIdFromUrl
              : undefined
          ),
          { scroll: false }
        );
      }
    }
  }, [urlSearchQ, slugFromPath, categoryIdFromUrl, subIdFromUrl, categories, executeSearch, router]);

  // Typing in the categories search bar (skip when query matches URL — already loaded)
  useEffect(() => {
    if (viewMode !== 'global-search') return;

    const trimmed = searchQuery.trim();
    if (!trimmed) {
      searchGenerationRef.current += 1;
      lastExecutedSearchRef.current = '';
      setCategorySearchHits([]);
      setIsSearchCategoriesLoading(false);
      return;
    }

    if (trimmed === urlSearchQ) return;

    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      void executeSearch(trimmed, { syncUrl: true });
    }, 400);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchQuery, viewMode, urlSearchQ, executeSearch]);

  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (trimmed) setLastSearchQuery(trimmed);
  }, [searchQuery]);

  const businessMatchesSearch = (biz: any, q: string) => {
    if (!q.trim()) return true;
    return businessMatchesNaturalSearch(biz, q);
  };

  const parsedGlobalSearch = parseNaturalSearchQuery(searchQuery);

  const applyGlobalSearch = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      lastExecutedSearchRef.current = '';
      setCategorySearchHits([]);
      setViewMode('categories');
      router.replace('/categories', { scroll: false });
      return;
    }
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    void executeSearch(trimmed, { syncUrl: true, force: true });
  };

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      if (viewMode !== 'global-search') {
        setViewMode('global-search');
        setSelectedCategory(null);
        setSelectedSubCategory(null);
        setSubCategories([]);
      }
    } else if (viewMode === 'global-search') {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      lastExecutedSearchRef.current = '';
      setCategorySearchHits([]);
      setViewMode('categories');
      router.replace('/categories', { scroll: false });
    }
  };

  const openCategorySearchHit = async (hit: CategorySearchHit) => {
    if (hit.parentId) {
      const parent =
        categories.find((c) => c.id === hit.parentId) ??
        ({
          id: hit.parentId,
          name: hit.parentName ?? 'Category',
          icon: null,
          image: null,
          slug: '',
          businessCount: 0,
        } as const);
      setSelectedCategory(parent);
      setViewMode('merchants');
      setSearchQuery('');
      router.replace(categoryBrowseHref(parent, hit), { scroll: false });

      setIsSubLoading(true);
      const result = await getSubCategories(hit.parentId);
      if (result.success && result.subCategories) {
        const kids = sortSubCategoriesByMerchants(result.subCategories as SubCategory[]);
        setSubCategories(kids);
        const sub = kids.find((s) => s.id === hit.id) ?? kids[0];
        setSelectedSubCategory(sub ?? null);
      }
      setIsSubLoading(false);
      return;
    }

    const top = categories.find((c) => c.id === hit.id);
    if (top) {
      handleCategoryClick(top);
      setSearchQuery('');
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchSubs() {
      if (!selectedCategory) return;

      setIsSubLoading(true);
      const result = await getSubCategories(selectedCategory.id);
      if (cancelled) return;

      if (result.success && result.subCategories) {
        const allTab = allSubCategoryFor(selectedCategory);
        const kids = sortSubCategoriesByMerchants(result.subCategories as SubCategory[]);
        const withAll = kids.length > 0 ? [allTab, ...kids] : [allTab];
        setSubCategories(withAll);

        const fromUrl =
          subIdFromUrl && !String(subIdFromUrl).startsWith('all:')
            ? kids.find((s) => subMatchesQueryParam(s, subIdFromUrl))
            : null;

        setSelectedSubCategory(fromUrl ?? allTab);
        setViewMode('merchants');
      }
      setIsSubLoading(false);
    }

    void fetchSubs();
    return () => {
      cancelled = true;
    };
    // Only refetch subcategory chips when the parent category changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subIdFromUrl synced separately
  }, [selectedCategory?.id]);

  // Sync selected subcategory from URL only — never fight an in-progress tap.
  useEffect(() => {
    if (!selectedCategory || subCategories.length === 0) return;

    const pendingId = pendingSubIdRef.current;
    if (pendingId) {
      const pendingIsAll = pendingId.startsWith('all:');
      const pendingSub = subCategories.find((s) => s.id === pendingId);
      const urlMatchesPending = pendingIsAll
        ? !subIdFromUrl || String(subIdFromUrl).startsWith('all:')
        : Boolean(pendingSub && subMatchesQueryParam(pendingSub, subIdFromUrl));
      if (!urlMatchesPending) return;
      pendingSubIdRef.current = null;
    }

    if (subIdFromUrl && !String(subIdFromUrl).startsWith('all:')) {
      const fromUrl = subCategories.find((s) => subMatchesQueryParam(s, subIdFromUrl));
      if (fromUrl) {
        setSelectedSubCategory((prev) => (prev?.id === fromUrl.id ? prev : fromUrl));
      }
      return;
    }

    const allTab =
      subCategories.find((s) => isAllSubCategory(s)) ?? allSubCategoryFor(selectedCategory);
    setSelectedSubCategory((prev) => (prev?.id === allTab.id ? prev : allTab));
  }, [subIdFromUrl, selectedCategory, subCategories]);

  const navigateCategoryBrowse = useCallback(
    (category: { slug?: string | null; name?: string | null }, sub?: SubCategory | null) => {
      const href = categoryBrowseHref(
        category,
        sub && !isAllSubCategory(sub) ? sub : undefined
      );
      router.replace(href, { scroll: false });
    },
    [router]
  );

  const handleCategoryClick = (cat: any) => {
    const allTab = allSubCategoryFor(cat);
    pendingSubIdRef.current = allTab.id;
    setListingStats({ shown: 0, total: 0, loading: true });
    setSelectedCategory(cat);
    setSubCategories([allTab]);
    setSelectedSubCategory(allTab);
    setViewMode('merchants');
    navigateCategoryBrowse(cat);
  };

  useLayoutEffect(() => {
    if (viewMode === 'categories' && !selectedCategory && !isGlobalSearch) return;
    // Keep subcategory chip row stable — only scroll the main listings panel.
    mainScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  }, [viewMode, selectedCategory?.id, selectedSubCategory?.id, isGlobalSearch, selectedCategory]);

  const updateSubCategoryScrollState = useCallback(() => {
    const el = subCategoryScrollRef.current;
    if (!el) {
      setCanScrollSubsRight(false);
      return;
    }
    const maxScroll = el.scrollWidth - el.clientWidth;
    setCanScrollSubsRight(maxScroll > 4 && el.scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = subCategoryScrollRef.current;
    if (!el || subCategories.length === 0) {
      setCanScrollSubsRight(false);
      return;
    }

    updateSubCategoryScrollState();
    el.addEventListener('scroll', updateSubCategoryScrollState, { passive: true });
    window.addEventListener('resize', updateSubCategoryScrollState);

    const ro =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateSubCategoryScrollState) : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener('scroll', updateSubCategoryScrollState);
      window.removeEventListener('resize', updateSubCategoryScrollState);
      ro?.disconnect();
    };
  }, [subCategories, selectedCategory?.id, updateSubCategoryScrollState, viewMode]);

  const scrollSubCategoriesRight = useCallback(() => {
    const el = subCategoryScrollRef.current;
    if (!el) return;
    el.scrollBy({ left: Math.min(160, el.clientWidth * 0.65), behavior: 'smooth' });
  }, []);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'relevance' | 'asc' | 'desc'>('relevance');
  const [filterActive, setFilterActive] = useState(false);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]
    );
  };

  const resetFilters = () => {
    setActiveFilters([]);
    setSortOrder('relevance');
  };

  const relevanceRankedBusinesses = isGlobalSearch
    ? sortBySearchRelevance(
        businesses.filter((biz) => businessMatchesSearch(biz, searchQuery)),
        searchQuery,
        (biz) => ({
          name: biz.name,
          category: biz.category,
          description: biz.description,
        })
      )
    : businesses.filter((biz) => businessMatchesSearch(biz, searchQuery));

  const filteredAndSortedBusinesses = [...relevanceRankedBusinesses]
    .filter(biz => {
      if (activeFilters.includes('Open Now')) {
        // Mock check - in a real app, this would check against business hours
        // Let's assume some are open for mock purposes
        if (parseInt(biz.id) % 2 !== 0) return false; 
      }
      if (activeFilters.includes('Top Rated')) {
        if ((biz.rating || 0) < 4.5) return false;
      }
      if (activeFilters.includes('FinderB verified')) {
        if (!biz.isFinderBVerified) return false;
      }
      // 'Nearest First' is handled by sorting, not filtering
      return true;
    })
    .sort((a, b) => {
      if (isGlobalSearch) {
        return 0;
      }
      if (activeFilters.includes('Nearest First')) {
        return a.id.localeCompare(b.id);
      }

      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      }
      return nameB.localeCompare(nameA);
    });

  const globalSearchCategoryPartitions = useMemo(() => {
    if (!isGlobalSearch) {
      return { best: [] as CategorySearchHit[], related: [] as CategorySearchHit[] };
    }
    return partitionBySearchRelevance(categorySearchHits, searchQuery, (hit) => ({
      name: hit.name,
      slug: hit.slug,
      parentName: hit.parentName,
    }));
  }, [isGlobalSearch, categorySearchHits, searchQuery]);

  const globalSearchBusinessPartitions = useMemo(() => {
    if (!isGlobalSearch) {
      return { best: [] as typeof filteredAndSortedBusinesses, related: [] as typeof filteredAndSortedBusinesses };
    }
    return partitionBySearchRelevance(filteredAndSortedBusinesses, searchQuery, (biz) => ({
      name: biz.name,
      category: biz.category,
      description: biz.description,
    }));
  }, [isGlobalSearch, filteredAndSortedBusinesses, searchQuery]);

  const globalSearchTotalCount = useMemo(() => {
    if (!isGlobalSearch) return 0;
    return (
      globalSearchCategoryPartitions.best.length +
      globalSearchCategoryPartitions.related.length +
      globalSearchBusinessPartitions.best.length +
      globalSearchBusinessPartitions.related.length
    );
  }, [isGlobalSearch, globalSearchCategoryPartitions, globalSearchBusinessPartitions]);

  const renderCategoryHitGrid = (hits: CategorySearchHit[]) => (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
      {hits.map((hit) => (
        <button
          key={hit.id}
          type="button"
          onClick={() => openCategorySearchHit(hit)}
          className="group flex flex-col items-center gap-2 rounded-2xl bg-white/95 p-2.5 text-center shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_22px_-16px_rgba(15,23,42,0.2)] ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:ring-primary/25 sm:p-3"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-50 to-primary/[0.08] ring-1 ring-slate-200/60 transition-transform duration-300 group-hover:scale-[1.04]">
            <CategoryIcon
              icon={hit.icon}
              name={hit.name}
              size={44}
              className="h-9 w-9 text-slate-600 sm:h-10 sm:w-10"
              imageClassName="object-contain"
            />
          </span>
          <span className="line-clamp-2 font-heading text-[11px] font-semibold leading-snug text-slate-800 group-hover:text-primary">
            {hit.name}
          </span>
          {hit.parentName ? (
            <span className="line-clamp-1 text-[10px] text-slate-400">{hit.parentName}</span>
          ) : (
            <span className="text-[10px] text-slate-400">{hit.businessCount}+ listings</span>
          )}
        </button>
      ))}
    </div>
  );

  const renderGlobalBusinessCard = (biz: (typeof businesses)[number]) => {
    const hasPhone = Boolean((biz.publicPhone || biz.contact || '').trim());
    const distanceLabel = formatDistanceFromUser(userCoords, biz.latitude, biz.longitude);
    const placeLabel = formatLocalityCityLabel(biz);
    const subLabel = subcategoryLabel(biz.category);

    return (
    <div
      tabIndex={0}
      onClick={() => {
        if (searchQuery.trim()) setLastSearchQuery(searchQuery);
        router.push(getBusinessProfilePath(biz));
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (searchQuery.trim()) setLastSearchQuery(searchQuery);
          router.push(getBusinessProfilePath(biz));
        }
      }}
      className="group flex w-full cursor-pointer items-start gap-3 rounded-2xl bg-white p-3 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-16px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/70 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_28px_-16px_rgba(33,84,129,0.3)] hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:p-3.5"
    >
      <div className="relative h-[96px] w-[96px] shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:h-[108px] sm:w-[108px]">
        <Image
          src={getBusinessListingImage(biz) || '/fallback.jpg'}
          alt={biz.name}
          fill
          className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          sizes="108px"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
        {subLabel ? (
          <span className="text-[10px] font-semibold uppercase tracking-[0.06em] text-primary/80">
            {subLabel}
          </span>
        ) : null}
        <h3 className="font-heading text-sm font-semibold leading-snug tracking-tight text-slate-900">
          <VerifiedBusinessName
            name={biz.name}
            verified={Boolean(biz.isFinderBVerified || biz.hasVerifiedBadge)}
            tickSize={14}
            className="break-words"
          />
        </h3>
        <MerchantListingRating
          rating={biz.rating}
          reviewCount={biz.reviewsCount}
          defaultRating={5}
          starSize={11}
          textClassName="text-[11px] font-semibold text-slate-600"
          emptyClassName="text-[11px] text-slate-400"
        />
        {placeLabel || distanceLabel ? (
          <p className="flex min-w-0 items-start gap-1 text-[11px] leading-snug text-slate-500">
            <MapPin size={12} className="mt-0.5 shrink-0 text-slate-400" />
            <span className="line-clamp-2">
              {distanceLabel ? (
                <>
                  <span className="font-semibold text-primary">{distanceLabel}</span>
                  {placeLabel ? <span className="text-slate-300"> · </span> : null}
                </>
              ) : null}
              {placeLabel}
            </span>
          </p>
        ) : null}
        {hasPhone ? (
          <p className="flex min-w-0 items-center gap-1 text-[11px] text-slate-500">
            <Phone size={12} className="shrink-0 text-slate-400" />
            {isLoggedIn ? (
              <span className="truncate">{biz.publicPhone || biz.contact}</span>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push('/login');
                }}
                className="font-semibold text-primary underline-offset-2 hover:underline"
              >
                Login to view
              </button>
            )}
          </p>
        ) : null}
      </div>
      <div className="hidden shrink-0 self-center pr-1 sm:flex">
        <ChevronRight size={16} className="text-slate-300 transition-colors group-hover:text-primary" />
      </div>
    </div>
    );
  };

  const exploreCategories = categories.filter(
    (cat) => !searchQuery || textMatchesSearch(cat.name, searchQuery),
  );

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[#f7f7f8] font-sans lg:h-screen">
      {/* Header / Search Bar */}
      <header className="relative z-20 shrink-0 border-b border-slate-200/80 bg-white px-2.5 py-2 sm:px-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (viewMode === 'global-search') {
                if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
                lastExecutedSearchRef.current = '';
                setCategorySearchHits([]);
                setSearchQuery('');
                setViewMode('categories');
                router.replace('/categories', { scroll: false });
              } else if (viewMode === 'merchants' || viewMode === 'subcategories') {
                setViewMode('categories');
                setSelectedCategory(null);
                setSelectedSubCategory(null);
                setSubCategories([]);
                router.replace('/categories', { scroll: false });
              } else {
                router.push('/', { scroll: false });
              }
            }}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-slate-100 active:scale-95"
            aria-label="Go back"
          >
            <ChevronRight className="rotate-180" size={18} />
          </button>
          <div className="group relative flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary"
              size={15}
            />
            <input
              type="text"
              placeholder={
                isGlobalSearch
                  ? 'Search categories and businesses'
                  : 'Search categories, services…'
              }
              className="w-full rounded-full border border-slate-200 bg-[#f7f7f8] py-2 pl-9 pr-3 text-sm font-medium text-slate-900 outline-none transition-colors placeholder:font-normal placeholder:text-slate-400 focus:border-slate-300 focus:bg-white"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyGlobalSearch(searchQuery);
                }
              }}
            />
          </div>
          {viewMode === 'merchants' ? (
            <button
              type="button"
              onClick={() => {
                setFilterActive(!filterActive);
              }}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                filterActive || activeFilters.length > 0
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
              aria-label="Filters"
            >
              <Filter size={14} />
              {activeFilters.length > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary px-0.5 text-[9px] font-bold text-white">
                  {activeFilters.length}
                </span>
              ) : null}
            </button>
          ) : null}
        </div>

        {viewMode === 'merchants' && filterActive ? (
          <div className="mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-800">Filters</h4>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-semibold text-primary"
                >
                  Clear
                </button>
                <button
                  type="button"
                  onClick={() => setFilterActive(false)}
                  className="text-[11px] font-semibold text-slate-500"
                >
                  Done
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {['Open Now', 'Top Rated', 'Nearest First', 'FinderB verified'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => toggleFilter(f)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    activeFilters.includes(f)
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-2.5">
              <span className="text-[11px] font-medium text-slate-500">Sort</span>
              {(
                [
                  { id: 'relevance', label: 'Best' },
                  { id: 'asc', label: 'A → Z' },
                  { id: 'desc', label: 'Z → A' },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSortOrder(option.id)}
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                    sortOrder === option.id
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <div className="relative z-[1] flex min-h-0 flex-1 overflow-hidden">
        {/* Category rail — parents only */}
        {viewMode !== 'categories' && viewMode !== 'global-search' && (
          <aside
            ref={asideScrollRef}
            className="w-[4.15rem] shrink-0 overflow-y-auto border-r border-slate-200/80 bg-[#f0f0f2] scrollbar-hide sm:w-[4.5rem]"
          >
            <nav className="flex flex-col pb-24" aria-label="Categories">
              {[
                ...(selectedCategory ? [selectedCategory] : []),
                ...categories.filter((cat) => cat.id !== selectedCategory?.id),
              ].map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryClick(cat)}
                    className={`relative flex w-full flex-col items-center gap-1 px-1 py-2 text-center transition-colors ${
                      isSelected
                        ? 'bg-white text-slate-900'
                        : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'
                    }`}
                  >
                    {isSelected ? (
                      <span
                        className="absolute inset-y-1.5 left-0 w-[2.5px] rounded-r-full bg-slate-900"
                        aria-hidden
                      />
                    ) : null}
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-full ${
                        isSelected ? 'bg-slate-100' : 'bg-white'
                      }`}
                    >
                      <CategoryIcon
                        icon={cat.icon}
                        name={cat.name}
                        size={20}
                        className={`h-5 w-5 ${isSelected ? 'text-slate-900' : 'text-slate-500'}`}
                        imageClassName="object-contain"
                      />
                    </span>
                    <span
                      className={`line-clamp-2 w-full px-0.5 text-[9px] leading-[1.15] tracking-tight ${
                        isSelected ? 'font-semibold text-slate-900' : 'font-medium text-slate-500'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        {/* Right Panel */}
        <main
          ref={mainScrollRef}
          className="scrollbar-hide h-full min-w-0 flex-1 overflow-y-auto bg-[#f7f7f8] pb-[6.75rem] lg:pb-4"
        >
          {isLoading ? (
            <div className="mx-auto w-full max-w-5xl p-3" aria-busy="true" aria-live="polite">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-medium text-slate-500">
                <Loader2 size={14} className="animate-spin text-primary" />
                Loading categories…
              </div>
              <div className="mb-4">
                <div className="mb-2 h-6 w-28 animate-pulse rounded-lg bg-slate-200/80" />
                <div className="h-3 w-48 animate-pulse rounded-lg bg-slate-200/60" />
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:grid-cols-5">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div
                    key={i}
                    className="flex animate-pulse flex-col items-center gap-2 rounded-xl bg-white p-3 ring-1 ring-slate-200/70"
                  >
                    <div className="h-11 w-11 rounded-xl bg-slate-100" />
                    <div className="h-2.5 w-14 rounded-full bg-slate-100" />
                  </div>
                ))}
              </div>
            </div>
          ) : viewMode === 'categories' ? (
            <div className="relative mx-auto w-full max-w-6xl px-3 pb-6 pt-3 sm:px-4 sm:pt-4">
              <div className="mb-3.5">
                <h1 className="font-categories text-[1.45rem] font-semibold tracking-tight text-slate-900">
                  Explore
                </h1>
                <p className="mt-0.5 font-categories text-[12px] font-normal leading-snug text-slate-500">
                  Pick a category to see listings instantly.
                </p>
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-2.5 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7">
                {exploreCategories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="group flex flex-col items-center gap-1.5 rounded-xl bg-white p-2 text-center ring-1 ring-slate-200/80 transition-colors active:bg-slate-50 sm:gap-2 sm:p-2.5"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f7f7f8] sm:h-12 sm:w-12">
                      <CategoryIcon
                        icon={cat.icon}
                        name={cat.name}
                        size={26}
                        className="h-[26px] w-[26px] text-slate-700 sm:h-8 sm:w-8"
                        imageClassName="object-contain"
                      />
                    </span>
                    <div className="flex w-full flex-col items-center gap-0.5">
                      <span className="line-clamp-2 w-full font-categories text-[10px] font-medium leading-snug tracking-[-0.01em] text-slate-600 sm:text-[12px]">
                        {cat.name}
                      </span>
                      <span className="font-categories text-[8px] font-normal text-slate-400 sm:text-[9px]">
                        {(cat.businessCount || 0) > 0 ? `${cat.businessCount}` : 'Browse'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : viewMode === 'global-search' ? (
            <div className="w-full space-y-3 p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-3 px-0.5 py-1">
                <p className="text-[13px] text-slate-500">
                  {isSearchCategoriesLoading ? (
                    'Searching…'
                  ) : globalSearchTotalCount > 0 ? (
                    <>
                      <span className="font-semibold text-slate-900">{globalSearchTotalCount}</span>{' '}
                      result{globalSearchTotalCount !== 1 ? 's' : ''}
                      {parsedGlobalSearch.locationHint ? (
                        <>
                          {' '}
                          in{' '}
                          <span className="capitalize font-medium text-slate-700">
                            {parsedGlobalSearch.locationHint}
                          </span>
                        </>
                      ) : null}
                    </>
                  ) : (
                    'No results'
                  )}
                </p>
              </div>

              <section className="space-y-2">
                <h2 className="text-[12px] font-semibold text-slate-800">Categories</h2>
                {isSearchCategoriesLoading ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-24 animate-pulse rounded-xl border border-slate-100 bg-white"
                      />
                    ))}
                  </div>
                ) : globalSearchCategoryPartitions.best.length > 0 ||
                  globalSearchCategoryPartitions.related.length > 0 ? (
                  <div className="space-y-4">
                    {globalSearchCategoryPartitions.best.length > 0
                      ? renderCategoryHitGrid(globalSearchCategoryPartitions.best)
                      : null}
                    {globalSearchCategoryPartitions.related.length > 0 ? (
                      <div className="space-y-2.5 border-t border-slate-200/80 pt-3">
                        <h3 className="text-xs font-medium text-slate-500">Related categories</h3>
                        {renderCategoryHitGrid(globalSearchCategoryPartitions.related)}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-slate-400">
                    No matching categories.
                  </p>
                )}
              </section>

              <section className="space-y-2">
                <h2 className="text-[12px] font-semibold text-slate-800">Businesses</h2>
                {globalSearchBusinessPartitions.best.length > 0 ||
                globalSearchBusinessPartitions.related.length > 0 ? (
                  <div className="space-y-4">
                    {globalSearchBusinessPartitions.best.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                        {globalSearchBusinessPartitions.best.map((biz) => (
                          <div key={biz.id}>{renderGlobalBusinessCard(biz)}</div>
                        ))}
                      </div>
                    ) : null}
                    {globalSearchBusinessPartitions.related.length > 0 ? (
                      <div className="space-y-2.5 border-t border-slate-200/80 pt-3">
                        <h3 className="text-xs font-medium text-slate-500">Related businesses</h3>
                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                          {globalSearchBusinessPartitions.related.map((biz) => (
                            <div key={biz.id}>{renderGlobalBusinessCard(biz)}</div>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <p className="py-3 text-sm text-slate-400">No matching businesses.</p>
                )}
              </section>

              {!isSearchCategoriesLoading &&
                globalSearchCategoryPartitions.best.length === 0 &&
                globalSearchCategoryPartitions.related.length === 0 &&
                globalSearchBusinessPartitions.best.length === 0 &&
                globalSearchBusinessPartitions.related.length === 0 && (
                  <div className="flex flex-col items-center py-16 text-slate-400">
                    <LayoutGrid size={36} className="mb-3 opacity-40" />
                    <p className="text-sm font-medium text-slate-500">Nothing matched your search</p>
                    <p className="mt-1 text-xs text-slate-400">Try a different spelling or keyword</p>
                  </div>
                )}
            </div>
          ) : (
            <div className="flex w-full flex-col">
              <div className="sticky top-0 z-[2] shrink-0 border-b border-slate-200/80 bg-white">
                <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 sm:px-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-heading text-[15px] font-semibold tracking-tight text-slate-900">
                      {selectedCategory?.name}
                      <span className="text-[11px] font-normal text-slate-400">
                        {' '}
                        ›{' '}
                        {isAllSubCategory(selectedSubCategory)
                          ? 'All'
                          : selectedSubCategory?.name || 'All'}
                      </span>
                      {listingStats && !listingStats.loading ? (
                        <span className="ml-1.5 text-[12px] font-medium text-slate-400">
                          ({listingStats.total} Businesses)
                        </span>
                      ) : null}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setViewMode('categories');
                      setSelectedCategory(null);
                      setSelectedSubCategory(null);
                      setSubCategories([]);
                      router.replace('/categories', { scroll: false });
                    }}
                    className="shrink-0 text-[11px] font-semibold text-primary"
                  >
                    Change
                  </button>
                </div>

                {subCategories.length > 0 ? (
                  <div className="relative">
                    <div
                      ref={subCategoryScrollRef}
                      className="scrollbar-hide flex gap-2 overflow-x-auto px-2.5 pb-1.5 pt-0.5 sm:px-3"
                    >
                      {subCategories.map((sub) => {
                        const isSubSelected = selectedSubCategory?.id === sub.id;
                        const isAll = isAllSubCategory(sub);
                        const href = selectedCategory
                          ? categoryBrowseHref(
                              selectedCategory,
                              isAll ? undefined : sub
                            )
                          : '/categories';
                        return (
                          <Link
                            key={sub.id}
                            href={href}
                            replace
                            scroll={false}
                            onClick={() => {
                              if (selectedSubCategory?.id === sub.id) return;
                              pendingSubIdRef.current = sub.id;
                              setListingStats({ shown: 0, total: 0, loading: true });
                              setSelectedSubCategory(sub);
                              setViewMode('merchants');
                            }}
                            className="flex w-[3.35rem] shrink-0 flex-col items-center gap-0.5 text-center"
                            aria-current={isSubSelected ? 'true' : undefined}
                          >
                            <span
                              className={`flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl p-0.5 transition-all duration-200 ${
                                isSubSelected
                                  ? 'bg-primary text-white shadow-sm shadow-primary/20 ring-1 ring-primary/20 ring-offset-1 ring-offset-white'
                                  : 'bg-slate-100 text-slate-500 ring-1 ring-slate-200/80 active:bg-white'
                              }`}
                            >
                              {isAll && sub.icon ? (
                                <CategoryIcon
                                  icon={sub.icon}
                                  name={sub.name}
                                  size={28}
                                  className={`h-7 w-7 ${
                                    isSubSelected ? 'text-white' : 'text-slate-500'
                                  }`}
                                  imageClassName="object-contain"
                                />
                              ) : isAll ? (
                                <svg
                                  viewBox="0 0 24 24"
                                  className="h-[18px] w-[18px]"
                                  fill="none"
                                  aria-hidden
                                >
                                  <circle cx="8" cy="8" r="3.1" fill="currentColor" opacity="0.95" />
                                  <circle cx="16" cy="8" r="3.1" fill="currentColor" opacity="0.7" />
                                  <circle cx="8" cy="16" r="3.1" fill="currentColor" opacity="0.7" />
                                  <circle cx="16" cy="16" r="3.1" fill="currentColor" opacity="0.45" />
                                </svg>
                              ) : (
                                <CategoryIcon
                                  icon={sub.icon}
                                  name={sub.name}
                                  size={28}
                                  className={`h-7 w-7 ${
                                    isSubSelected ? 'text-white' : 'text-slate-500'
                                  }`}
                                  imageClassName="object-contain"
                                />
                              )}
                            </span>
                            <span
                              className={`line-clamp-2 w-full text-[8px] leading-[1.1] tracking-tight ${
                                isSubSelected
                                  ? 'font-semibold text-slate-900'
                                  : 'font-medium text-slate-500'
                              }`}
                            >
                              {sub.name}
                            </span>
                          </Link>
                        );
                      })}
                    </div>

                    {canScrollSubsRight ? (
                      <button
                        type="button"
                        onClick={scrollSubCategoriesRight}
                        className="absolute inset-y-0 right-0 z-[2] flex w-9 items-center justify-end bg-gradient-to-l from-white via-white/95 to-transparent pr-1.5"
                        aria-label="Scroll subcategories"
                      >
                        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200">
                          <ChevronRight size={14} strokeWidth={2.25} />
                        </span>
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2 p-2 sm:p-2.5">
                {isSubLoading ? (
                  <CategoryListingsLoading />
                ) : selectedSubCategory ? (
                  <CategoryMerchantList
                    key={selectedSubCategory.id}
                    categorySlug={
                      selectedSubCategory.queryName ||
                      selectedSubCategory.slug ||
                      selectedSubCategory.name
                    }
                    searchQuery={searchQuery}
                    pageSize={25}
                    activeFilters={activeFilters}
                    sortOrder={sortOrder}
                    onStatsChange={setListingStats}
                    scrollRootRef={mainScrollRef}
                  />
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

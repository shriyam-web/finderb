'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronRight, LayoutGrid, TrendingUp } from 'lucide-react';
import {
  getCategories,
  getSubCategories,
  searchCategoriesByQuery,
  type CategorySearchHit,
} from '@/app/actions/category';
import { getFeaturedBusinesses } from '@/app/actions/business';
import CategoryIcon from '@/components/CategoryIcon';
import {
  businessMatchesNaturalSearch,
  parseNaturalSearchQuery,
  partitionBySearchRelevance,
  sortBySearchRelevance,
  textMatchesSearch,
} from '@/lib/searchMatch';
import { setLastSearchQuery } from '@/lib/lastSearchQuery';
import Image from 'next/image';
import CategoryMerchantList from '@/components/category/CategoryMerchantList';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { categoryHref } from '@/lib/categoryDisplay';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  icon: string | null;
  businessCount?: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const categoryIdFromUrl = searchParams.get('id');
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
  >(searchParams.get('search')?.trim() ? 'global-search' : 'categories');

  const [categorySearchHits, setCategorySearchHits] = useState<CategorySearchHit[]>([]);
  const [isSearchCategoriesLoading, setIsSearchCategoriesLoading] = useState(false);

  const isGlobalSearch = viewMode === 'global-search';
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchGenerationRef = useRef(0);
  const lastExecutedSearchRef = useRef('');

  const urlSearchQ = searchParams.get('search')?.trim() ?? '';

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

    if (categoryIdFromUrl && categories.length > 0) {
      const category = categories.find((cat) => cat.id === categoryIdFromUrl);
      if (category) {
        setSelectedCategory(category);
        setViewMode('subcategories');
      }
    } else if (!categoryIdFromUrl) {
      setViewMode('categories');
    }
  }, [urlSearchQ, categoryIdFromUrl, categories, executeSearch]);

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
      router.replace(
        hit.slug ? categoryHref(hit.slug, hit.name) : `/categories?id=${hit.parentId}`,
        { scroll: false }
      );

      setIsSubLoading(true);
      const result = await getSubCategories(hit.parentId);
      if (result.success && result.subCategories) {
        setSubCategories(result.subCategories);
        const sub =
          result.subCategories.find((s) => s.id === hit.id) ?? result.subCategories[0];
        setSelectedSubCategory(sub ?? null);
      }
      setIsSubLoading(false);
      return;
    }

    const top = categories.find((c) => c.id === hit.id);
    if (top) {
      handleCategoryClick(top);
      setSearchQuery('');
      router.replace(
        hit.slug ? categoryHref(hit.slug, hit.name) : `/categories?id=${hit.id}`,
        { scroll: false }
      );
    }
  };

  useEffect(() => {
    async function fetchSubs() {
      if (selectedCategory) {
        setIsSubLoading(true);
        const result = await getSubCategories(selectedCategory.id);
        if (result.success && result.subCategories) {
          setSubCategories(result.subCategories);
          if (result.subCategories.length > 0) {
            setSelectedSubCategory(result.subCategories[0]);
          } else {
            setSelectedSubCategory(null);
          }
        }
        setIsSubLoading(false);
      }
    }
    fetchSubs();
  }, [selectedCategory]);

  const handleCategoryClick = (cat: any) => {
    setSelectedCategory(cat);
    setViewMode('subcategories');
  };

  const handleSubCategoryClick = (sub: any) => {
    setSelectedSubCategory(sub);
    setViewMode('merchants');
  };

  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [filterActive, setFilterActive] = useState(false);
  const [sortActive, setSortActive] = useState(false);

  const toggleFilter = (filter: string) => {
    setActiveFilters(prev => 
      prev.includes(filter) 
        ? prev.filter(f => f !== filter) 
        : [...prev, filter]
    );
  };

  const resetFilters = () => {
    setActiveFilters([]);
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
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3">
      {hits.map((hit) => (
        <button
          key={hit.id}
          type="button"
          onClick={() => openCategorySearchHit(hit)}
          className="flex flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3.5 text-center transition-colors hover:border-[#215481]/25 hover:bg-slate-50/80 sm:p-4"
        >
          <CategoryIcon
            icon={hit.icon}
            name={hit.name}
            size={48}
            className="h-11 w-11 text-slate-600"
            imageClassName="object-contain"
          />
          <span className="text-[11px] font-medium text-slate-800 line-clamp-2 leading-snug">
            {hit.name}
          </span>
          {hit.parentName ? (
            <span className="text-[10px] text-slate-400 line-clamp-1">{hit.parentName}</span>
          ) : (
            <span className="text-[10px] text-slate-400">{hit.businessCount}+ listings</span>
          )}
        </button>
      ))}
    </div>
  );

  const renderGlobalBusinessCard = (biz: (typeof businesses)[number]) => (
    <button
      type="button"
      onClick={() => {
        if (searchQuery.trim()) setLastSearchQuery(searchQuery);
        router.push(getBusinessProfilePath(biz));
      }}
      className="group flex w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white text-left transition-colors hover:border-[#215481]/25 hover:bg-slate-50/50"
    >
      <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden sm:h-24 sm:w-24">
        <Image
          src={biz.image || biz.profilePictureUrl || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400'}
          alt={biz.name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3.5 py-3 sm:px-4">
        <span className="text-[10px] font-medium text-[#215481]">{biz.category || 'Business'}</span>
        <h3 className="truncate text-sm font-semibold text-slate-900">{biz.name}</h3>
        {biz.location ? (
          <p className="truncate text-xs text-slate-500">{biz.location}</p>
        ) : null}
      </div>
      <div className="hidden shrink-0 items-center pr-4 sm:flex">
        <ChevronRight size={16} className="text-slate-300 transition-colors group-hover:text-[#215481]" />
      </div>
    </button>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#f4f7fb] font-sans">
      {/* Header / Search Bar */}
      <header className="z-10 border-b border-slate-200/80 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => {
              if (viewMode === 'global-search') {
                router.push('/?tab=ai');
              } else if (viewMode === 'merchants') {
                setViewMode('subcategories');
              } else if (viewMode === 'subcategories') {
                setViewMode('categories');
                setSelectedCategory(null);
                router.replace('/categories');
              } else {
                router.back();
              }
            }} 
            className="rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100 active:scale-95"
            aria-label="Go back"
          >
            <ChevronRight className="rotate-180" size={20} />
          </button>
          <div className="group relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#215481]" size={17} />
            <input
              type="text"
              placeholder={isGlobalSearch ? 'Search categories and businesses' : 'Search categories'}
              className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 focus:border-[#215481]/40 focus:ring-4 focus:ring-[#215481]/10"
              value={searchQuery}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  applyGlobalSearch(searchQuery);
                }
              }}
            />
          </div>
        </div>
      </header>

      {/* Sort & Filter Bar */}
      <div className="relative z-10 flex border-b border-slate-200/80 bg-white">
        <button 
          onClick={() => {
            setFilterActive(!filterActive);
            setSortActive(false);
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 border-r border-slate-100 py-2.5 text-xs font-medium transition-colors ${
            filterActive ? 'bg-[#215481] text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter size={13} className={filterActive ? 'text-white' : 'text-slate-400'} />
          Filter{activeFilters.length > 0 ? ` · ${activeFilters.length}` : ''}
        </button>

        <button 
          onClick={() => {
            setSortActive(!sortActive);
            setFilterActive(false);
          }}
          className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
            sortActive ? 'bg-[#215481] text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp size={13} className={sortActive ? 'text-white' : 'text-slate-400'} />
          Sort
        </button>

        {/* Filter Dropdown */}
        {filterActive && (
          <div className="absolute top-full left-0 z-50 w-full animate-in slide-in-from-top-2 border-t border-slate-100 bg-white p-4 shadow-lg duration-300">
            <div className="space-y-4">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-xs font-semibold text-slate-700">Filters</h4>
                <button 
                  onClick={resetFilters}
                  className="text-xs font-medium text-[#215481] hover:underline"
                >
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Open Now', 'Top Rated', 'Nearest First', 'FinderB verified'].map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFilter(f)}
                    className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                      activeFilters.includes(f)
                        ? 'border-[#215481] bg-[#215481] text-white'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#215481]/30'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setFilterActive(false)}
                className="mt-2 w-full rounded-lg bg-slate-900 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Sort Dropdown */}
        {sortActive && (
          <div className="absolute top-full left-0 z-50 w-full animate-in slide-in-from-top-2 border-t border-slate-100 bg-white p-4 shadow-lg duration-300">
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-700">Sort by name</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['asc', 'desc'] as const).map((order) => (
                  <button
                    key={order}
                    onClick={() => {
                      setSortOrder(order);
                      setSortActive(false);
                    }}
                    className={`rounded-lg border py-2 text-xs font-medium transition-colors ${
                      sortOrder === order 
                        ? 'border-[#215481] bg-[#215481] text-white' 
                        : 'border-slate-200 bg-white text-slate-600 hover:border-[#215481]/30'
                    }`}
                  >
                    {order === 'asc' ? 'A → Z' : 'Z → A'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Compact for more items */}
        {viewMode !== 'categories' && viewMode !== 'global-search' && (
          <aside className="w-20 bg-white border-r border-slate-100 overflow-y-auto scrollbar-hide pb-24">
            {viewMode === 'subcategories' ? (
              [
                ...(selectedCategory ? [selectedCategory] : []),
                ...categories.filter(cat => cat.id !== selectedCategory?.id)
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className={`w-full py-3.5 flex flex-col items-center gap-1.5 transition-all relative group ${
                    selectedCategory?.id === cat.id
                      ? 'bg-primary/5'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  {selectedCategory?.id === cat.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                  )}
                  <CategoryIcon
                    icon={cat.icon}
                    name={cat.name}
                    size={32}
                    className={`h-8 w-8 transition-transform duration-300 ${
                      selectedCategory?.id === cat.id
                        ? 'text-primary scale-110'
                        : 'text-slate-400 group-hover:scale-105'
                    }`}
                    imageClassName="object-contain"
                  />
                  <span className={`text-[8px] font-semibold text-center px-1 leading-tight transition-colors line-clamp-2 font-sans ${
                    selectedCategory?.id === cat.id ? 'text-primary' : 'text-slate-400'
                  }`}>{cat.name}</span>
                </button>
              ))
            ) : (
              <div className="flex flex-col">
                <button
                  onClick={() => setViewMode('subcategories')}
                  className="w-full py-4 flex flex-col items-center gap-1 border-b border-slate-100 bg-slate-50/50 group"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                    <ChevronRight className="rotate-180" size={14} />
                  </div>
                  <span className="text-[8px] font-black text-primary uppercase">Back</span>
                </button>
                {subCategories.map((sub) => (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedSubCategory(sub)}
                    className={`w-full py-3.5 flex flex-col items-center gap-1.5 transition-all relative group ${
                      selectedSubCategory?.id === sub.id
                        ? 'bg-secondary/5'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {selectedSubCategory?.id === sub.id && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-secondary rounded-r-full" />
                    )}
                    <CategoryIcon
                      icon={sub.icon}
                      name={sub.name}
                      size={32}
                      className={`h-8 w-8 transition-transform duration-300 ${
                        selectedSubCategory?.id === sub.id
                          ? 'text-secondary scale-110'
                          : 'text-slate-400 group-hover:scale-105'
                      }`}
                      imageClassName="object-contain"
                    />
                    <span className={`text-[8px] font-semibold text-center px-1 leading-tight transition-colors line-clamp-2 font-sans ${
                      selectedSubCategory?.id === sub.id ? 'text-secondary' : 'text-slate-400'
                    }`}>{sub.name}</span>
                  </button>
                ))}
              </div>
            )}
          </aside>
        )}

        {/* Right Panel - Modern Grid */}
        <main className="scrollbar-hide flex-1 overflow-y-auto bg-[#f4f7fb] pb-32">
          {isLoading ? (
            <div className="p-5 max-w-4xl mx-auto w-full">
              <div className="mb-8 mt-4">
                <div className="h-10 w-48 bg-slate-200 rounded-xl animate-pulse mb-2" />
                <div className="h-4 w-64 bg-slate-200 rounded-lg animate-pulse" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="flex flex-col items-center gap-4 p-6 bg-white rounded-[2.5rem] shadow-sm animate-pulse border border-slate-100">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-slate-100" />
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-3 w-16 bg-slate-100 rounded-full" />
                      <div className="h-2 w-12 bg-slate-50 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isSubLoading ? (
            <div className="grid grid-cols-2 gap-4 p-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-full aspect-[4/5] rounded-3xl bg-white animate-pulse" />
                  <div className="w-2/3 h-4 bg-white rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : viewMode === 'categories' ? (
            <div className="mx-auto w-full max-w-4xl p-5">
              <div className="mb-6 mt-2">
                <h1 className="text-xl font-semibold tracking-tight text-slate-900">Browse categories</h1>
                <p className="mt-1 text-sm text-slate-500">Pick a category to see services and listings near you</p>
              </div>
              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
                {categories.filter(cat => !searchQuery || textMatchesSearch(cat.name, searchQuery)).map((cat, index) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="group flex flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3.5 transition-colors hover:border-[#215481]/25 hover:bg-slate-50/80 sm:gap-2.5 sm:p-4"
                  >
                    <CategoryIcon
                      icon={cat.icon}
                      name={cat.name}
                      size={52}
                      className="h-12 w-12 text-slate-600 transition-transform duration-200 group-hover:scale-[1.03] sm:h-14 sm:w-14"
                      imageClassName="object-contain"
                    />
                    <div className="flex w-full flex-col items-center gap-0.5">
                      <span className="line-clamp-2 w-full text-center text-[11px] font-medium leading-snug text-slate-800 group-hover:text-[#215481] sm:text-xs">
                        {cat.name}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {cat.businessCount || 0} listings
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : viewMode === 'subcategories' ? (
            <div className="p-5">
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h1 className="text-lg font-semibold tracking-tight text-slate-900">{selectedCategory?.name}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">{subCategories.length} subcategories</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5">
                {subCategories.filter(sub => !searchQuery || textMatchesSearch(sub.name, searchQuery)).length > 0 ? (
                  subCategories.filter(sub => !searchQuery || textMatchesSearch(sub.name, searchQuery)).map((sub, index) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubCategoryClick(sub)}
                      className="group flex w-full flex-col items-center gap-2 rounded-xl border border-slate-200/80 bg-white p-3.5 text-center transition-colors hover:border-[#215481]/25 hover:bg-slate-50/80 sm:p-4"
                    >
                      <CategoryIcon
                        icon={sub.icon}
                        name={sub.name}
                        size={48}
                        className="h-11 w-11 text-slate-600 transition-transform duration-200 group-hover:scale-[1.03] sm:h-12 sm:w-12"
                        imageClassName="object-contain"
                      />
                      <div className="flex w-full flex-col items-center gap-0.5">
                        <h3 className="line-clamp-2 w-full text-[11px] font-medium leading-snug text-slate-900 group-hover:text-[#215481] sm:text-xs">
                          {sub.name}
                        </h3>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 flex flex-col items-center justify-center py-24 text-slate-400">
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                      <LayoutGrid size={28} />
                    </div>
                    <p className="text-sm font-medium text-slate-500">No subcategories yet</p>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'global-search' ? (
            <div className="mx-auto w-full max-w-3xl space-y-6 p-5">
              <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
                <p className="text-sm text-slate-500">
                  {isSearchCategoriesLoading ? (
                    'Searching…'
                  ) : globalSearchTotalCount > 0 ? (
                    <>
                      <span className="font-medium text-slate-800">{globalSearchTotalCount}</span>
                      {' '}result{globalSearchTotalCount !== 1 ? 's' : ''}
                      {parsedGlobalSearch.locationHint ? (
                        <>
                          {' '}in{' '}
                          <span className="capitalize text-slate-700">
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

              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-700">Categories</h2>
                {isSearchCategoriesLoading ? (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div
                        key={i}
                        className="h-28 rounded-2xl bg-white border border-slate-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : globalSearchCategoryPartitions.best.length > 0 ||
                  globalSearchCategoryPartitions.related.length > 0 ? (
                  <div className="space-y-5">
                    {globalSearchCategoryPartitions.best.length > 0
                      ? renderCategoryHitGrid(globalSearchCategoryPartitions.best)
                      : null}
                    {globalSearchCategoryPartitions.related.length > 0 ? (
                      <div className="space-y-3 border-t border-slate-200/80 pt-4">
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

              <section className="space-y-3">
                <h2 className="text-xs font-semibold text-slate-700">Businesses</h2>
                {globalSearchBusinessPartitions.best.length > 0 ||
                globalSearchBusinessPartitions.related.length > 0 ? (
                  <div className="space-y-5">
                    {globalSearchBusinessPartitions.best.length > 0 ? (
                      <div className="flex flex-col gap-2.5">
                        {globalSearchBusinessPartitions.best.map((biz) => (
                          <div key={biz.id}>{renderGlobalBusinessCard(biz)}</div>
                        ))}
                      </div>
                    ) : null}
                    {globalSearchBusinessPartitions.related.length > 0 ? (
                      <div className="space-y-3 border-t border-slate-200/80 pt-4">
                        <h3 className="text-xs font-medium text-slate-500">Related businesses</h3>
                        <div className="flex flex-col gap-2.5">
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
            <div className="space-y-4 p-4">
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-xs text-slate-500">{selectedCategory?.name}</p>
                  <h3 className="text-lg font-semibold tracking-tight text-slate-900">
                    {selectedSubCategory?.name}
                  </h3>
                </div>
                <button
                  onClick={() => setViewMode('subcategories')}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-[#215481]/30 hover:text-[#215481]"
                >
                  Change
                </button>
              </div>

              {selectedSubCategory ? (
                <CategoryMerchantList
                  key={selectedSubCategory.id}
                  categorySlug={selectedSubCategory.slug || selectedSubCategory.name}
                  searchQuery={searchQuery}
                />
              ) : null}
            </div>
          )}
        </main>
      </div>

    </div>
  );
}

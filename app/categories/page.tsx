'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronRight, LayoutGrid, ShoppingBag, Home, Sparkles, TrendingUp, Grid } from 'lucide-react';
import { getCategories, getSubCategories } from '@/app/actions/category';
import { getFeaturedBusinesses } from '@/app/actions/business';
import CategoryIcon from '@/components/CategoryIcon';
import Image from 'next/image';

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

  const [viewMode, setViewMode] = useState<'categories' | 'subcategories' | 'merchants'>(
    searchParams.get('search') ? 'merchants' : 'categories'
  );

  const isGlobalSearch = Boolean(searchParams.get('search')?.trim());

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

  useEffect(() => {
    const q = searchParams.get('search')?.trim();
    if (q) {
      setSearchQuery(q);
      setViewMode('merchants');
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      return;
    }

    if (categoryIdFromUrl && categories.length > 0) {
      const category = categories.find(cat => cat.id === categoryIdFromUrl);
      if (category) {
        setSelectedCategory(category);
        setViewMode('subcategories');
      }
    }
  }, [searchParams, categoryIdFromUrl, categories]);

  const businessMatchesSearch = (biz: any, q: string) => {
    if (!q) return true;
    const hay = q.toLowerCase();
    return [biz.name, biz.category, biz.description, biz.location]
      .filter(Boolean)
      .some((field) => String(field).toLowerCase().includes(hay));
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

  // Simple filtering and sorting logic
  const filteredAndSortedBusinesses = [...businesses]
    .filter((biz) => businessMatchesSearch(biz, searchQuery))
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
      if (activeFilters.includes('Nearest First')) {
        // Mock distance sort - in real app would use geolocation
        return a.id.localeCompare(b.id);
      }
      
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (sortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Header / Search Bar */}
      <header className="bg-white px-4 py-4 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => {
              if (viewMode === 'merchants') {
                setViewMode('subcategories');
              } else if (viewMode === 'subcategories') {
                setViewMode('categories');
                setSelectedCategory(null);
              } else {
                router.back();
              }
            }} 
            className="p-2 hover:bg-slate-100 rounded-full transition-colors active:scale-95"
          >
            <ChevronRight className="rotate-180 text-slate-700" size={20} />
          </button>
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Search categories..."
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white transition-all outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </header>

      {/* Sort & Filter Bar */}
      <div className="flex bg-white border-b border-slate-100 relative z-10">
        <button 
          onClick={() => {
            setFilterActive(!filterActive);
            setSortActive(false);
          }}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold transition-all uppercase border-r border-slate-100 ${
            filterActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Filter size={12} className={filterActive ? 'text-white' : 'text-slate-400'} />
          Filter {activeFilters.length > 0 && `(${activeFilters.length})`}
        </button>

        <button 
          onClick={() => {
            setSortActive(!sortActive);
            setFilterActive(false);
          }}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-bold transition-all uppercase ${
            sortActive ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <TrendingUp size={12} className={sortActive ? 'text-white' : 'text-slate-400'} />
          Sort
        </button>

        {/* Filter Dropdown */}
        {filterActive && (
          <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-slate-100 p-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[10px] font-black text-slate-400 uppercase">Filters</h4>
                <button 
                  onClick={resetFilters}
                  className="text-[9px] font-bold text-primary uppercase hover:underline"
                >
                  Reset All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Open Now', 'Top Rated', 'Nearest First', 'FinderB verified'].map((f) => (
                  <button
                    key={f}
                    onClick={() => toggleFilter(f)}
                    className={`px-4 py-2 border rounded-full text-[9px] font-bold uppercase transition-all ${
                      activeFilters.includes(f)
                        ? 'bg-primary border-primary text-white shadow-md'
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-primary/30'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setFilterActive(false)}
                className="w-full py-2.5 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl shadow-lg mt-2"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Sort Dropdown */}
        {sortActive && (
          <div className="absolute top-full left-0 w-full bg-white shadow-xl border-t border-slate-100 p-4 z-50 animate-in slide-in-from-top-2 duration-300">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-slate-400 uppercase mb-3">Sort Order</h4>
              <div className="grid grid-cols-2 gap-2">
                {(['asc', 'desc'] as const).map((order) => (
                  <button
                    key={order}
                    onClick={() => {
                      setSortOrder(order);
                      setSortActive(false);
                    }}
                    className={`py-2 rounded-xl text-[10px] font-bold uppercase border transition-all ${
                      sortOrder === order 
                        ? 'bg-primary border-primary text-white shadow-lg' 
                        : 'bg-slate-50 border-slate-100 text-slate-600 hover:border-primary/30'
                    }`}
                  >
                    {order === 'asc' ? 'Ascending' : 'Descending'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Compact for more items */}
        {viewMode !== 'categories' && (
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
        <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide bg-slate-50/50">
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
            <div className="p-5 max-w-4xl mx-auto w-full">
              <div className="mb-8 mt-4">
                <h1 className="text-3xl font-black text-slate-900 mb-2">All Categories</h1>
                <p className="text-slate-500 text-sm font-medium">Select a category to explore sub-categories and local businesses</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                {categories.filter(cat => !searchQuery || cat.name.toLowerCase().includes(searchQuery.toLowerCase())).map((cat, index) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="flex flex-col items-center gap-2 p-4 sm:gap-3 sm:p-5 bg-white rounded-2xl sm:rounded-[2rem] shadow-sm hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 group border border-slate-100"
                  >
                    <CategoryIcon
                      icon={cat.icon}
                      name={cat.name}
                      size={56}
                      className="h-14 w-14 sm:h-16 sm:w-16 text-slate-600 transition-transform duration-300 group-hover:scale-105 group-hover:text-primary"
                      imageClassName="object-contain"
                    />
                    <div className="flex flex-col items-center gap-0.5 w-full">
                      <span className="text-[10px] sm:text-xs font-semibold text-slate-800 text-center group-hover:text-primary transition-colors line-clamp-2 leading-snug w-full">
                        {cat.name}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-medium text-slate-400">
                        {cat.businessCount || 0}+ Places
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : viewMode === 'subcategories' ? (
            <div className="p-5">
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 leading-none mb-2">{selectedCategory?.name}</h1>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary/10 text-primary text-[9px] font-bold uppercase rounded-full">
                      {subCategories.length} Options
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 sm:gap-4">
                {subCategories.filter(sub => !searchQuery || sub.name.toLowerCase().includes(searchQuery.toLowerCase())).length > 0 ? (
                  subCategories.filter(sub => !searchQuery || sub.name.toLowerCase().includes(searchQuery.toLowerCase())).map((sub, index) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubCategoryClick(sub)}
                      className="group flex w-full flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-white p-4 text-center shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 sm:rounded-[2rem] sm:p-5"
                    >
                      <CategoryIcon
                        icon={sub.icon}
                        name={sub.name}
                        size={52}
                        className="h-12 w-12 sm:h-14 sm:w-14 text-slate-600 transition-transform duration-300 group-hover:scale-105 group-hover:text-primary"
                        imageClassName="object-contain"
                      />
                      <div className="flex w-full flex-col items-center gap-0.5">
                        <h3 className="text-[9px] sm:text-[11px] font-semibold text-slate-900 leading-snug line-clamp-2 w-full group-hover:text-primary transition-colors">
                          {sub.name}
                        </h3>
                        <p className="text-[7px] sm:text-[8px] font-medium text-slate-400">View</p>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="col-span-2 py-24 flex flex-col items-center justify-center text-slate-300">
                    <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                      <LayoutGrid size={32} />
                    </div>
                    <p className="text-xs font-black uppercase">Coming Soon</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-[10px] font-black text-slate-400 uppercase mb-1">
                    {isGlobalSearch ? 'Search Results' : 'Available Businesses'}
                  </h2>
                  <h3 className="text-lg font-black text-slate-900">
                    {isGlobalSearch ? `"${searchQuery}"` : selectedSubCategory?.name}
                  </h3>
                </div>
                {!isGlobalSearch && (
                  <button
                    onClick={() => setViewMode('subcategories')}
                    className="px-4 py-2 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-full text-[9px] font-black uppercase transition-all shadow-sm"
                  >
                    Change
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:gap-4">
                {filteredAndSortedBusinesses.filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())).map((biz) => (
                  <div key={biz.id} className="group relative bg-white border border-slate-100 overflow-hidden flex flex-row transition-all duration-500 rounded-2xl sm:rounded-none">
                    <div className="relative w-24 sm:w-36 aspect-square overflow-hidden shrink-0">
                      <Image
                        src={biz.image || biz.profilePictureUrl || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400'}
                        alt={biz.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                      <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-secondary text-white text-[7px] sm:text-[8px] font-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full shadow-lg">
                        {Math.floor(Math.random() * 40) + 20}% OFF
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1">
                          <span className="text-[7px] sm:text-[8px] font-black text-primary uppercase px-1.5 py-0.5 bg-primary/5 rounded-full line-clamp-1">
                            {biz.category || 'Premium'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Sparkles size={7} className="text-yellow-400 fill-yellow-400 sm:w-2 sm:h-2" />
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-900">4.9</span>
                          </div>
                        </div>
                        <h3 className="text-[10px] sm:text-xs font-black text-slate-900 leading-tight mb-0.5 sm:mb-1 truncate group-hover:text-primary transition-colors">{biz.name}</h3>
                        <p className="text-[8px] sm:text-[9px] font-bold text-slate-400 line-clamp-1 flex items-center gap-1">
                          <Home size={7} className="sm:w-2 sm:h-2" /> 2.4 km • Open
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-1.5 sm:mt-2">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-xs sm:text-sm font-black text-slate-900">₹{Math.floor(Math.random() * 300) + 50}</span>
                            <span className="text-[7px] sm:text-[8px] text-slate-400 line-through font-bold">₹{Math.floor(Math.random() * 500) + 300}</span>
                          </div>
                          <span className="text-[7px] sm:text-[8px] font-bold text-emerald-500">Best Price</span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button 
                            onClick={() => router.push(`/business/${biz.id}`)}
                            className="px-2.5 py-1.5 sm:px-3 sm:py-2 bg-primary text-white rounded-lg text-[8px] sm:text-[9px] font-black uppercase hover:bg-primary/90 active:scale-95 transition-all shadow-sm"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      </div>

    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, Filter, ChevronRight, LayoutGrid, ShoppingBag, Home, Sparkles, User, Bot, TrendingUp } from 'lucide-react';
import { getCategories, getSubCategories } from '@/app/actions/category';
import { getFeaturedBusinesses } from '@/app/actions/business';
import Image from 'next/image';

interface SubCategory {
  id: string;
  name: string;
  slug: string;
  image: string;
  businessCount?: number;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<SubCategory | null>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubLoading, setIsSubLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      const [catResult, bizResult] = await Promise.all([
        getCategories(),
        getFeaturedBusinesses()
      ]);

      if (catResult.success && catResult.categories) {
        setCategories(catResult.categories);
        // Set first category as default
        if (catResult.categories.length > 0) {
          setSelectedCategory(catResult.categories[0]);
        }
      }
      
      if (bizResult.success && bizResult.businesses) {
        setBusinesses(bizResult.businesses);
      }
      setIsLoading(false);
    }
    fetchData();
  }, []);

  const [viewMode, setViewMode] = useState<'subcategories' | 'merchants'>('subcategories');

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
        setViewMode('subcategories');
      }
    }
    fetchSubs();
  }, [selectedCategory]);

  const handleSubCategoryClick = (sub: any) => {
    setSelectedSubCategory(sub);
    setViewMode('merchants');
  };

  const handleTabChange = (label: string) => {
    if (label === 'Home') {
      router.push('/');
      return;
    }
    if (label === 'Categories') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (label === 'FinderB AI') {
      router.push('/?tab=finderb-ai');
      return;
    }
    if (label === 'Account') {
      router.push('/account');
      return;
    }
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
            onClick={() => router.back()} 
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
        <div className="flex-[1.5] py-3 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-400 border-r border-slate-100 uppercase">
          <Sparkles size={12} className="text-secondary" />
          {viewMode === 'subcategories' ? 'Explore' : 'Browse'}
        </div>
        
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
        <aside className="w-20 bg-white border-r border-slate-100 overflow-y-auto scrollbar-hide pb-24">
          {viewMode === 'subcategories' ? (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat)}
                className={`w-full py-3.5 flex flex-col items-center gap-1.5 transition-all relative group ${
                  selectedCategory?.id === cat.id
                    ? 'bg-primary/5'
                    : 'hover:bg-slate-50'
                }`}
              >
                {selectedCategory?.id === cat.id && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full" />
                )}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center p-0.5 border-2 transition-all duration-300 ${
                  selectedCategory?.id === cat.id
                    ? 'border-primary bg-white shadow-md shadow-primary/10 scale-105'
                    : 'border-transparent bg-slate-50 group-hover:scale-105'
                } overflow-hidden relative`}>
                  <Image 
                    src={cat.image || 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=100'} 
                    alt={cat.name} 
                    fill 
                    className="object-cover p-0.5 rounded-lg"
                  />
                </div>
                <span className={`text-[8px] font-black text-center px-1 leading-tight uppercase tracking-tighter transition-colors line-clamp-2 ${
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
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center p-0.5 border-2 transition-all duration-300 ${
                    selectedSubCategory?.id === sub.id
                      ? 'border-secondary bg-white shadow-md shadow-secondary/10 scale-105'
                      : 'border-transparent bg-slate-50 group-hover:scale-105'
                  } overflow-hidden relative`}>
                    <Image 
                      src={sub.image} 
                      alt={sub.name} 
                      fill 
                      className="object-cover p-0.5 rounded-lg"
                    />
                  </div>
                  <span className={`text-[8px] font-black text-center px-1 leading-tight uppercase transition-colors line-clamp-2 ${
                    selectedSubCategory?.id === sub.id ? 'text-secondary' : 'text-slate-400'
                  }`}>{sub.name}</span>
                </button>
              ))}
            </div>
          )}
        </aside>

        {/* Right Panel - Modern Grid */}
        <main className="flex-1 overflow-y-auto pb-32 scrollbar-hide bg-slate-50/50">
          {isSubLoading ? (
            <div className="grid grid-cols-2 gap-4 p-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col gap-3">
                  <div className="w-full aspect-[4/5] rounded-3xl bg-white animate-pulse" />
                  <div className="w-2/3 h-4 bg-white rounded-full animate-pulse" />
                </div>
              ))}
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

              <div className="grid grid-cols-2 gap-4">
                {subCategories.length > 0 ? (
                  subCategories.map((sub, index) => (
                    <button
                      key={sub.id}
                      onClick={() => handleSubCategoryClick(sub)}
                      className="group flex flex-col gap-3 text-left"
                    >
                      <div className={`relative aspect-[4/5] rounded-[2rem] overflow-hidden shadow-sm group-hover:shadow-xl group-hover:shadow-primary/10 transition-all duration-500 border border-slate-100 ${
                        index % 4 === 0 ? 'bg-orange-100' : 
                        index % 4 === 1 ? 'bg-blue-100' : 
                        index % 4 === 2 ? 'bg-emerald-100' : 'bg-purple-100'
                      }`}>
                        <Image 
                          src={sub.image} 
                          alt={sub.name} 
                          fill 
                          className="object-cover group-hover:scale-110 transition-transform duration-700" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
                        <div className="absolute bottom-4 left-4 right-4">
                          <p className="text-[9px] font-black text-white/70 uppercase tracking-[0.2em] mb-1">View All</p>
                          <h3 className="text-[11px] font-black text-white leading-tight uppercase tracking-wide line-clamp-2">{sub.name}</h3>
                        </div>
                        <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                          <ChevronRight size={16} className="text-white" />
                        </div>
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
                  <h2 className="text-[10px] font-black text-slate-400 uppercase mb-1">Available Businesses</h2>
                  <h3 className="text-lg font-black text-slate-900">{selectedSubCategory?.name}</h3>
                </div>
                <button 
                  onClick={() => setViewMode('subcategories')} 
                  className="px-4 py-2 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-full text-[9px] font-black uppercase transition-all shadow-sm"
                >
                  Change
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {filteredAndSortedBusinesses.filter(b => !searchQuery || b.name.toLowerCase().includes(searchQuery.toLowerCase())).map((biz) => (
                  <div key={biz.id} className="group relative bg-white border border-slate-100 overflow-hidden flex flex-row transition-all duration-500">
                    <div className="relative w-28 sm:w-36 aspect-square overflow-hidden shrink-0">
                      <Image
                        src={biz.image || biz.profilePictureUrl || 'https://images.unsplash.com/photo-1581244277943-fe4a9c777189?auto=format&fit=crop&q=80&w=400'}
                        alt={biz.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-1000"
                      />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />
                      <div className="absolute top-2 left-2 bg-secondary text-white text-[8px] font-black px-2 py-1 rounded-full shadow-lg">
                        {Math.floor(Math.random() * 40) + 20}% OFF
                      </div>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[8px] font-black text-primary uppercase px-2 py-0.5 bg-primary/5 rounded-full line-clamp-1">
                            {biz.category || 'Premium'}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Sparkles size={8} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-[9px] font-black text-slate-900">4.9</span>
                          </div>
                        </div>
                        <h3 className="text-xs font-black text-slate-900 leading-tight mb-1 truncate group-hover:text-primary transition-colors">{biz.name}</h3>
                        <p className="text-[9px] font-bold text-slate-400 line-clamp-1 flex items-center gap-1">
                          <Home size={8} /> 2.4 km • Open Now
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-col">
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm font-black text-slate-900">₹{Math.floor(Math.random() * 300) + 50}</span>
                            <span className="text-[8px] text-slate-400 line-through font-bold">₹{Math.floor(Math.random() * 500) + 300}</span>
                          </div>
                          <span className="text-[8px] font-bold text-emerald-500">Best Price</span>
                        </div>
                        
                        <div className="flex gap-1.5">
                          <button className="px-3 py-2 bg-primary text-white rounded-lg text-[9px] font-black uppercase hover:bg-primary/90 active:scale-95 transition-all shadow-sm">
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

      {/* Mobile Bottom Navigation - Slim & Premium */}
      <div className="fixed bottom-0 left-0 w-full z-[100] bg-white/90 backdrop-blur-md border-t border-slate-100/50">
        <div className="flex items-center justify-around px-2 py-1.5 pb-safe">
          {[
            { icon: Home, label: 'Home' },
            { icon: LayoutGrid, label: 'Categories' },
            { icon: Bot, label: 'FinderB AI' },
            { icon: User, label: 'Account' },
          ].map((item, i) => (
            <button
              key={i}
              onClick={() => handleTabChange(item.label)}
              className={`flex flex-col items-center gap-0.5 p-1.5 px-4 transition-all duration-300 group relative rounded-xl ${
                item.label === 'Categories'
                  ? 'text-primary'
                  : 'text-slate-400'
              }`}
            >
              <item.icon
                size={20}
                className={`transition-all duration-300 ${
                  item.label === 'Categories'
                    ? 'scale-110'
                    : 'group-active:scale-90'
                }`}
              />
              <span className={`text-[8px] font-black uppercase transition-all duration-300 ${
                item.label === 'Categories' ? 'opacity-100' : 'opacity-60'
              }`}>
                {item.label}
              </span>
              {item.label === 'Categories' && (
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-primary rounded-full shadow-[0_0_8px_rgba(33,84,129,0.5)] animate-pulse"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

import { businesses, categories } from '@/lib/mockData';
import BusinessCard from '@/components/BusinessCard';
import { Filter, ChevronDown, Star, MapPin } from 'lucide-react';

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const categorySlug = (await params).category;
  
  const currentCategory = categories.find(c => c.slug === categorySlug) || { name: 'All Services' };
  
  const filteredBusinesses = categorySlug === 'all' 
    ? businesses 
    : businesses.filter(b => b.category.toLowerCase().replace(' ', '-') === categorySlug);

  return (
    <div className="bg-accent/30 min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-black text-primary mb-4">{currentCategory.name}</h1>
          <p className="text-gray-500 font-medium">Found {filteredBusinesses.length} businesses matching your criteria</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 space-y-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-2 mb-6">
                <Filter size={18} className="text-blue-600" />
                <h3 className="font-black text-gray-900 uppercase tracking-wider text-sm">Filters</h3>
              </div>

              {/* Location Filter */}
              <div className="space-y-4 mb-8">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Location</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    className="w-full pl-9 pr-3 py-3 bg-gray-50 border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500" 
                    placeholder="Search city..." 
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div className="space-y-4 mb-8">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Minimum Rating</label>
                <div className="space-y-2">
                  {[4, 3, 2].map((r) => (
                    <label key={r} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500" />
                      <div className="flex items-center gap-1">
                        <span className="text-sm font-bold text-gray-700">{r}+</span>
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Price Range</label>
                <div className="space-y-2">
                  {['Budget', 'Mid-range', 'Premium'].map((p) => (
                    <label key={p} className="flex items-center gap-3 cursor-pointer group">
                      <input type="checkbox" className="w-5 h-5 rounded-lg border-gray-200 text-blue-600 focus:ring-blue-500" />
                      <span className="text-sm font-bold text-gray-700">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Business Listings */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              {filteredBusinesses.map((biz) => (
                <BusinessCard key={biz.id} business={biz} />
              ))}
              {filteredBusinesses.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                  <p className="text-gray-500 font-bold">No businesses found in this category yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

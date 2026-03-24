'use client';

import { useState } from 'react';
import { Search, MapPin, ChevronDown } from 'lucide-react';
import { categories } from '@/lib/mockData';

export default function SearchBar() {
  const [category, setCategory] = useState('');
  const [location, setLocation] = useState('');
  const [query, setQuery] = useState('');

  return (
    <div className="w-full max-w-4xl bg-white p-1.5 md:p-2 rounded-2xl shadow-premium hover:shadow-premium-hover transition-all flex flex-col md:flex-row items-center gap-2 border border-blue-50/50 group/search">
      {/* Category Selection */}
      <div className="relative w-full md:w-[30%]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 group-focus-within/search:text-blue-600 transition-colors">
          <Search size={18} />
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-blue-50/30 border-none rounded-xl text-gray-700 focus:ring-1 focus:ring-blue-200 appearance-none cursor-pointer font-semibold text-sm transition-all"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.slug}>{cat.name}</option>
          ))}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
          <ChevronDown size={14} />
        </div>
      </div>

      <div className="hidden md:block w-px h-6 bg-blue-100/50 mx-1"></div>

      {/* Location Input */}
      <div className="relative w-full md:w-[25%]">
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500">
          <MapPin size={18} />
        </div>
        <input
          type="text"
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-blue-50/30 border-none rounded-xl text-gray-700 focus:ring-1 focus:ring-blue-200 font-semibold text-sm placeholder:text-gray-400 transition-all"
        />
      </div>

      <div className="hidden md:block w-px h-6 bg-blue-100/50 mx-1"></div>

      {/* Search Query */}
      <div className="relative w-full flex-grow">
        <input
          type="text"
          placeholder="Search for services..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2.5 bg-blue-50/30 border-none rounded-xl text-gray-700 focus:ring-1 focus:ring-blue-200 font-semibold text-sm placeholder:text-gray-400 transition-all"
        />
      </div>

      {/* Search Button */}
      <button className="w-full md:w-auto bg-primary hover:bg-blue-800 text-white font-black px-8 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-200/50 text-sm tracking-wide">
        Search
      </button>
    </div>
  );
}

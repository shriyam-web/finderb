'use client';

import { useState, useEffect } from 'react';
import { Search, MapPin, ChevronDown, Mic, TrendingUp, X } from 'lucide-react';
import { categories } from '@/lib/mockData';

export default function SearchBar() {
  const [location, setLocation] = useState('');
  const [query, setQuery] = useState('');
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    if (!location) {
      setLocation('Delhi');
    }
  }, []);

  const trendingSearches = [
    'Plumbers in South Delhi',
    'Best Electricians near me',
    'Gyms in New Delhi',
    'Professional Cleaning Services'
  ];

  const popularCities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune'
  ];

  const handleVoiceSearch = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setShowSearchSuggestions(true);
      };
      recognition.start();
    } else {
      alert('Voice search is not supported in your browser.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 relative z-[1002]">
      <div className="w-full bg-white rounded-xl border-2 border-gray-100 focus-within:border-primary transition-all flex flex-col md:flex-row items-stretch md:items-center">
        
        {/* Location Search */}
        <div className="relative flex-grow md:w-[30%] border-b md:border-b-0 md:border-r border-gray-100">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <MapPin size={16} />
          </div>
          <input
            type="text"
            placeholder="City..."
            aria-label="Search by city"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setShowLocationSuggestions(true)}
            onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
            className="w-full pl-11 pr-4 py-4 bg-transparent border-none focus:ring-0 text-gray-900 font-medium text-sm placeholder:text-gray-400"
          />
          
          {showLocationSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl overflow-hidden z-20 p-2">
              <p className="text-[8px] font-medium text-gray-400 mb-2 px-3 pt-1">Popular Cities</p>
              <div className="space-y-0.5">
                {popularCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setLocation(city)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 text-xs font-medium text-gray-700"
                  >
                    <MapPin size={12} className="text-gray-300" />
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Search */}
        <div className="relative flex-grow md:w-[55%]">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            placeholder="Search for services, professionals..."
            aria-label="Search for services or professionals"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
            className="w-full pl-11 pr-12 py-4 bg-transparent border-none focus:ring-0 text-gray-900 font-medium text-sm placeholder:text-gray-400"
          />
          <button 
            onClick={handleVoiceSearch}
            aria-label="Voice search"
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-gray-50 hover:text-primary'}`}
          >
            <Mic size={16} />
          </button>

          {showSearchSuggestions && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl overflow-hidden z-20 p-2">
              <p className="text-[8px] font-medium text-gray-400 mb-2 px-3 pt-1">Trending Searches</p>
              <div className="space-y-0.5">
                {trendingSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-3 text-xs font-medium text-gray-700"
                  >
                    <TrendingUp size={12} className="text-gray-300" />
                    {search}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search CTA */}
        <div className="p-2 md:pr-2">
          <button className="w-full md:w-auto bg-primary hover:bg-secondary text-white font-medium px-8 py-3 rounded-lg transition-all active:scale-95 text-xs">
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [transcript, setTranscript] = useState('');

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
    'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Pune', 'Jaipur', 'Chandigarh'
  ];

  const handleVoiceSearch = () => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'speechRecognition' in window)) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).speechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.interimResults = true;
      
      recognition.onstart = () => {
        setIsListening(true);
        setShowVoiceModal(true);
        setTranscript('Listening...');
      };
      
      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'no-speech') {
          setTranscript('No voice detected');
        } else {
          setTranscript('Could not connect...');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Check if nothing was detected
        setTranscript((prev) => {
          if (prev === 'Listening...' || !prev) {
            return 'No voice detected';
          }
          return prev;
        });
        
        // Delay closing modal to let user see the final status
        setTimeout(() => setShowVoiceModal(false), 2500);
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const currentDisplay = (finalTranscript + interimTranscript).trim();
        if (currentDisplay) {
          setTranscript(currentDisplay);
        }

        if (finalTranscript) {
          setQuery(finalTranscript.trim());
          setShowSearchSuggestions(true);
        }
      };
      
      recognition.start();
    } else {
      alert('Voice search is not supported in your browser.');
    }
  };

  return (
    <div className="w-full flex flex-col gap-2 relative z-[10]">
      <div className="w-full bg-white rounded-xl shadow-md transition-all flex flex-col md:flex-row items-stretch md:items-center">
        
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

      {/* Voice Search Modal */}
      {showVoiceModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[10000] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 w-full max-w-sm text-center relative overflow-hidden animate-in zoom-in-95 duration-300 ring-1 ring-gray-100">
            {/* Close Button */}
            <button 
              onClick={() => setShowVoiceModal(false)}
              className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400"
            >
              <X size={24} />
            </button>

            <div className="space-y-12">
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  boomb voice search
                </h2>
                <p className="text-gray-400 text-sm font-medium">Listening for your command...</p>
              </div>

              <div className="relative flex items-center justify-center h-48">
                {/* Colorful Rings */}
                {isListening && (
                  <>
                    <div className="absolute w-24 h-24 rounded-full border-2 border-blue-400/30 animate-[voice-ring_2s_infinite]" />
                    <div className="absolute w-24 h-24 rounded-full border-2 border-purple-400/30 animate-[voice-ring_2s_infinite_0.4s]" />
                    <div className="absolute w-24 h-24 rounded-full border-2 border-pink-400/30 animate-[voice-ring_2s_infinite_0.8s]" />
                    <div className="absolute w-24 h-24 rounded-full border-2 border-emerald-400/30 animate-[voice-ring_2s_infinite_1.2s]" />
                  </>
                )}

                {/* Central Mic Button */}
                <div className={`relative z-10 w-28 h-28 rounded-full flex items-center justify-center transition-all duration-500 shadow-2xl ${
                  isListening 
                    ? 'bg-gradient-to-tr from-blue-600 via-purple-600 to-pink-600 scale-110 shadow-purple-500/20' 
                    : 'bg-gray-100'
                }`}>
                  <div className={`absolute inset-0 rounded-full bg-white/10 ${isListening ? 'animate-pulse' : ''}`} />
                  <Mic 
                    size={48} 
                    className={`transition-all duration-300 ${isListening ? 'text-white' : 'text-gray-400'}`} 
                  />
                </div>
              </div>

              <div className="min-h-[4.5rem] flex flex-col items-center justify-center bg-gray-50/50 rounded-2xl p-4">
                <p className={`text-xl font-semibold tracking-tight transition-all duration-300 ${
                  isListening ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {transcript || (isListening ? '...' : 'Stopped')}
                </p>
                {isListening && (
                  <div className="flex gap-1.5 mt-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
      <div className="w-full bg-transparent flex flex-col md:flex-row items-stretch md:items-center">
        
        {/* Location Search */}
        <div className="relative flex-grow md:w-[35%] group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:scale-110 transition-transform">
            <MapPin size={20} />
          </div>
          <input
            type="text"
            placeholder="Search location..."
            aria-label="Search by city"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setShowLocationSuggestions(true)}
            onBlur={() => setTimeout(() => setShowLocationSuggestions(false), 200)}
            className="w-full pl-12 pr-10 py-5 bg-transparent border-none focus:ring-0 text-gray-900 font-semibold text-base placeholder:text-gray-400 placeholder:font-medium"
          />
          <button 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-secondary transition-colors"
            title="Detect my location"
            onClick={() => setLocation('Detecting...')}
          >
            <ChevronDown size={18} />
          </button>
          
          {showLocationSuggestions && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-20 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center gap-2 px-3 py-2 mb-2 text-secondary bg-secondary/5 rounded-xl cursor-pointer hover:bg-secondary/10 transition-colors">
                <MapPin size={14} />
                <span className="text-xs font-bold uppercase tracking-wider">Detect Current Location</span>
              </div>
              <p className="text-[10px] font-bold text-gray-400 mb-2 px-3 pt-1 uppercase tracking-widest">Popular Cities</p>
              <div className="grid grid-cols-2 gap-1">
                {popularCities.map((city) => (
                  <button
                    key={city}
                    onClick={() => setLocation(city)}
                    className="w-full text-left px-3 py-2.5 hover:bg-gray-50 rounded-xl transition-all flex items-center gap-3 text-sm font-semibold text-gray-700"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-white transition-colors">
                      <MapPin size={12} />
                    </div>
                    {city}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="hidden md:block w-px h-10 bg-gray-100 mx-2"></div>

        {/* Main Search */}
        <div className="relative flex-grow md:w-[50%] group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary group-focus-within:scale-110 transition-transform">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="What are you looking for?"
            aria-label="Search for services or professionals"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSearchSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSearchSuggestions(false), 200)}
            className="w-full pl-12 pr-12 py-5 bg-transparent border-none focus:ring-0 text-gray-900 font-semibold text-base placeholder:text-gray-400 placeholder:font-medium"
          />
          <button 
            onClick={handleVoiceSearch}
            aria-label="Voice search"
            className={`absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all ${isListening ? 'bg-red-50 text-red-500 animate-pulse' : 'text-gray-400 hover:bg-gray-50 hover:text-secondary'}`}
          >
            <Mic size={20} />
          </button>

          {showSearchSuggestions && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden z-20 p-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <p className="text-[10px] font-bold text-gray-400 mb-2 px-3 pt-1 uppercase tracking-widest">Trending Searches</p>
              <div className="space-y-1">
                {trendingSearches.map((search) => (
                  <button
                    key={search}
                    onClick={() => setQuery(search)}
                    className="w-full text-left px-4 py-3 hover:bg-secondary/5 rounded-xl transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gray-50 text-gray-400 group-hover:bg-white group-hover:text-secondary transition-colors">
                        <TrendingUp size={14} />
                      </div>
                      <span className="text-sm font-semibold text-gray-700 group-hover:text-secondary transition-colors">{search}</span>
                    </div>
                    <ChevronDown size={14} className="text-gray-300 -rotate-90 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search CTA */}
        <div className="p-2 md:pr-0">
          <button className="w-full md:w-auto bg-gradient-to-r from-secondary to-purple-600 hover:shadow-lg hover:shadow-secondary/30 text-white font-bold px-10 py-4 rounded-xl transition-all active:scale-95 text-sm uppercase tracking-widest">
            Find Now
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

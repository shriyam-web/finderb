'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface Option {
  label: string;
  value: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export function SearchableSelect({ options, value, onChange, placeholder, label, icon, disabled }: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="group space-y-1.5 relative" ref={containerRef}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.15em] ml-1 group-focus-within:text-blue-600 transition-colors">
        {label}
      </label>
      <div 
        className={`relative cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-600 transition-colors">
          {icon}
        </div>
        <div className={`w-full pl-11 pr-10 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-blue-600 outline-none font-semibold text-gray-900 transition-all text-sm flex items-center min-h-[56px] ${isOpen ? 'border-blue-600 bg-white ring-2 ring-blue-50' : ''}`}>
          {selectedOption ? (
            <span className="truncate">{selectedOption.label}</span>
          ) : (
            <span className="text-gray-300 font-normal">{placeholder}</span>
          )}
        </div>
        <ChevronDown 
          className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} 
          size={18} 
        />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-[100] w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-3 border-b border-gray-50 bg-gray-50/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
              <input
                autoFocus
                type="text"
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500 transition-all"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={`px-4 py-3 text-sm font-semibold cursor-pointer transition-colors hover:bg-blue-50 ${value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  {option.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No results found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

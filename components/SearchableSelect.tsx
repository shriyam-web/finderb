'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  prefix?: React.ReactNode;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  tone?: 'default' | 'merchant';
  loading?: boolean;
}

function OptionLabel({ option }: { option: SelectOption }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      {option.prefix ? (
        <span className="flex shrink-0 items-center text-base leading-none">{option.prefix}</span>
      ) : null}
      <span className="truncate">{option.label}</span>
    </span>
  );
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  label,
  icon,
  disabled,
  tone = 'default',
  loading = false,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOption = options.find((opt) => opt.value === value);
  const isMerchant = tone === 'merchant';
  const isDisabled = disabled || loading;

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
    <div className="group relative space-y-2" ref={containerRef}>
      <label className={isMerchant ? 'merchant-auth-label' : 'ml-1 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400'}>
        {label}
      </label>
      <div
        className={`relative ${isDisabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
      >
        {icon ? (
          <div
            className={
              isMerchant
                ? 'pointer-events-none absolute left-4 top-1/2 z-[1] -translate-y-1/2 text-[#94a3b8] transition-colors group-focus-within:text-[#153551]'
                : 'absolute left-4 top-1/2 -translate-y-1/2 text-gray-300'
            }
          >
            {icon}
          </div>
        ) : null}
        <div
          className={
            isMerchant
              ? `merchant-auth-select-trigger flex min-h-[54px] w-full items-center py-3.5 pr-11 text-[15px] font-semibold text-[#0f273b] ${
                  icon ? 'pl-11' : 'pl-4'
                } ${isOpen ? 'merchant-auth-select-trigger-open' : ''}`
              : `flex min-h-[56px] w-full items-center rounded-2xl border border-gray-100 bg-gray-50 py-4 pr-10 text-sm font-semibold text-gray-900 ${
                  icon ? 'pl-11' : 'pl-4'
                } ${isOpen ? 'border-blue-600 bg-white ring-2 ring-blue-50' : ''}`
          }
        >
          {loading ? (
            <span className="font-normal text-[#94a3b8]">Loading…</span>
          ) : selectedOption ? (
            <OptionLabel option={selectedOption} />
          ) : (
            <span className={isMerchant ? 'font-normal text-[#94a3b8]' : 'font-normal text-gray-300'}>
              {placeholder}
            </span>
          )}
        </div>
        <ChevronDown
          className={`absolute right-4 top-1/2 -translate-y-1/2 transition-transform duration-200 ${
            isMerchant
              ? isOpen
                ? 'rotate-180 text-[#153551]'
                : 'text-[#94a3b8]'
              : isOpen
                ? 'rotate-180 text-blue-600'
                : 'text-gray-300'
          }`}
          size={18}
        />
      </div>

      {isOpen && !isDisabled && (
        <div
          className={`absolute z-[100] mt-2 w-full overflow-hidden border animate-in fade-in zoom-in-95 duration-200 ${
            isMerchant
              ? 'merchant-auth-select-menu rounded-[14px]'
              : 'rounded-2xl border-gray-100 bg-white shadow-2xl'
          }`}
        >
          <div className={`border-b p-3 ${isMerchant ? 'border-[#eef2f6] bg-[#f8fafc]' : 'border-gray-50 bg-gray-50/50'}`}>
            <div className="relative">
              <Search
                className={`absolute left-3 top-1/2 -translate-y-1/2 ${isMerchant ? 'text-[#94a3b8]' : 'text-gray-400'}`}
                size={14}
              />
              <input
                autoFocus
                type="text"
                className={
                  isMerchant
                    ? 'merchant-auth-select-search w-full py-2.5 pl-9 pr-4 text-xs font-medium text-[#0f273b] outline-none'
                    : 'w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-4 text-xs font-medium focus:border-blue-500 focus:outline-none'
                }
                placeholder="Search…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className={
                    isMerchant
                      ? `merchant-auth-select-option mx-1.5 cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium ${
                          value === option.value ? 'merchant-auth-select-option-active' : ''
                        }`
                      : `cursor-pointer px-4 py-3 text-sm font-semibold hover:bg-blue-50 ${
                          value === option.value ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`
                  }
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                    setSearch('');
                  }}
                >
                  <OptionLabel option={option} />
                </div>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <p className={isMerchant ? 'text-xs font-semibold text-[#94a3b8]' : 'text-xs font-bold text-gray-400'}>
                  No results found
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

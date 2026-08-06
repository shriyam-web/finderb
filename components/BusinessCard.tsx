'use client';

import Link from 'next/link';
import { Star, MapPin } from 'lucide-react';
import { Business } from '@/lib/mockData';
import { getBusinessOpenStatus } from '@/lib/businessHours';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { VerifiedNameTick } from '@/components/business/VerifiedMark';
import BusinessListingImage from '@/components/business/BusinessListingImage';

interface BusinessCardProps {
  business: Business;
  isPremium?: boolean;
  compact?: boolean;
  hidePriceRange?: boolean;
  /** Fixed-size carousel card (Recommended Merchants). */
  uniform?: boolean;
  /** Matches merchant profile page typography and spacing. */
  variant?: 'default' | 'profile';
  distanceLabel?: string | null;
}

function getShortDescription(business: Business): string {
  const text = business.description?.trim();
  if (text && text.length > 10 && text !== business.location) {
    return text;
  }
  return `Trusted ${business.category} services in your area.`;
}

export default function BusinessCard({
  business,
  isPremium = false,
  compact = false,
  hidePriceRange = false,
  uniform = false,
  variant = 'default',
  distanceLabel = null,
}: BusinessCardProps) {
  const showVerified = Boolean(
    isPremium || business.isFinderBVerified || business.hasVerifiedBadge
  );
  const openStatus = getBusinessOpenStatus(business.timings);
  const shortDescription = getShortDescription(business);

  if (variant === 'profile') {
    return (
      <Link
        href={getBusinessProfilePath(business)}
        className="group flex flex-col overflow-hidden rounded-lg border border-stone-200 bg-white transition-colors hover:border-stone-300"
      >
        <div className="relative h-28 w-full shrink-0 bg-stone-100">
          <BusinessListingImage
            business={business}
            alt={business.name || 'Business Image'}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 100vw, 50vw"
          />
          {(business.reviewsCount ?? 0) > 0 && business.rating != null ? (
            <div className="absolute right-2 top-2 flex items-center gap-0.5 rounded-md border border-stone-200/80 bg-white/95 px-1.5 py-0.5 text-[10px] font-semibold text-[#153551]">
              <Star size={10} className="fill-amber-500 text-amber-500" />
              {business.rating}
            </div>
          ) : null}
        </div>

        <div className="flex flex-col p-3">
          <p className="flex items-center gap-1 text-sm font-semibold leading-snug text-[#153551] group-hover:text-[#215481]">
            <span className="min-w-0 truncate">{business.name}</span>
            {showVerified ? <VerifiedNameTick size={13} className="shrink-0" /> : null}
          </p>

          {business.category ? (
            <p className="mt-0.5 line-clamp-1 text-xs text-stone-500">{business.category}</p>
          ) : null}

          {openStatus ? (
            <p
              className={`mt-1 line-clamp-1 text-[10px] font-medium ${
                openStatus.status === 'Open' ? 'text-emerald-700' : 'text-stone-500'
              }`}
            >
              {openStatus.label}
            </p>
          ) : null}

          <div className="mt-1.5 flex items-start gap-1 text-[11px] leading-snug text-stone-500">
            <MapPin size={11} className="mt-0.5 shrink-0 text-stone-400" />
            <span className="line-clamp-2">
              {distanceLabel ? (
                <>
                  <span className="font-medium text-[#215481]">{distanceLabel}</span>
                  <span className="text-stone-300"> · </span>
                </>
              ) : null}
              {business.location}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div
      className={`group relative flex h-full w-full flex-col overflow-hidden bg-white transition-all duration-500 border border-gray-100/50 hover:border-secondary/20 ${
        uniform ? 'rounded-none' : ''
      }`}
    >
      {/* Image Section */}
      <div
        className={`relative w-full shrink-0 ${
          uniform ? 'h-[108px] sm:h-[120px]' : compact ? 'h-40' : 'h-56'
        }`}
      >
        <BusinessListingImage
          business={business}
          alt={business.name || 'Business Image'}
          fill
          className="object-cover transition-transform duration-1000 group-hover:scale-105"
          sizes={uniform ? '300px' : '(max-width: 768px) 100vw, 50vw'}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

        {(business.reviewsCount ?? 0) > 0 && business.rating != null ? (
          <div
            className={`absolute ${compact ? 'top-2 right-2' : 'top-3 right-3'} z-10 flex items-center gap-1 rounded-lg border border-white/20 bg-white/95 px-2 py-0.5 shadow-md backdrop-blur-md`}
          >
            <Star className="fill-secondary text-secondary" size={compact || uniform ? 10 : 12} />
            <span className={`font-bold text-primary ${uniform ? 'text-[10px]' : compact ? 'text-[10px]' : 'text-xs'}`}>
              {business.rating}
            </span>
          </div>
        ) : null}
      </div>

      {/* Content Section */}
      <div
        className={`flex min-h-0 flex-1 flex-col ${
          uniform ? 'p-2.5 sm:p-3' : compact ? 'p-4' : 'p-6'
        }`}
      >
        {uniform ? (
          <>
            <div className="mb-1.5 flex items-center justify-between gap-1">
              <div className="flex min-w-0 items-center gap-1">
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${openStatus.dotClass}`} />
                <span className={`truncate text-[9px] font-bold leading-none ${openStatus.colorClass}`}>
                  {openStatus.label}
                </span>
              </div>
              <span
                className={`shrink-0 text-[9px] font-bold uppercase ${
                  openStatus.status === 'Open' ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {openStatus.status}
              </span>
            </div>

            <h3 className="mb-0.5 flex min-h-[2.25rem] items-start gap-1 text-sm font-extrabold leading-snug text-primary group-hover:text-secondary">
              <span className="line-clamp-2 min-w-0 flex-1">{business.name}</span>
              {showVerified && <VerifiedNameTick size={14} className="mt-0.5 shrink-0" />}
            </h3>

            <p className="mb-1.5 line-clamp-1 text-[9px] font-bold uppercase text-gray-400">
              {business.category}
            </p>

            <p className="mb-1.5 line-clamp-2 min-h-[1.75rem] text-[10px] leading-snug text-gray-500">
              {shortDescription}
            </p>

            <div className="mb-2 flex min-h-[1.75rem] items-start gap-1 text-[9px] font-semibold text-gray-500">
              <MapPin size={10} className="mt-0.5 shrink-0 text-secondary" />
              <span className="line-clamp-2 leading-snug">
                {distanceLabel ? (
                  <>
                    <span className="text-primary">{distanceLabel}</span>
                    <span className="text-gray-300"> · </span>
                  </>
                ) : null}
                {business.location}
              </span>
            </div>

            <div className="mt-auto border-t border-gray-100 pt-2">
              <Link
                href={getBusinessProfilePath(business)}
                className="flex w-full items-center justify-center rounded-lg bg-secondary py-2 text-[9px] font-bold uppercase text-white shadow-md transition-all hover:bg-primary active:scale-95 sm:text-[10px]"
              >
                Details
              </Link>
            </div>
          </>
        ) : (
          <>
            <h3
              className={`mb-1 flex items-center gap-1 font-extrabold leading-tight text-primary transition-colors group-hover:text-secondary ${
                compact ? 'text-base' : 'text-lg'
              }`}
            >
              <span className="min-w-0 truncate">{business.name}</span>
              {showVerified && <VerifiedNameTick size={compact ? 14 : 16} className="shrink-0" />}
            </h3>

            <p className={`font-bold uppercase text-gray-400 ${compact ? 'mb-3 text-[10px]' : 'mb-4 text-[10px]'}`}>
              {business.category}
            </p>

            {!compact && !hidePriceRange && (
              <p className="mb-6 line-clamp-2 flex-grow text-sm font-medium text-gray-500">
                {shortDescription}
              </p>
            )}

            <div
              className={`mb-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50 font-bold text-gray-500 transition-all group-hover:border-secondary/20 group-hover:bg-white ${
                compact ? 'p-2 text-[10px]' : 'p-3 text-[11px]'
              }`}
            >
              <MapPin size={compact ? 10 : 12} className="shrink-0 text-secondary" />
              <span className="line-clamp-1">
                {distanceLabel ? (
                  <>
                    <span className="text-primary">{distanceLabel}</span>
                    <span className="text-gray-300"> · </span>
                  </>
                ) : null}
                {business.location}
              </span>
            </div>

            <div
              className={`mt-auto flex items-center border-t border-gray-100 ${
                compact ? 'pt-3' : 'pt-4'
              } ${hidePriceRange ? 'justify-end' : 'justify-between'}`}
            >
              {!hidePriceRange && (
                <div className="flex flex-col">
                  <span className="mb-0.5 text-[8px] font-bold uppercase text-gray-400">Price Range</span>
                  <span className={`font-extrabold text-primary ${compact ? 'text-base' : 'text-lg'}`}>
                    {business.priceRange}
                  </span>
                </div>
              )}
              <Link
                href={getBusinessProfilePath(business)}
                className={`rounded-xl bg-secondary font-bold uppercase text-white shadow-md transition-all hover:bg-primary hover:shadow-lg hover:shadow-secondary/30 active:scale-95 ${
                  compact
                    ? 'px-4 py-2 text-[9px]'
                    : hidePriceRange
                      ? 'px-5 py-2.5 text-[10px]'
                      : 'px-6 py-3 text-[11px]'
                }`}
              >
                Details
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

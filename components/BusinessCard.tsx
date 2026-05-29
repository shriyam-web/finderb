import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ArrowRight, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { Business } from '@/lib/mockData';

interface BusinessCardProps {
  business: Business;
  isPremium?: boolean;
  compact?: boolean;
  hidePriceRange?: boolean;
}

export default function BusinessCard({
  business,
  isPremium = false,
  compact = false,
  hidePriceRange = false,
}: BusinessCardProps) {
  return (
    <div className={`group relative bg-white overflow-hidden transition-all duration-500 border border-gray-100/50 hover:border-secondary/20 flex flex-col h-full`}>
      {/* Image Section */}
      <div
        className={`relative w-full ${
          compact ? 'h-40' : hidePriceRange ? 'h-36 sm:h-56' : 'h-56'
        }`}
      >
       <Image
  src={
    business.profilePictureUrl ||
    business.image ||
    "/fallback.jpg"
  }
  alt={business.name || "Business Image"}
  fill
  className="object-cover transition-transform duration-1000 group-hover:scale-105"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
        
        {/* Badges */}
        <div className={`absolute ${compact ? 'top-2 left-2' : 'top-4 left-4'} flex flex-col gap-2 z-10`}>
          {isPremium && (
            <div className={`bg-gradient-to-r from-primary to-secondary text-white text-[8px] sm:text-[9px] font-bold ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-full shadow-lg flex items-center gap-1.5 border border-white/20 uppercase`}>
              <Star size={compact ? 8 : 10} fill="white" />
              Verified
            </div>
          )}
          {!compact && (
            <div className="bg-secondary text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20 uppercase">
              <Zap size={10} fill="white" />
              Available Now
            </div>
          )}
        </div>

        <div className={`absolute ${compact ? 'top-2 right-2' : 'top-4 right-4'} bg-white/95 backdrop-blur-md ${compact ? 'px-1.5 py-0.5' : 'px-2.5 py-1'} rounded-xl flex items-center gap-1 shadow-lg border border-white/20`}>
          <Star className="text-secondary fill-secondary" size={compact ? 10 : 12} />
          <span className={`${compact ? 'text-[10px]' : 'text-xs'} font-bold text-primary`}>{business.rating}</span>
        </div>

        {/* Trending Badge */}
        {!compact && (
          <div className="absolute bottom-4 left-4 flex items-center gap-1.5 text-white">
            <TrendingUp size={12} className="text-secondary" />
            <span className="text-[10px] font-bold uppercase drop-shadow-md">Trending in Delhi</span>
          </div>
        )}

        {/* Profile Picture Avatar Overlay */}
        {business.profilePictureUrl && (
          <div className={`absolute -bottom-8 right-6 z-[30]`}>
            <div className={`${compact ? 'w-14 h-14' : 'w-20 h-20'} rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white`}>
              <Image 
                src={business.profilePictureUrl} 
                alt={business.name} 
                width={80} 
                height={80} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-white shadow-sm flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div
        className={`flex flex-col flex-grow ${
          compact ? 'p-4' : hidePriceRange ? 'p-3 sm:p-6' : 'p-6'
        } ${business.profilePictureUrl ? (compact ? 'pt-8' : hidePriceRange ? 'pt-8 sm:pt-12' : 'pt-12') : ''}`}
      >
        <div className="flex justify-between items-start mb-1">
          <h3
            className={`font-extrabold text-primary group-hover:text-secondary transition-colors leading-tight line-clamp-1 ${
              compact ? 'text-base' : hidePriceRange ? 'text-sm sm:text-lg' : 'text-lg'
            } ${business.profilePictureUrl ? 'pr-12' : ''}`}
          >
            {business.name}
          </h3>
        </div>
        
        <p className={`text-[10px] ${compact ? 'mb-3' : 'mb-4'} text-gray-400 font-bold uppercase`}>
          {business.category}
        </p>
        
        {!compact && !hidePriceRange && (
          <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6 flex-grow">
            Top-rated {business.category.toLowerCase()} services with 100% satisfaction guarantee.
          </p>
        )}

        <div
          className={`flex items-center gap-2 text-gray-500 font-bold rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:border-secondary/20 transition-all ${
            compact
              ? 'text-[10px] mb-4 p-2'
              : hidePriceRange
                ? 'text-[10px] mb-3 p-2 sm:mb-6 sm:p-3 sm:text-[11px]'
                : 'text-[11px] mb-6 p-3'
          }`}
        >
          <MapPin size={compact ? 10 : 12} className="text-secondary" />
          <span className="line-clamp-1">{business.location}</span>
        </div>

        <div
          className={`flex items-center border-t border-gray-100 ${compact ? 'pt-3' : 'pt-4'} ${
            hidePriceRange ? 'justify-end' : 'justify-between'
          }`}
        >
          {!hidePriceRange && (
            <div className="flex flex-col">
              <span className="text-[8px] text-gray-400 font-bold uppercase mb-0.5">Price Range</span>
              <span className={`text-primary font-extrabold ${compact ? 'text-base' : 'text-lg'}`}>
                {business.priceRange}
              </span>
            </div>
          )}
          <Link
            href={`/business/${business.id}`}
            className={`bg-secondary hover:bg-primary text-white font-bold ${compact ? 'px-4 py-2 text-[9px]' : hidePriceRange ? 'px-5 py-2.5 text-[10px]' : 'px-6 py-3 text-[11px]'} rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-secondary/30 active:scale-95 uppercase`}
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

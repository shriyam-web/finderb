import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ArrowRight, Zap, TrendingUp, ShieldCheck } from 'lucide-react';
import { Business } from '@/lib/mockData';

interface BusinessCardProps {
  business: Business;
  isPremium?: boolean;
  compact?: boolean;
}

export default function BusinessCard({ business, isPremium = false, compact = false }: BusinessCardProps) {
  return (
    <div className={`group relative bg-white rounded-3xl overflow-hidden transition-all duration-500 shadow-soft hover:shadow-premium border border-gray-100/50 hover:border-secondary/20 flex flex-col h-full`}>
      {/* Image Section */}
      <div className={`relative ${compact ? 'h-40' : 'h-56'} w-full overflow-hidden`}>
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
            <div className={`bg-gradient-to-r from-primary to-secondary text-white text-[8px] sm:text-[9px] font-bold ${compact ? 'px-2 py-1' : 'px-3 py-1.5'} rounded-full shadow-lg flex items-center gap-1.5 border border-white/20 uppercase tracking-widest`}>
              <Star size={compact ? 8 : 10} fill="white" />
              Verified
            </div>
          )}
          {!compact && (
            <div className="bg-secondary text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20 uppercase tracking-widest">
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
            <span className="text-[10px] font-bold uppercase tracking-wider drop-shadow-md">Trending in Delhi</span>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className={`${compact ? 'p-4' : 'p-6'} flex flex-col flex-grow`}>
        <div className="flex justify-between items-start mb-1">
          <h3 className={`${compact ? 'text-base' : 'text-lg'} font-extrabold text-primary group-hover:text-secondary transition-colors tracking-tight leading-tight line-clamp-1`}>
            {business.name}
          </h3>
        </div>
        
        <p className={`text-[10px] ${compact ? 'mb-3' : 'mb-4'} text-gray-400 font-bold uppercase tracking-widest`}>
          {business.category}
        </p>
        
        {!compact && (
          <p className="text-sm text-gray-500 font-medium line-clamp-2 mb-6 flex-grow">
            Top-rated {business.category.toLowerCase()} services with 100% satisfaction guarantee.
          </p>
        )}

        <div className={`flex items-center gap-2 text-gray-500 ${compact ? 'text-[10px]' : 'text-[11px]'} font-bold ${compact ? 'mb-4 p-2' : 'mb-6 p-3'} rounded-xl bg-gray-50 border border-gray-100 group-hover:bg-white group-hover:border-secondary/20 transition-all`}>
          <MapPin size={compact ? 10 : 12} className="text-secondary" />
          <span className="line-clamp-1">{business.location}</span>
        </div>

        <div className={`flex items-center justify-between ${compact ? 'pt-3' : 'pt-4'} border-t border-gray-100`}>
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Price Range</span>
            <span className={`text-primary font-extrabold ${compact ? 'text-base' : 'text-lg'}`}>
              {business.priceRange}
            </span>
          </div>
          <Link 
            href={`/business/${business.id}`}
            className={`bg-secondary hover:bg-primary text-white font-bold ${compact ? 'px-4 py-2 text-[9px]' : 'px-6 py-3 text-[11px]'} rounded-xl transition-all shadow-md hover:shadow-lg hover:shadow-secondary/30 active:scale-95 uppercase tracking-widest`}
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

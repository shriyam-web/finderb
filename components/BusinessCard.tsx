import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Business } from '@/lib/mockData';

interface BusinessCardProps {
  business: Business;
  isPremium?: boolean;
}

export default function BusinessCard({ business, isPremium = false }: BusinessCardProps) {
  return (
    <div className={`group relative bg-white rounded-[2.5rem] overflow-hidden transition-all duration-700 ${
      isPremium 
        ? 'border-2 border-secondary/20 shadow-[0_20px_50px_rgba(0,186,242,0.1)] hover:shadow-secondary/20' 
        : 'border border-gray-100 hover:shadow-2xl'
    } hover:-translate-y-2`}>
      <div className="relative h-64 w-full overflow-hidden">
        <Image
          src={business.image}
          alt={business.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-1000 ease-out"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
        
        {isPremium && (
          <div className="absolute top-5 left-5 z-10">
            <div className="bg-secondary/90 backdrop-blur-md text-white text-[10px] font-bold px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 border border-white/20 uppercase tracking-widest">
              <Star size={12} fill="white" className="animate-pulse" />
              Premium
            </div>
          </div>
        )}

        <div className="absolute top-5 right-5 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-2xl flex items-center gap-1.5 shadow-lg border border-white/20">
          <Star className="text-yellow-400 fill-yellow-400" size={14} />
          <span className="text-xs font-bold text-primary">{business.rating}</span>
        </div>
      </div>

      <div className="p-8">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-2xl font-bold text-primary group-hover:text-secondary transition-colors tracking-tight leading-tight line-clamp-1">
            {business.name}
          </h3>
        </div>
        
        <div className="flex items-center gap-2 mb-6">
          <span className="px-3 py-1 bg-primary/5 text-secondary text-[10px] font-bold uppercase tracking-widest rounded-lg border border-secondary/10">
            {business.category}
          </span>
        </div>
        
        <div className="flex items-center gap-3 text-gray-500 text-xs font-medium mb-8 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 group-hover:bg-white group-hover:border-secondary/20 transition-all">
          <MapPin size={14} className="text-secondary" />
          <span className="line-clamp-1">{business.location}</span>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Starts From</span>
            <div className="flex items-baseline gap-1">
              <span className="text-primary font-black text-2xl tracking-tighter">
                {business.priceRange.split('-')[0]}
              </span>
            </div>
          </div>
          <Link 
            href={`/business/${business.id}`}
            className="flex items-center justify-center w-14 h-14 bg-primary text-white rounded-[1.25rem] hover:bg-secondary transition-all duration-500 hover:shadow-2xl hover:shadow-secondary/40 group-hover:rotate-6 active:scale-90"
          >
            <ArrowRight size={24} />
          </Link>
        </div>
      </div>
    </div>
  );
}

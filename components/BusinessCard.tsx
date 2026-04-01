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
    <div className={`bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all duration-500 group ${isPremium ? 'border-secondary/20 ring-1 ring-secondary/5' : 'border-gray-100/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)]'}`}>
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={business.image}
          alt={business.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60"></div>
        
        {isPremium && (
          <div className="absolute top-4 left-4 z-10">
            <div className="bg-gradient-to-r from-secondary to-blue-500 text-white text-[9px] font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 border border-white/20 uppercase tracking-wider">
              <Star size={10} fill="white" />
              Premium Partner
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
          <Star className="text-yellow-400 fill-yellow-400" size={14} />
          <span className="text-[11px] font-bold text-primary">{business.rating}</span>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-1.5">
          <h3 className="text-xl font-bold text-primary group-hover:text-secondary transition-colors tracking-tight leading-tight line-clamp-1">
            {business.name}
          </h3>
        </div>
        <p className="text-secondary text-[10px] font-bold uppercase tracking-widest mb-4">{business.category}</p>
        
        <div className="flex items-center gap-2.5 text-gray-500 text-[10px] font-medium mb-6 bg-gray-50/50 p-2.5 rounded-xl border border-gray-100/50">
          <MapPin size={12} className="text-secondary" />
          <span className="line-clamp-1">{business.location}</span>
        </div>

        <div className="flex items-center justify-between pt-5 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mb-0.5">EST. PRICE</span>
            <span className="text-primary font-bold text-xl tracking-tighter">
              {business.priceRange.split('-')[0]}
            </span>
          </div>
          <Link 
            href={`/business/${business.id}`}
            className="flex items-center justify-center w-12 h-12 bg-gray-50 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 hover:shadow-xl hover:shadow-primary/20 border border-gray-100/50"
          >
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}

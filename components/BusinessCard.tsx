import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Business } from '@/lib/mockData';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/50 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all duration-500 group">
      <div className="relative h-56 w-full overflow-hidden">
        <Image
          src={business.image}
          alt={business.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm border border-white/20">
          <Star className="text-yellow-400 fill-yellow-400" size={14} />
          <span className="text-[11px] font-black text-primary uppercase tracking-wider">{business.rating}</span>
        </div>
        <div className="absolute top-4 left-4">
           <div className="bg-secondary/90 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest shadow-lg">
             Verified
           </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-xl font-black text-primary group-hover:text-secondary transition-colors tracking-tight uppercase leading-tight">
            {business.name}
          </h3>
        </div>
        <p className="text-secondary text-[9px] font-black uppercase tracking-[0.2em] mb-4">{business.category}</p>
        
        <div className="flex items-center gap-2.5 text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-6 bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
          <MapPin size={12} className="text-secondary" />
          <span>{business.location}</span>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Starts From</span>
            <span className="text-primary font-black text-lg tracking-tighter">
              {business.priceRange.split('-')[0]}
            </span>
          </div>
          <Link 
            href={`/business/${business.id}`}
            className="flex items-center justify-center w-12 h-12 bg-gray-50 text-primary rounded-2xl hover:bg-primary hover:text-white transition-all duration-500 hover:shadow-lg hover:shadow-primary/20"
          >
            <ArrowRight size={20} />
          </Link>
        </div>
      </div>
    </div>
  );
}

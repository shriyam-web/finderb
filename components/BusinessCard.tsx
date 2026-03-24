import Link from 'next/link';
import Image from 'next/image';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { Business } from '@/lib/mockData';

interface BusinessCardProps {
  business: Business;
}

export default function BusinessCard({ business }: BusinessCardProps) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all group">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={business.image}
          alt={business.name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm">
          <Star className="text-yellow-400 fill-yellow-400" size={16} />
          <span className="text-sm font-bold text-gray-800">{business.rating}</span>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
            {business.name}
          </h3>
        </div>
        <p className="text-blue-600 text-sm font-semibold mb-3">{business.category}</p>
        <div className="flex items-center gap-2 text-gray-500 text-sm mb-4">
          <MapPin size={16} />
          <span>{business.location}</span>
        </div>
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <span className="text-gray-900 font-bold">{business.priceRange.split('-')[0]} <span className="text-xs text-gray-500 font-normal">starts from</span></span>
          <Link 
            href={`/business/${business.id}`}
            className="flex items-center gap-1 text-blue-600 font-bold text-sm hover:gap-2 transition-all"
          >
            View Details
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}

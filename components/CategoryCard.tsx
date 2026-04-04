import Link from 'next/link';
import * as LucideIcons from 'lucide-react';
import { Category } from '@/lib/mockData';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // @ts-ignore
  const IconComponent = LucideIcons[category.icon] || LucideIcons.HelpCircle;

  return (
    <Link 
      href={`/categories/${category.slug}`}
      className="relative group bg-white p-6 rounded-2xl shadow-soft hover:shadow-premium transition-all duration-500 flex flex-col items-center text-center border border-gray-50 hover:border-secondary/20 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-gradient-to-br group-hover:from-secondary group-hover:to-purple-600 group-hover:text-white transition-all duration-500 mb-5 shadow-sm group-hover:shadow-lg group-hover:shadow-secondary/30">
        <IconComponent size={28} strokeWidth={1.5} />
      </div>
      
      <h3 className="relative text-sm font-bold text-primary group-hover:text-secondary transition-colors leading-tight mb-2">
        {category.name}
      </h3>
      
      <p className="relative text-[10px] font-bold text-gray-400 group-hover:text-gray-600 transition-colors uppercase tracking-widest">
        {category.businessCount}+ Pros
      </p>

      <div className="relative mt-4 flex items-center gap-2 text-secondary font-bold text-[10px] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 uppercase tracking-widest">
        Top providers <LucideIcons.ArrowRight size={10} />
      </div>
    </Link>
  );
}

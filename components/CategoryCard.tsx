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
      className="bg-white p-8 border-r border-b border-gray-100 hover:bg-white hover:z-10 hover:shadow-[0_0_50px_-12px_rgba(0,0,0,0.12)] transition-all duration-500 group flex flex-col items-center text-center first:border-l last:border-r sm:border-l-0"
    >
      <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all duration-500 mb-5 shadow-sm group-hover:shadow-lg group-hover:shadow-secondary/30">
        <IconComponent size={24} />
      </div>
      <h3 className="text-[11px] font-black text-primary group-hover:text-secondary transition-colors uppercase tracking-[0.2em] leading-tight">
        {category.name}
      </h3>
      <div className="mt-3 flex items-center gap-2">
        <span className="h-px w-3 bg-gray-100 group-hover:bg-secondary/30 transition-colors"></span>
        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-gray-600 transition-colors">
          {category.businessCount}+ Pros
        </p>
        <span className="h-px w-3 bg-gray-100 group-hover:bg-secondary/30 transition-colors"></span>
      </div>
    </Link>
  );
}

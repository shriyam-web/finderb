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
      className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-blue-100 transition-all group flex flex-col items-center text-center"
    >
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 mb-4">
        <IconComponent size={32} />
      </div>
      <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
        {category.name}
      </h3>
      <p className="text-gray-500 text-sm mt-1">Explore Services</p>
    </Link>
  );
}

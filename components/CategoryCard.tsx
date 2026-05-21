import Link from 'next/link';
import Image from 'next/image';
import * as LucideIcons from 'lucide-react';
import { Category } from '@/lib/mockData';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const isImageUrl = category.icon?.startsWith('http') || category.icon?.startsWith('/');
  
  // @ts-ignore
  const IconComponent = !isImageUrl ? (LucideIcons[category.icon] || LucideIcons.Grid) : null;
  const categoryColor = category.color || '#4f46e5'; // Default to indigo if no color

  return (
    <Link 
      href={`/categories?id=${category.id}`}
      className="relative group bg-white p-2 sm:p-6 rounded-xl sm:rounded-[2rem] shadow-soft hover:shadow-2xl transition-all duration-500 flex flex-col items-center text-center border border-gray-50 hover:border-transparent overflow-hidden"
    >
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500"
        style={{ backgroundColor: categoryColor }}
      ></div>
      
      <div className="relative w-10 h-10 sm:w-24 sm:h-24 mb-2 sm:mb-8 flex items-center justify-center group-hover:-translate-y-3 transition-transform duration-500 [perspective:1000px]">
        {/* 3D Base/Block */}
        <div 
          className="absolute inset-0 rounded-xl sm:rounded-[2.5rem] transition-all duration-500 transform group-hover:rotate-x-12 group-hover:rotate-y-12 shadow-[0_4px_0_0_rgba(0,0,0,0.05),0_8px_16px_-4px_rgba(0,0,0,0.1)] group-hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.2)]"
          style={{ 
            backgroundColor: 'white',
            border: `1px solid ${categoryColor}15`
          }}
        >
          {/* 3D Side shadow */}
          <div 
            className="absolute bottom-[-6px] left-[5%] right-[5%] h-4 rounded-full opacity-0 group-hover:opacity-20 blur-md transition-all duration-500"
            style={{ backgroundColor: categoryColor }}
          ></div>
        </div>
        
        {/* Colorful Gradient Ring */}
        <div 
          className="absolute inset-0 rounded-2xl sm:rounded-[2.5rem] opacity-20 group-hover:opacity-100 transition-all duration-500 scale-90 group-hover:scale-105"
          style={{ 
            background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}05)`,
            border: `2px solid ${categoryColor}10`
          }}
        ></div>
        
        {/* Inner Colorful Glow */}
        <div 
          className="absolute inset-3 rounded-xl sm:rounded-[2rem] opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500"
          style={{ backgroundColor: categoryColor }}
        ></div>

        <div 
          className="relative z-20 transition-all duration-500 transform group-hover:scale-125 group-hover:rotate-3 drop-shadow-[0_4px_6px_rgba(0,0,0,0.1)] flex items-center justify-center w-full h-full p-1.5 sm:p-6"
          style={{ color: categoryColor }}
        >
          {isImageUrl ? (
            <div className="relative w-full h-full">
              <Image
                src={category.icon}
                alt={category.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            IconComponent && <IconComponent size={16} className="sm:size-[42px]" strokeWidth={1.8} />
          )}
        </div>

        {/* Floating Accent Dots */}
        <div className="absolute -top-1 -right-1 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100" style={{ backgroundColor: categoryColor }}></div>
        <div className="absolute -bottom-1 -left-1 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200" style={{ backgroundColor: categoryColor }}></div>
      </div>
      
      <h3 
        className="relative text-[8px] sm:text-base font-black transition-all duration-300 leading-tight mb-0.5 sm:mb-2 group-hover:scale-105 text-slate-800 group-hover:text-primary"
        style={{ 
          color: '#1e293b',
          // Use a fallback for group-hover color since Tailwind group-hover might not pick up dynamic style
        }}
      >
        <span className="group-hover:opacity-100 transition-all" style={{ color: 'inherit' }}>
          {category.name}
        </span>
      </h3>
    </Link>
  );
}

import Link from 'next/link';
import CategoryIcon from '@/components/CategoryIcon';
import { Category } from '@/lib/mockData';

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const categoryColor = category.color || '#4f46e5';

  return (
    <Link 
      href={`/categories?id=${category.id}`}
      className="relative group bg-white p-2 sm:p-6 rounded-xl sm:rounded-[2rem] transition-all duration-500 flex flex-col items-center text-center border border-gray-50 hover:border-transparent overflow-hidden"
    >
      {/* Dynamic Background Glow */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-[0.05] transition-opacity duration-500"
        style={{ backgroundColor: categoryColor }}
      ></div>
      
      <div className="relative w-10 h-10 sm:w-24 sm:h-24 mb-2 sm:mb-8 flex items-center justify-center group-hover:-translate-y-3 transition-transform duration-500 [perspective:1000px]">
        {/* 3D Base/Block */}
        <div 
          className="absolute inset-0 rounded-xl sm:rounded-[2.5rem] transition-all duration-500 transform group-hover:rotate-x-12 group-hover:rotate-y-12"
          style={{ 
            backgroundColor: 'white',
            border: `1px solid ${categoryColor}15`
          }}
        >

        </div>
        
        {/* Colorful Gradient Ring */}
        <div 
          className="absolute inset-0 rounded-2xl sm:rounded-[2.5rem] opacity-20 group-hover:opacity-100 transition-all duration-500 scale-100"
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
          className="relative z-20 transition-all duration-500 transform group-hover:rotate-3 flex items-center justify-center w-full h-full"
          style={{ color: categoryColor }}
        >
          <CategoryIcon
            icon={category.icon}
            name={category.name}
            size={40}
            className="sm:w-24 sm:h-24 w-10 h-10"
            imageClassName="object-cover"
          />
        </div>

        {/* Floating Accent Dots */}
        <div className="absolute -top-1 -right-1 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-100" style={{ backgroundColor: categoryColor }}></div>
        <div className="absolute -bottom-1 -left-1 w-1 h-1 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-500 delay-200" style={{ backgroundColor: categoryColor }}></div>
      </div>
      
      <h3 
        className="relative text-[8px] sm:text-base font-black transition-all duration-300 leading-tight mb-0.5 sm:mb-2 text-slate-800 group-hover:text-primary"
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

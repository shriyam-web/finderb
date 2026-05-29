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
      className="group relative flex flex-col items-center rounded-2xl border border-gray-100 bg-white px-1 py-2.5 text-center shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-md sm:rounded-[2rem] sm:border-gray-50 sm:p-6 sm:shadow-none sm:hover:border-transparent sm:hover:shadow-lg"
    >
      {/* Mobile — icon + label only (no nested icon box) */}
      <div className="flex w-full flex-col items-center gap-1.5 sm:hidden">
        <CategoryIcon
          icon={category.icon}
          name={category.name}
          size={52}
          className="h-14 w-14 text-slate-600 group-hover:text-primary"
          imageClassName="object-contain"
        />
        <h3 className="line-clamp-2 w-full px-0.5 text-[10px] font-semibold leading-snug text-slate-700 group-hover:text-primary">
          {category.name}
        </h3>
      </div>

      {/* Tablet+ — richer card */}
      <div className="hidden w-full flex-col items-center sm:flex">
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-[0.05]"
          style={{ backgroundColor: categoryColor }}
        />

        <div className="relative mb-8 flex h-24 w-24 items-center justify-center transition-transform duration-500 [perspective:1000px] group-hover:-translate-y-3">
          <div
            className="absolute inset-0 rounded-[2.5rem] transition-all duration-500 group-hover:rotate-x-12 group-hover:rotate-y-12"
            style={{
              backgroundColor: 'white',
              border: `1px solid ${categoryColor}15`,
            }}
          />
          <div
            className="absolute inset-0 scale-100 rounded-[2.5rem] opacity-20 transition-all duration-500 group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, ${categoryColor}20, ${categoryColor}05)`,
              border: `2px solid ${categoryColor}10`,
            }}
          />
          <div
            className="absolute inset-3 rounded-[2rem] opacity-0 blur-xl transition-all duration-500 group-hover:opacity-30"
            style={{ backgroundColor: categoryColor }}
          />

          <div
            className="relative z-20 flex h-full w-full items-center justify-center transition-all duration-500 group-hover:rotate-3"
            style={{ color: categoryColor }}
          >
            <CategoryIcon
              icon={category.icon}
              name={category.name}
              size={96}
              className="h-24 w-24"
              imageClassName="object-contain"
            />
          </div>
        </div>

        <h3 className="relative text-base font-black leading-tight text-slate-800 transition-colors group-hover:text-primary">
          {category.name}
        </h3>
      </div>
    </Link>
  );
}

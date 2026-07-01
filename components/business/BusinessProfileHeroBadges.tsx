import { Flame } from 'lucide-react';

type BusinessProfileHeroBadgesProps = {
  category: string;
};

export default function BusinessProfileHeroBadges({ category }: BusinessProfileHeroBadgesProps) {
  const categoryLabel = category.trim() || 'this category';

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
      <span className="inline-flex items-center gap-1 text-xs font-medium leading-tight text-stone-700">
        <Flame size={12} className="animate-fire-flicker shrink-0 text-orange-500" />
        Trending in {categoryLabel}
      </span>
    </div>
  );
}

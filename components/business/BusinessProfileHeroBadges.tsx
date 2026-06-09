import { Flame } from 'lucide-react';

type BusinessProfileHeroBadgesProps = {
  category: string;
  isVerified: boolean;
};

export default function BusinessProfileHeroBadges({
  category,
  isVerified,
}: BusinessProfileHeroBadgesProps) {
  const categoryLabel = category.trim() || 'this category';

  return (
    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
      <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-700">
        <Flame size={12} className="animate-fire-flicker shrink-0 text-orange-500" />
        Trending in {categoryLabel}
      </span>

      {isVerified && (
        <span className="text-xs text-stone-500">· Verified on FinderB</span>
      )}
    </div>
  );
}

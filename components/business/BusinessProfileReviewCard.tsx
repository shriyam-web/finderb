import { Star } from 'lucide-react';

type BusinessProfileReviewCardProps = {
  displayRating: number | null;
  reviewCount: number;
};

export default function BusinessProfileReviewCard({
  displayRating,
  reviewCount,
}: BusinessProfileReviewCardProps) {
  return (
    <div className="rounded-lg border border-stone-200/80 bg-white px-3.5 py-2">
      {displayRating != null ? (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star size={16} className="fill-amber-500 text-amber-500" />
            <span className="text-lg font-semibold text-[#153551]">{displayRating}</span>
          </div>
          <span className="text-sm text-stone-500">
            {reviewCount} {reviewCount === 1 ? 'review' : 'reviews'}
          </span>
        </div>
      ) : (
        <p className="text-sm text-stone-600">No reviews yet</p>
      )}
    </div>
  );
}

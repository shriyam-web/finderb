import { Star } from 'lucide-react';

type MerchantListingRatingProps = {
  rating: number | null | undefined;
  reviewCount: number | null | undefined;
  starSize?: number;
  textClassName?: string;
  emptyClassName?: string;
};

export default function MerchantListingRating({
  rating,
  reviewCount,
  starSize = 11,
  textClassName = 'text-[12px] font-medium text-[#475569]',
  emptyClassName = 'text-[12px] text-[#94a3b8]',
}: MerchantListingRatingProps) {
  const count = reviewCount ?? 0;
  const displayRating = count > 0 && rating != null ? rating : null;

  if (displayRating == null) {
    return <span className={emptyClassName}>No reviews yet</span>;
  }

  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={starSize}
            className={
              star <= Math.round(displayRating)
                ? 'fill-amber-400 text-amber-400'
                : 'fill-gray-200 text-gray-200'
            }
          />
        ))}
      </div>
      <span className={textClassName}>
        {displayRating}{' '}
        <span className="font-normal text-[#94a3b8]">({count})</span>
      </span>
    </div>
  );
}

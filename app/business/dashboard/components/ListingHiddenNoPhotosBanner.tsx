'use client';

type ListingHiddenNoPhotosBannerProps = {
  onAddPhotos: () => void;
};

export default function ListingHiddenNoPhotosBanner({
  onAddPhotos,
}: ListingHiddenNoPhotosBannerProps) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-950">
      <p className="font-semibold">Your listing is hidden from the public</p>
      <p className="mt-1 leading-relaxed text-rose-900/90">
        FinderB does not show businesses with zero photos in search, categories, homepage, or public
        profile pages. Add at least one photo to make your listing visible again.
      </p>
      <button
        type="button"
        onClick={onAddPhotos}
        className="mt-3 inline-flex items-center rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-800"
      >
        Add photos
      </button>
    </div>
  );
}

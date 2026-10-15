'use client';

type ListingHiddenNoPhotosBannerProps = {
  onAddPhotos: () => void;
};

export default function ListingHiddenNoPhotosBanner({
  onAddPhotos,
}: ListingHiddenNoPhotosBannerProps) {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl border border-rose-300/80 bg-gradient-to-br from-[#FFE0D6] via-[#FFB199] to-[#FF7A59] px-4 py-3 text-sm text-rose-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
      <div className="pointer-events-none absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/25" />
      <div className="pointer-events-none absolute bottom-[-20px] left-10 h-16 w-40 -rotate-6 rounded-full bg-white/20" />
      <div className="relative">
        <p className="font-semibold">Your listing is hidden from the public</p>
        <p className="mt-1 leading-relaxed text-rose-950/80">
          FinderB does not show businesses with zero photos in search, categories, homepage, or public
          profile pages. Add at least one photo to make your listing visible again.
        </p>
        <button
          type="button"
          onClick={onAddPhotos}
          className="mt-3 inline-flex items-center rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-zinc-700"
        >
          Add photos
        </button>
      </div>
    </div>
  );
}

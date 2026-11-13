'use client';

import { HiOutlinePhoto } from 'react-icons/hi2';

const PHOTO_GOAL = 5;

export default function MorePhotosBanner({
  photoCount,
  onAddPhotos,
}: {
  photoCount: number;
  onAddPhotos: () => void;
}) {
  const left = Math.max(0, PHOTO_GOAL - photoCount);

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#E8F1FF] via-[#A9C7F5] to-[#6B9AE8] px-3 py-2.5 text-blue-950">
      <div className="pointer-events-none absolute -right-6 -top-8 h-24 w-24 rounded-full bg-white/30" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-blue-900/80">Shop photos</p>
          <h3 className="text-[13px] font-medium leading-snug text-blue-950">
            {left === 1 ? 'Add 1 more photo' : `Add ${left} more photos`}
          </h3>
          <p className="mt-0.5 text-[11px] leading-snug text-blue-950/75">
            You have {photoCount} of {PHOTO_GOAL}. A full set helps people trust the shop before they call.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddPhotos}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#1E40AF] px-2.5 py-1.5 text-xs font-medium text-white hover:bg-[#1E3A8A]"
        >
          <HiOutlinePhoto size={14} />
          Add photos
        </button>
      </div>
    </div>
  );
}

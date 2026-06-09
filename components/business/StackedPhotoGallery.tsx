'use client';

import Image from 'next/image';
import { Building2 } from 'lucide-react';

const STACK_OFFSETS = [
  { x: 0, y: 0, rotate: 0, z: 30 },
  { x: 10, y: -8, rotate: 3, z: 20 },
  { x: -8, y: -14, rotate: -3.5, z: 10 },
  { x: 6, y: -20, rotate: 2, z: 0 },
] as const;

type StackedPhotoGalleryProps = {
  images: string[];
  alt: string;
  activeIndex: number;
  onSelect: (index: number) => void;
};

export default function StackedPhotoGallery({
  images,
  alt,
  activeIndex,
  onSelect,
}: StackedPhotoGalleryProps) {
  if (images.length === 0) {
    return (
      <div className="flex aspect-[16/10] max-h-[220px] items-center justify-center rounded-lg border border-dashed border-stone-200 bg-[#fffdf8] sm:max-h-[240px]">
        <div className="text-center">
          <Building2 className="mx-auto text-stone-300" size={36} />
          <p className="mt-2 text-sm text-stone-400">No photos yet</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="relative aspect-[16/10] max-h-[220px] overflow-hidden rounded-lg border border-stone-200 bg-stone-100 sm:max-h-[240px]">
        <Image src={images[0]} alt={alt} fill className="object-cover" priority sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
    );
  }

  const orderedIndices = [
    activeIndex,
    ...images.map((_, index) => index).filter((index) => index !== activeIndex),
  ].slice(0, 4);

  return (
    <div className="space-y-3">
      <div className="relative mx-auto aspect-[16/10] max-h-[220px] w-full max-w-xl sm:max-h-[240px]">
        {orderedIndices.map((imageIndex, stackPosition) => {
          const offset = STACK_OFFSETS[stackPosition] ?? STACK_OFFSETS[3];
          const isTop = stackPosition === 0;

          return (
            <button
              key={`${images[imageIndex]}-${imageIndex}`}
              type="button"
              onClick={() => onSelect(imageIndex)}
              className={`absolute left-1/2 top-1/2 h-[90%] w-[82%] overflow-hidden rounded-lg border border-stone-200 bg-white ${
                isTop ? 'cursor-default' : 'cursor-pointer opacity-95 hover:opacity-100'
              }`}
              style={{
                zIndex: offset.z,
                transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) rotate(${offset.rotate}deg)`,
              }}
              aria-label={isTop ? `Photo ${imageIndex + 1} of ${images.length}` : `View photo ${imageIndex + 1}`}
              aria-current={isTop}
            >
              <Image
                src={images[imageIndex]}
                alt={`${alt} photo ${imageIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 90vw, 420px"
                priority={isTop}
              />
            </button>
          );
        })}

        <span className="absolute bottom-2 right-2 z-40 border border-stone-200 bg-white px-2 py-0.5 text-[11px] font-medium text-stone-600">
          {activeIndex + 1}/{images.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {images.map((src, index) => (
          <button
            key={`${src}-thumb-${index}`}
            type="button"
            onClick={() => onSelect(index)}
            className={`relative h-11 w-11 overflow-hidden border ${
              activeIndex === index ? 'border-[#215481]' : 'border-stone-200 opacity-60 hover:opacity-100'
            }`}
            aria-label={`Show photo ${index + 1}`}
          >
            <Image src={src} alt="" fill className="object-cover" sizes="44px" />
          </button>
        ))}
      </div>
    </div>
  );
}

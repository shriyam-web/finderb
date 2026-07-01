'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Building2, ChevronLeft, ChevronRight, X } from 'lucide-react';

const GALLERY_HEIGHT_CLASS =
  'h-[190px] sm:h-[210px] md:h-[265px] lg:h-[300px]';

const MAX_SIDE_THUMBNAILS = 2;

type StackedPhotoGalleryProps = {
  images: string[];
  alt: string;
  activeIndex: number;
  onSelect: (index: number) => void;
};

function PhotoLightbox({
  images,
  alt,
  startIndex,
  onClose,
  onIndexChange,
}: {
  images: string[];
  alt: string;
  startIndex: number;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}) {
  const [index, setIndex] = useState(startIndex);

  const setGalleryIndex = useCallback(
    (nextIndex: number) => {
      setIndex(nextIndex);
      onIndexChange?.(nextIndex);
    },
    [onIndexChange],
  );

  useEffect(() => {
    setIndex(startIndex);
  }, [startIndex]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const goPrev = useCallback(() => {
    setGalleryIndex((index - 1 + images.length) % images.length);
  }, [images.length, index, setGalleryIndex]);

  const goNext = useCallback(() => {
    setGalleryIndex((index + 1) % images.length);
  }, [images.length, index, setGalleryIndex]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') goPrev();
      if (event.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [goNext, goPrev, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
        aria-label="Close gallery"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:left-5"
            aria-label="Previous photo"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 sm:right-5"
            aria-label="Next photo"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div
        className="relative flex h-full max-h-[min(82vh,720px)] w-full max-w-5xl flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          <Image
            src={images[index]}
            alt={`${alt} photo ${index + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
        <p className="mt-3 text-sm font-medium text-white/80">
          {index + 1} / {images.length}
        </p>

        {images.length > 1 && (
          <div className="mt-3 flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
            {images.map((src, thumbIndex) => (
              <button
                key={`${src}-lightbox-${thumbIndex}`}
                type="button"
                onClick={() => setGalleryIndex(thumbIndex)}
                className={`relative h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                  thumbIndex === index ? 'border-white' : 'border-white/25 hover:border-white/60'
                }`}
                aria-label={`View photo ${thumbIndex + 1}`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="56px" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StackedPhotoGallery({
  images,
  alt,
  activeIndex,
  onSelect,
}: StackedPhotoGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (index: number) => {
    onSelect(index);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  if (images.length === 0) {
    return (
      <div
        className={`flex ${GALLERY_HEIGHT_CLASS} items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50`}
      >
        <div className="text-center">
          <Building2 className="mx-auto text-stone-300" size={32} />
          <p className="mt-2 text-sm text-stone-400">No photos yet</p>
        </div>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <>
        <button
          type="button"
          onClick={() => openLightbox(0)}
          className={`relative block w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100 ${GALLERY_HEIGHT_CLASS}`}
          aria-label="View photo"
        >
          <Image
            src={images[0]}
            alt={alt}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 480px"
          />
        </button>
        {lightboxOpen ? (
          <PhotoLightbox
            images={images}
            alt={alt}
            startIndex={lightboxIndex}
            onClose={() => setLightboxOpen(false)}
            onIndexChange={onSelect}
          />
        ) : null}
      </>
    );
  }

  const sideIndices = images.map((_, index) => index).filter((index) => index !== activeIndex);
  const visibleSideIndices = sideIndices.slice(0, MAX_SIDE_THUMBNAILS);
  const hiddenSideCount = sideIndices.length - visibleSideIndices.length;

  return (
    <>
      <div className={`flex gap-2 ${GALLERY_HEIGHT_CLASS}`}>
        <button
          type="button"
          onClick={() => openLightbox(activeIndex)}
          className="relative w-[70%] shrink-0 overflow-hidden rounded-lg border border-stone-200 bg-stone-100"
          aria-label={`View photo ${activeIndex + 1} of ${images.length}`}
        >
          <Image
            src={images[activeIndex]}
            alt={`${alt} photo ${activeIndex + 1}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 70vw, (max-width: 1280px) 35vw, 400px"
          />
          <span className="absolute bottom-2 right-2 border border-stone-200 bg-white/95 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            {activeIndex + 1}/{images.length}
          </span>
        </button>

        <div className="flex h-full w-[30%] min-w-0 flex-col gap-1.5 overflow-hidden">
          {visibleSideIndices.map((index) => (
            <button
              key={`${images[index]}-side-${index}`}
              type="button"
              onClick={() => openLightbox(index)}
              className="relative min-h-0 w-full flex-1 overflow-hidden rounded-md border border-stone-200 bg-stone-100 opacity-90 hover:opacity-100"
              aria-label={`View photo ${index + 1}`}
            >
              <Image
                src={images[index]}
                alt={`${alt} thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="120px"
              />
            </button>
          ))}

          {hiddenSideCount > 0 ? (
            <button
              type="button"
              onClick={() => openLightbox(sideIndices[MAX_SIDE_THUMBNAILS])}
              className="relative flex min-h-0 w-full flex-1 items-center justify-center overflow-hidden rounded-md border border-stone-200 bg-stone-200/80 text-sm font-semibold text-stone-700 hover:bg-stone-300/80"
              aria-label={`View ${hiddenSideCount} more photos`}
            >
              +{hiddenSideCount}
            </button>
          ) : null}
        </div>
      </div>

      {lightboxOpen ? (
        <PhotoLightbox
          images={images}
          alt={alt}
          startIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={onSelect}
        />
      ) : null}
    </>
  );
}

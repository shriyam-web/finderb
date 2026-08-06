'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { Building2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { BUSINESS_IMAGE_FALLBACK } from '@/lib/businessMapping';

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
  const [mounted, setMounted] = useState(false);

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
    setMounted(true);
  }, []);

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

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Photo gallery"
      onClick={onClose}
    >
      <div className="absolute left-4 right-4 top-4 z-20 flex items-center justify-between">
        {images.length > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goPrev();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Previous photo"
          >
            <ChevronLeft size={22} />
          </button>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
          aria-label="Close gallery"
        >
          <X size={20} />
        </button>

        {images.length > 1 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              goNext();
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label="Next photo"
          >
            <ChevronRight size={22} />
          </button>
        ) : (
          <span />
        )}
      </div>

      <div
        className="relative flex h-full max-h-[min(82vh,720px)] w-full max-w-5xl flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-full w-full overflow-hidden rounded-lg">
          <Image
            src={images[index] || BUSINESS_IMAGE_FALLBACK}
            alt={`${alt} photo ${index + 1}`}
            fill
            className="object-contain"
            sizes="100vw"
            priority
          />
        </div>
        
      </div>
    </div>
  , document.body);
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
      <div className="flex aspect-[2/1] w-full items-center justify-center rounded-lg border border-dashed border-stone-200 bg-stone-50">
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
          className="relative block aspect-[2/1] w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100"
          aria-label="View photo"
        >
          <Image
            src={images[0] || BUSINESS_IMAGE_FALLBACK}
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

  // Keep overall gallery height aligned with the single-photo `aspect-[2/1]` frame.
  const sideIndices = images.map((_, index) => index).filter((index) => index !== activeIndex);
  const visibleSideIndices = sideIndices.slice(0, MAX_SIDE_THUMBNAILS);
  const hiddenSideCount = sideIndices.length - visibleSideIndices.length;

  return (
    <>
      <div className="grid w-full aspect-[2/1] grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => openLightbox(activeIndex)}
          className="relative h-full min-h-0 w-full overflow-hidden rounded-lg border border-stone-200 bg-stone-100"
          aria-label={`View photo ${activeIndex + 1} of ${images.length}`}
        >
          <Image
            src={images[activeIndex] || BUSINESS_IMAGE_FALLBACK}
            alt={`${alt} photo ${activeIndex + 1}`}
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 50vw, (max-width: 1280px) 25vw, 360px"
          />
          <span className="absolute bottom-2 right-2 border border-stone-200 bg-white/95 px-2 py-0.5 text-[11px] font-medium text-stone-600">
            {activeIndex + 1}/{images.length}
          </span>
        </button>

        <div className="flex h-full min-h-0 flex-col gap-1.5">
          {visibleSideIndices.map((index, thumbIndex) => {
            const isLastThumb = thumbIndex === visibleSideIndices.length - 1;
            const showMoreOverlay = isLastThumb && hiddenSideCount > 0;

            return (
              <button
                key={`${images[index]}-side-${index}`}
                type="button"
                onClick={() => openLightbox(index)}
                className="relative min-h-0 w-full flex-1 overflow-hidden rounded-md border border-stone-200 bg-stone-100 opacity-90 hover:opacity-100"
                aria-label={
                  showMoreOverlay
                    ? `View ${hiddenSideCount} more photos`
                    : `View photo ${index + 1}`
                }
              >
                <Image
                  src={images[index] || BUSINESS_IMAGE_FALLBACK}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 25vw, 180px"
                />
                {showMoreOverlay ? (
                  <>
                    <div
                      className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/15"
                      aria-hidden
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-base font-semibold text-white">
                      +{hiddenSideCount}
                    </span>
                  </>
                ) : null}
              </button>
            );
          })}
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

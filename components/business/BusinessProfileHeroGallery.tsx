'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type Ref } from 'react';
import Image from 'next/image';
import { ChevronLeft, Heart, Images, Share2 } from 'lucide-react';
import { BUSINESS_IMAGE_FALLBACK } from '@/lib/businessMapping';
import { PhotoLightbox } from '@/components/business/StackedPhotoGallery';

type BusinessProfileHeroGalleryProps = {
  images: string[];
  alt: string;
  saved: boolean;
  onBack: () => void;
  onShare: () => void;
  onSave: () => void;
};

export type BusinessProfileHeroGalleryHandle = {
  openPhoto: (index?: number) => void;
};

const BusinessProfileHeroGallery = forwardRef(function BusinessProfileHeroGallery(
  { images, alt, saved, onBack, onShare, onSave }: BusinessProfileHeroGalleryProps,
  ref: Ref<BusinessProfileHeroGalleryHandle>
) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const photos = images.length > 0 ? images : [];

  useImperativeHandle(ref, () => ({
    openPhoto: (photoIndex = 0) => {
      if (!photos.length) return;
      const next = Math.max(0, Math.min(photoIndex, photos.length - 1));
      setIndex(next);
      setLightboxOpen(true);
    },
  }));

  useEffect(() => {
    setIndex(0);
    scrollerRef.current?.scrollTo({ left: 0 });
  }, [photos[0]]);

  useEffect(() => {
    if (photos.length <= 1 || lightboxOpen) return;
    const timer = window.setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % photos.length;
        const node = scrollerRef.current;
        if (node) {
          node.scrollTo({ left: next * node.clientWidth, behavior: 'smooth' });
        }
        return next;
      });
    }, 5000);
    return () => window.clearInterval(timer);
  }, [photos.length, lightboxOpen]);

  const onScroll = () => {
    const node = scrollerRef.current;
    if (!node) return;
    const next = Math.round(node.scrollLeft / Math.max(1, node.clientWidth));
    setIndex(Math.max(0, Math.min(next, photos.length - 1)));
  };

  return (
    <div className="relative h-[min(63.8vw,26rem)] w-full overflow-hidden bg-[#0c0a09] lg:h-[min(38vw,28rem)]">
      {photos.length ? (
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scrollbar-hide"
        >
          {photos.map((src, photoIndex) => (
            <button
              key={`${src}-${photoIndex}`}
              type="button"
              onClick={() => {
                setIndex(photoIndex);
                setLightboxOpen(true);
              }}
              className="relative h-full w-full shrink-0 snap-center"
              aria-label={`View photo ${photoIndex + 1}`}
            >
              <Image
                src={src || BUSINESS_IMAGE_FALLBACK}
                alt={`${alt} photo ${photoIndex + 1}`}
                fill
                className="object-cover"
                priority={photoIndex === 0}
                sizes="100vw"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-[#215481] via-[#153551] to-[#0c0a09]" />
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40"
        aria-hidden
      />

      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-3.5 pt-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0c0a09] shadow-sm"
          aria-label="Go back"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSave}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0c0a09] shadow-sm"
            aria-label={saved ? 'Remove from favourites' : 'Save to favourites'}
          >
            <Heart size={17} className={saved ? 'fill-rose-600 text-rose-600' : ''} />
          </button>
          <button
            type="button"
            onClick={onShare}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0c0a09] shadow-sm"
            aria-label="Share"
          >
            <Share2 size={17} />
          </button>
        </div>
      </div>

      {photos.length > 1 ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 flex justify-center gap-1.5">
          {photos.map((src, photoIndex) => (
            <span
              key={`${src}-dot`}
              className={`h-1.5 rounded-full ${
                photoIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/45'
              }`}
            />
          ))}
        </div>
      ) : null}

      {photos.length > 0 ? (
        <div className="pointer-events-none absolute bottom-[18px] right-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[11px] font-semibold text-white">
          <Images size={12} />
          {index + 1}/{photos.length}
        </div>
      ) : null}

      {lightboxOpen && photos.length > 0 ? (
        <PhotoLightbox
          images={photos}
          alt={alt}
          startIndex={index}
          onClose={() => setLightboxOpen(false)}
          onIndexChange={setIndex}
        />
      ) : null}
    </div>
  );
});

export default BusinessProfileHeroGallery;

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { resolveTouristPlaceImageUrl } from '@/lib/touristPlaceImage';

const FALLBACK = resolveTouristPlaceImageUrl(null);

type TouristPlaceImageProps = {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
};

export default function TouristPlaceImage({
  src,
  alt,
  className = '',
  fill,
  sizes,
  priority,
}: TouristPlaceImageProps) {
  const [imgSrc, setImgSrc] = useState(() => resolveTouristPlaceImageUrl(src));

  useEffect(() => {
    setImgSrc(resolveTouristPlaceImageUrl(src));
  }, [src]);

  if (fill) {
    return (
      <Image
        src={imgSrc}
        alt={alt}
        fill
        className={`object-cover ${className}`.trim()}
        sizes={sizes}
        priority={priority}
        onError={() => setImgSrc(FALLBACK)}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={imgSrc}
      alt={alt}
      className={className || 'h-full w-full object-cover'}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setImgSrc(FALLBACK)}
    />
  );
}

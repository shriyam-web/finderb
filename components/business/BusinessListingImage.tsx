'use client';

import { useEffect, useState } from 'react';
import Image, { type ImageProps } from 'next/image';
import {
  BUSINESS_IMAGE_FALLBACK,
  resolveBusinessListingImage,
} from '@/lib/businessMapping';

type BusinessListingImageProps = Omit<ImageProps, 'src'> & {
  business: {
    profilePictureUrl?: string | null;
    image?: string | null;
    images?: unknown;
  };
  src?: string | null;
};

/** Listing photo with a guaranteed local fallback if the remote URL fails. */
export default function BusinessListingImage({
  business,
  src,
  alt,
  onError,
  ...props
}: BusinessListingImageProps) {
  const resolved = (typeof src === 'string' && src.trim()) || resolveBusinessListingImage(business);
  const [currentSrc, setCurrentSrc] = useState(resolved);

  useEffect(() => {
    setCurrentSrc(resolved);
  }, [resolved]);

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      onError={(event) => {
        if (currentSrc !== BUSINESS_IMAGE_FALLBACK) {
          setCurrentSrc(BUSINESS_IMAGE_FALLBACK);
        }
        onError?.(event);
      }}
    />
  );
}

const STORED_VARIANT = /\/w(?:360|720|1600)\.webp(?=$|[?#])/;

/** Pick a generated width. Smaller screens use the smaller file. */
export function variantWidthFor(request: number): 360 | 720 | 1600 {
  if (request <= 480) return 360;
  if (request <= 1000) return 720;
  return 1600;
}

/**
 * Stored S3 photos keep three WebP files beside the original.
 * Cloudinary addresses are left unchanged.
 */
export function rewriteStoredVariant(src: string, requestWidth: number): string | null {
  if (!STORED_VARIANT.test(src)) return null;
  const width = variantWidthFor(requestWidth);
  return src.replace(STORED_VARIANT, `/w${width}.webp`);
}

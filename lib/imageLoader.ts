type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

/**
 * Bypass Vercel Image Optimization (quota → 402) by serving Cloudinary
 * transforms directly, and returning other srcs unchanged.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) return src;

  // Local / public assets
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) {
    return src;
  }

  const q = quality ?? 75;

  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const marker = '/upload/';
    const idx = src.indexOf(marker);
    if (idx === -1) return src;

    const after = src.slice(idx + marker.length);
    const firstSegment = after.split('/')[0] ?? '';
    // Already has transforms (f_auto, w_, q_, …)
    if (/(^|,)(f_|w_|h_|q_|c_|g_)/.test(firstSegment)) {
      return src;
    }

    const transform = `f_auto,c_limit,w_${width},q_${q}`;
    return `${src.slice(0, idx + marker.length)}${transform}/${after}`;
  }

  // Unsplash supports width/quality query params.
  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(q));
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      return url.toString();
    } catch {
      return src;
    }
  }

  // Other remote hosts: serve original URL (no Vercel optimizer).
  return src;
}

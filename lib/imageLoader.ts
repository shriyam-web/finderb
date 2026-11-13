type ImageLoaderProps = {
  src: string;
  width: number;
  quality?: number;
};

function markWidth(url: string, width: number): string {
  if (!url || url.includes(String(width))) return url;
  return `${url}#w=${width}`;
}

/**
 * Bypass Vercel Image Optimization (quota → 402) by serving Cloudinary
 * transforms directly, and returning other srcs unchanged.
 * The hash keeps the requested width in the loader result without changing the file request.
 */
export default function imageLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!src) return src;

  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) {
    return markWidth(src, width);
  }

  const q = quality ?? 75;

  if (src.includes('res.cloudinary.com') && src.includes('/upload/')) {
    const marker = '/upload/';
    const idx = src.indexOf(marker);
    if (idx === -1) return markWidth(src, width);

    const after = src.slice(idx + marker.length);
    const firstSegment = after.split('/')[0] ?? '';
    if (/(^|,)(f_|w_|h_|q_|c_|g_)/.test(firstSegment)) {
      return markWidth(src, width);
    }

    const transform = `f_auto,c_limit,w_${width},q_${q}`;
    return `${src.slice(0, idx + marker.length)}${transform}/${after}`;
  }

  if (src.includes('images.unsplash.com')) {
    try {
      const url = new URL(src);
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', String(q));
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      return url.toString();
    } catch {
      return markWidth(src, width);
    }
  }

  return markWidth(src, width);
}

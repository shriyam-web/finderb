const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?auto=format&fit=crop&q=80&w=800';

export function resolveTouristPlaceImageUrl(raw: string | null | undefined): string {
  if (!raw?.trim()) return FALLBACK_IMAGE;

  const value = raw.trim();

  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }

  const supabaseBase = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, '');
  if (!supabaseBase) return FALLBACK_IMAGE;

  if (value.startsWith('/storage/')) {
    return `${supabaseBase}${value}`;
  }

  if (value.startsWith('storage/')) {
    return `${supabaseBase}/${value}`;
  }

  return `${supabaseBase}/storage/v1/object/public/${value}`;
}

export function mapTouristPlaceRow(p: {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  image_url?: string | null;
  image?: string | null;
  slug?: string | null;
}) {
  const imageSource = p.image_url ?? p.image ?? null;

  return {
    id: p.id,
    slug: p.slug ?? null,
    name: p.name,
    location: p.location,
    description: p.description || null,
    image: resolveTouristPlaceImageUrl(imageSource),
    distance: 'Nearby',
    rating: 4.8,
  };
}

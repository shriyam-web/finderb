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

export type TouristPlaceMapped = {
  id: string;
  slug: string | null;
  name: string;
  location: string;
  description: string | null;
  category: string | null;
  image: string;
  distance: string;
  rating: number;
  bestTime: string | null;
  visitDuration: string | null;
  entryFee: string | null;
  howToReach: string | null;
  highlights: string | null;
  tips: string | null;
};

export type TouristPlaceTravelPartner = {
  id: string;
  businessName: string;
  category: string;
  city: string | null;
  slug: string | null;
  profilePictureUrl: string | null;
  rating: number | null;
  note: string | null;
};

export function mapTouristPlaceRow(p: {
  id: string;
  name: string;
  location: string;
  description?: string | null;
  category?: string | null;
  image_url?: string | null;
  image?: string | null;
  slug?: string | null;
  best_time?: string | null;
  visit_duration?: string | null;
  entry_fee?: string | null;
  how_to_reach?: string | null;
  highlights?: string | null;
  tips?: string | null;
}): TouristPlaceMapped {
  const imageSource = p.image_url ?? p.image ?? null;

  return {
    id: p.id,
    slug: p.slug ?? null,
    name: p.name,
    location: p.location,
    description: p.description || null,
    category: p.category || null,
    image: resolveTouristPlaceImageUrl(imageSource),
    distance: 'Nearby',
    rating: 4.8,
    bestTime: p.best_time || null,
    visitDuration: p.visit_duration || null,
    entryFee: p.entry_fee || null,
    howToReach: p.how_to_reach || null,
    highlights: p.highlights || null,
    tips: p.tips || null,
  };
}

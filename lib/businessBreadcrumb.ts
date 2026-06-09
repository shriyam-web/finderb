import type { Business } from '@/lib/mockData';

export function getBusinessLocationLabel(
  business: Pick<Business, 'city' | 'state' | 'location'>
): string | null {
  if (business.city?.trim()) {
    const city = business.city.trim();
    const state = business.state?.trim();
    return state ? `${city}, ${state}` : city;
  }

  const location = business.location?.trim();
  if (!location) return null;

  const parts = location.split(',').map((part) => part.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  return location.length > 48 ? `${location.slice(0, 45)}…` : location;
}

export function buildCategoryBreadcrumbHref(categoryName: string, categoryId?: string | null): string {
  const name = categoryName.trim();
  if (!name) return '/categories';
  if (categoryId) return `/categories?id=${categoryId}`;
  return `/categories?search=${encodeURIComponent(name)}`;
}

export function buildLocationBreadcrumbHref(categoryName: string, locationLabel: string): string {
  const category = categoryName.trim();
  const location = locationLabel.trim();
  if (!location) return buildCategoryBreadcrumbHref(category);
  const query = category ? `${category} in ${location}` : location;
  return `/categories?search=${encodeURIComponent(query)}`;
}

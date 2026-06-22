/** City slug helpers for /categories/{category}/{city} landing pages. */

export function slugifyCity(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[''`]/g, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export function formatCityFromSlug(citySlug: string): string {
  return citySlug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function categoryCityHref(categorySlug: string, citySlug: string): string {
  const category = categorySlug.trim().replace(/^\/+|\/+$/g, '');
  const city = citySlug.trim().replace(/^\/+|\/+$/g, '');
  return `/categories/${category}/${city}`;
}

export function buildCategoryCityLabel(categoryName: string, cityName: string): string {
  return `${categoryName} in ${cityName}`;
}

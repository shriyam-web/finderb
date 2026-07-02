/** Split serviceCategory into display chips (matches public profile parsing). */
export const MAX_SERVICE_CATEGORIES = 10;

export function parseBusinessServices(serviceCategory?: string | null): string[] {
  if (!serviceCategory?.trim()) return [];
  return [
    ...new Set(
      serviceCategory
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ].slice(0, MAX_SERVICE_CATEGORIES);
}

export function serializeBusinessServices(categories: string[]): string {
  return categories.slice(0, MAX_SERVICE_CATEGORIES).join(', ');
}

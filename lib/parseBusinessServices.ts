/** Split serviceCategory into display chips (matches public profile parsing). */
export function parseBusinessServices(serviceCategory?: string | null): string[] {
  if (!serviceCategory?.trim()) return [];
  return [
    ...new Set(
      serviceCategory
        .split(/[,|]/)
        .map((item) => item.trim())
        .filter(Boolean)
    ),
  ];
}

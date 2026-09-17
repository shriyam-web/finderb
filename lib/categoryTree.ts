export type CategoryLevel = 0 | 1 | 2;

export type CategoryTreeRef = {
  id: string;
  name: string;
  parent_id?: string | null;
  level?: number | null;
};

/** Delimiter for multi category mappings on Business.category. */
export const BUSINESS_CATEGORY_SEP = ' ||| ';

export function splitBusinessCategories(
  label: string | null | undefined,
): string[] {
  return (label || '')
    .split(/\s*\|\|\|\s*/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function joinBusinessCategories(labels: string[]): string {
  const unique: string[] = [];
  const seen = new Set<string>();
  for (const raw of labels) {
    const trimmed = raw.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(trimmed);
  }
  return unique.join(BUSINESS_CATEGORY_SEP);
}

export function primaryBusinessCategory(
  label: string | null | undefined,
): string {
  return splitBusinessCategories(label)[0] || '';
}

export function inferCategoryLevel(
  cat: CategoryTreeRef,
  all: CategoryTreeRef[]
): CategoryLevel {
  if (cat.level === 0) return 0;
  if (!cat.parent_id) return 1;
  const parent = all.find((item) => item.id === cat.parent_id);
  if (parent?.level === 0) return 1;
  return 2;
}

export function collectDescendantNames(
  categoryId: string,
  all: CategoryTreeRef[]
): string[] {
  const names: string[] = [];
  const children = all.filter((item) => item.parent_id === categoryId);
  for (const child of children) {
    if (child.name.trim()) names.push(child.name.trim());
    names.push(...collectDescendantNames(child.id, all));
  }
  return names;
}

/** Business.category never stores Parent Category (level 0) names. */
export function resolveBusinessCategoryLabel(
  chain: Array<CategoryTreeRef | null | undefined>,
  all: CategoryTreeRef[]
): string {
  const named = chain.filter((item): item is CategoryTreeRef => Boolean(item));
  const forLabel = named.filter((item) => inferCategoryLevel(item, all) !== 0);
  if (forLabel.length >= 2) {
    return `${forLabel[0].name.trim()} › ${forLabel[forLabel.length - 1].name.trim()}`;
  }
  return (forLabel[0] || named[0])?.name.trim() || '';
}

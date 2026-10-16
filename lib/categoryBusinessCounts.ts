import { categorySegments } from './alsoServes';

type BusinessCategoryQueryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => PromiseLike<{
        data:
          | {
              category: string | null;
              profilePictureUrl?: string | null;
              images?: unknown;
            }[]
          | null;
      }>;
    };
  };
};

function asBusinessCategoryQueryClient(supabase: unknown): BusinessCategoryQueryClient {
  return supabase as BusinessCategoryQueryClient;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

function hasUsablePhotoUrl(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function businessRowHasPublicPhoto(row: {
  profilePictureUrl?: string | null;
  images?: unknown;
}): boolean {
  if (hasUsablePhotoUrl(row.profilePictureUrl)) return true;
  if (!Array.isArray(row.images)) return false;
  return row.images.some((item) => hasUsablePhotoUrl(item));
}

/** Active business `category` labels from the Business table (photo-gated public listings only). */
export async function fetchActiveBusinessCategoryLabels(supabase: unknown): Promise<string[]> {
  const client = asBusinessCategoryQueryClient(supabase);
  const { data } = await client
    .from('Business')
    .select('category, profilePictureUrl, images')
    .eq('status', 'Active');

  return (data ?? [])
    .filter(businessRowHasPublicPhoto)
    .map((row) => row.category?.trim())
    .filter((label): label is string => Boolean(label));
}

export function countBusinessesForTopLevelCategory(
  categoryName: string,
  labels: string[]
): number {
  const name = normalizeLabel(categoryName);
  if (!name) return 0;

  return labels.filter((label) =>
    categorySegments(label).some((segment) => {
      const normalized = normalizeLabel(segment);
      return normalized === name || normalized.startsWith(`${name} ›`);
    }),
  ).length;
}

export function countBusinessesForSubCategory(
  subcategoryName: string,
  parentName: string,
  labels: string[]
): number {
  const sub = normalizeLabel(subcategoryName);
  const parent = normalizeLabel(parentName);
  if (!sub) return 0;

  const combined = parent ? `${parent} › ${sub}` : sub;

  return labels.filter((label) =>
    categorySegments(label).some((segment) => {
      const normalized = normalizeLabel(segment);
      return normalized === combined || normalized === sub || normalized.endsWith(` › ${sub}`);
    }),
  ).length;
}

export function countBusinessesForCategoryTree(
  categoryName: string,
  descendantNames: string[],
  labels: string[]
): number {
  const names = [categoryName, ...descendantNames]
    .map(normalizeLabel)
    .filter(Boolean);
  if (!names.length) return 0;

  return labels.filter((label) =>
    categorySegments(label).some((segment) => {
      const normalized = normalizeLabel(segment);
      return names.some(
        (name) =>
          normalized === name ||
          normalized.startsWith(`${name} ›`) ||
          normalized.endsWith(` › ${name}`),
      );
    }),
  ).length;
}

export function attachDescendantBusinessCounts<
  T extends { id: string; name: string; businessCount?: number },
>(
  nodes: T[],
  allRows: Array<{ id: string; name: string; parent_id?: string | null }>,
  labels: string[]
): T[] {
  const childrenByParent = new Map<string, Array<{ id: string; name: string }>>();
  for (const row of allRows) {
    if (!row.parent_id) continue;
    const list = childrenByParent.get(row.parent_id) ?? [];
    list.push({ id: row.id, name: row.name });
    childrenByParent.set(row.parent_id, list);
  }

  const collectNames = (id: string, name: string): string[] => {
    const kids = childrenByParent.get(id) ?? [];
    return [name, ...kids.flatMap((kid) => collectNames(kid.id, kid.name))];
  };

  return nodes.map((node) => {
    const names = collectNames(node.id, node.name);
    return {
      ...node,
      businessCount: countBusinessesForCategoryTree(names[0] ?? node.name, names.slice(1), labels),
    };
  });
}

export function attachTopLevelBusinessCounts<
  T extends { name: string; businessCount?: number },
>(categories: T[], labels: string[]): T[] {
  return categories.map((category) => ({
    ...category,
    businessCount: countBusinessesForTopLevelCategory(category.name, labels),
  }));
}

export function attachSubcategoryBusinessCounts<
  T extends { name: string; businessCount?: number },
>(subcategories: T[], parentName: string, labels: string[]): T[] {
  return subcategories.map((subcategory) => ({
    ...subcategory,
    businessCount: countBusinessesForSubCategory(subcategory.name, parentName, labels),
  }));
}

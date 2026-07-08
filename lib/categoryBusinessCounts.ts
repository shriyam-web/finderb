type BusinessCategoryQueryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (
        column: string,
        value: string
      ) => PromiseLike<{ data: { category: string | null }[] | null }>;
    };
  };
};

function asBusinessCategoryQueryClient(supabase: unknown): BusinessCategoryQueryClient {
  return supabase as BusinessCategoryQueryClient;
}

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase();
}

/** Active business `category` labels from the Business table. */
export async function fetchActiveBusinessCategoryLabels(supabase: unknown): Promise<string[]> {
  const client = asBusinessCategoryQueryClient(supabase);
  const { data } = await client
    .from('Business')
    .select('category')
    .eq('status', 'Active');

  return (data ?? [])
    .map((row) => row.category?.trim())
    .filter((label): label is string => Boolean(label));
}

export function countBusinessesForTopLevelCategory(
  categoryName: string,
  labels: string[]
): number {
  const name = normalizeLabel(categoryName);
  if (!name) return 0;

  return labels.filter((label) => {
    const normalized = normalizeLabel(label);
    return normalized === name || normalized.startsWith(`${name} ›`);
  }).length;
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

  return labels.filter((label) => {
    const normalized = normalizeLabel(label);
    return normalized === combined || normalized === sub || normalized.endsWith(` › ${sub}`);
  }).length;
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

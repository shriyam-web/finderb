export type CategoryLevel = 0 | 1 | 2;

export type CategoryTreeRef = {
  id: string;
  name: string;
  parentId?: string | null;
  parent_id?: string | null;
  level?: number | null;
};

function parentIdOf(cat: CategoryTreeRef): string | null {
  const value = cat.parentId ?? cat.parent_id;
  return value ? String(value) : null;
}

export function inferCategoryLevel(
  cat: CategoryTreeRef,
  all: CategoryTreeRef[],
): CategoryLevel {
  if (cat.level === 0) return 0;
  if (!parentIdOf(cat)) return 1;
  const parent = all.find((item) => item.id === parentIdOf(cat));
  if (parent?.level === 0) return 1;
  return 2;
}

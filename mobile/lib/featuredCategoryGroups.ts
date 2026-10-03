import { compareText } from './compareText';

type HomeCategory = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  image: string;
  businessCount: number;
  parentId?: string | null;
  level?: number | null;
  queryName?: string;
  children?: HomeCategory[];
};

function sortByMerchantCount<T extends { name: string; businessCount?: number }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const aCount = a.businessCount ?? 0;
    const bCount = b.businessCount ?? 0;
    const aHas = aCount > 0 ? 1 : 0;
    const bHas = bCount > 0 ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    if (bCount !== aCount) return bCount - aCount;
    return compareText(a.name, b.name);
  });
}

function childrenByParentId(all: HomeCategory[]): Map<string, HomeCategory[]> {
  const map = new Map<string, HomeCategory[]>();
  for (const cat of all) {
    if (!cat.parentId) continue;
    const list = map.get(cat.parentId) ?? [];
    list.push(cat);
    map.set(cat.parentId, list);
  }
  for (const [id, list] of map) {
    map.set(id, sortByMerchantCount(list));
  }
  return map;
}

/**
 * Homepage sections: every parent, its categories, and nested subcategories.
 * Parent order is left as-is (home bootstrap shuffles it per load).
 * Empty grouping parents are omitted. Child tabs stay ranked by merchant count.
 */
export function buildHomeFeaturedGroups(
  all: HomeCategory[],
  excludedSlugs: Set<string>,
): HomeCategory[] {
  const byParent = childrenByParentId(all);
  const parents = all.filter(
    (cat) => !cat.parentId && !excludedSlugs.has(cat.slug),
  );

  const groups: HomeCategory[] = [];
  for (const parent of parents) {
    const kids = byParent.get(parent.id) ?? [];
    if (kids.length === 0) {
      if ((parent.businessCount || 0) === 0) continue;
      groups.push({
        ...parent,
        queryName: parent.name,
      });
      continue;
    }

    const childSubs: HomeCategory[] = kids.map((child) => {
      const nested = (byParent.get(child.id) ?? []).map((grand) => ({
        ...grand,
        queryName: grand.name,
      }));
      return {
        ...child,
        queryName: child.name,
        children: nested.length > 0 ? nested : undefined,
      };
    });

    groups.push({
      ...parent,
      queryName: parent.name,
      children: [
        {
          ...parent,
          id: `all:${parent.id}`,
          name: 'All',
          queryName: parent.name,
        },
        ...childSubs,
      ],
    });
  }

  return groups;
}

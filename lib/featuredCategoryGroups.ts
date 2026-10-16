import { categoryBrowseHref, dbBanner, dbSymbol } from '@/lib/categoryDisplay';
import { countBusinessesForCategoryTree } from '@/lib/categoryBusinessCounts';

/** @deprecated Homepage shows every parent category; kept for callers that still pass a cap. */
export const HOME_FEATURED_GROUP_LIMIT = Number.POSITIVE_INFINITY;

export type FeaturedGroupParentRow = {
  id: string;
  name: string;
  slug: string | null;
  symbol?: string | null;
  banner?: string | null;
  position?: number | null;
};

export type FeaturedGroupChildRow = {
  id: string;
  name: string;
  slug: string | null;
  symbol?: string | null;
  banner?: string | null;
  items_count?: number | null;
  parent_id: string;
  position?: number | null;
};

export type FeaturedGroupSubcategory = {
  id: string;
  name: string;
  slug: string | null;
  icon: string;
  image?: string;
  businessCount: number;
  href: string;
  /** Category label used for Business.category queries (defaults to name). */
  queryName?: string;
  /** Level-2 subcategories shown after this category is selected. */
  children?: FeaturedGroupSubcategory[];
};

export type FeaturedCategoryGroup = {
  id: string;
  title: string;
  slug: string | null;
  icon: string;
  merchantCount: number;
  subcategories: FeaturedGroupSubcategory[];
};

function mapChildSubcategory(
  child: FeaturedGroupChildRow,
  browseAs: FeaturedGroupParentRow,
  businessCount: number,
  nested: FeaturedGroupSubcategory[] = []
): FeaturedGroupSubcategory {
  return {
    id: child.id,
    name: child.name,
    slug: child.slug,
    icon: dbSymbol(child.symbol) ?? '',
    image: dbBanner(child.banner) ?? '',
    businessCount,
    href: categoryBrowseHref({ slug: browseAs.slug, name: browseAs.name }, child),
    queryName: child.name,
    children: nested,
  };
}

function sortByMerchantCount<T extends { name: string; businessCount?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aCount = a.businessCount ?? 0;
    const bCount = b.businessCount ?? 0;
    const aHas = aCount > 0 ? 1 : 0;
    const bHas = bCount > 0 ? 1 : 0;
    if (bHas !== aHas) return bHas - aHas;
    if (bCount !== aCount) return bCount - aCount;
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}

function collectDescendantNames(
  id: string,
  childrenByParent: Map<string, FeaturedGroupChildRow[]>
): string[] {
  const kids = childrenByParent.get(id) ?? [];
  return kids.flatMap((kid) => [kid.name, ...collectDescendantNames(kid.id, childrenByParent)]);
}

/**
 * Build homepage category sections: every parent, its categories, and nested
 * subcategories for the selected category. Sorted by onboarded merchant count.
 * Pass `limit` only when a caller still wants a cap.
 */
export function buildFeaturedCategoryGroups(
  parents: FeaturedGroupParentRow[],
  children: FeaturedGroupChildRow[],
  businessLabels: string[],
  limit?: number,
  grandchildren: FeaturedGroupChildRow[] = []
): FeaturedCategoryGroup[] {
  const childrenByParent = new Map<string, FeaturedGroupChildRow[]>();
  for (const child of [...children, ...grandchildren]) {
    const list = childrenByParent.get(child.parent_id) ?? [];
    list.push(child);
    childrenByParent.set(child.parent_id, list);
  }

  const groups = parents
    .map((parent) => {
      const merchantCount = countBusinessesForCategoryTree(
        parent.name,
        collectDescendantNames(parent.id, childrenByParent),
        businessLabels
      );
      if (merchantCount === 0) return null;

      const subs = childrenByParent.get(parent.id) ?? [];
      const parentIcon = dbSymbol(parent.symbol) ?? '';

      if (subs.length === 0) {

        return {
          id: parent.id,
          title: parent.name,
          slug: parent.slug,
          icon: parentIcon,
          merchantCount,
          subcategories: [
            {
              id: parent.id,
              name: parent.name,
              slug: parent.slug,
              icon: parentIcon,
              image: dbBanner(parent.banner) ?? '',
              businessCount: merchantCount,
              href: categoryBrowseHref({ slug: parent.slug, name: parent.name }),
              queryName: parent.name,
            },
          ],
        } satisfies FeaturedCategoryGroup;
      }

      const childSubs = sortByMerchantCount(
        subs.map((child) => {
          const nested = sortByMerchantCount(
            (childrenByParent.get(child.id) ?? []).map((grand) =>
              mapChildSubcategory(
                grand,
                {
                  id: child.id,
                  name: child.name,
                  slug: child.slug,
                  symbol: child.symbol,
                  banner: child.banner,
                },
                countBusinessesForCategoryTree(
                  grand.name,
                  collectDescendantNames(grand.id, childrenByParent),
                  businessLabels
                )
              )
            )
          );

          return mapChildSubcategory(
            child,
            parent,
            countBusinessesForCategoryTree(
              child.name,
              collectDescendantNames(child.id, childrenByParent),
              businessLabels
            ),
            nested
          );
        })
      );

      const subcategories: FeaturedGroupSubcategory[] = [
        {
          id: `all:${parent.id}`,
          name: 'All',
          slug: parent.slug,
          icon: parentIcon,
          image: dbBanner(parent.banner) ?? '',
          businessCount: merchantCount,
          href: categoryBrowseHref({ slug: parent.slug, name: parent.name }),
          queryName: parent.name,
        },
        ...childSubs,
      ];

      return {
        id: parent.id,
        title: parent.name,
        slug: parent.slug,
        icon: parentIcon,
        merchantCount,
        subcategories,
      } satisfies FeaturedCategoryGroup;
    })
    .filter((g): g is FeaturedCategoryGroup => g !== null);

  const sorted = groups.sort(
    (a, b) =>
      b.merchantCount - a.merchantCount || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );

  if (typeof limit === 'number' && Number.isFinite(limit) && limit > 0) {
    return sorted.slice(0, Math.max(1, limit));
  }

  return sorted;
}

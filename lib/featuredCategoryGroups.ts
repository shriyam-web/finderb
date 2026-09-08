import { categoryBrowseHref, dbBanner, dbSymbol } from '@/lib/categoryDisplay';
import { countBusinessesForCategoryTree } from '@/lib/categoryBusinessCounts';

/** How many category sections to show on the homepage. */
export const HOME_FEATURED_GROUP_LIMIT = 6;

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
  parent: FeaturedGroupParentRow,
  businessCount: number
): FeaturedGroupSubcategory {
  return {
    id: child.id,
    name: child.name,
    slug: child.slug,
    icon: dbSymbol(child.symbol) ?? '',
    image: dbBanner(child.banner) ?? '',
    businessCount,
    href: categoryBrowseHref({ slug: parent.slug, name: parent.name }, child),
    queryName: child.name,
  };
}

function collectDescendantNames(
  id: string,
  childrenByParent: Map<string, FeaturedGroupChildRow[]>
): string[] {
  const kids = childrenByParent.get(id) ?? [];
  return kids.flatMap((kid) => [kid.name, ...collectDescendantNames(kid.id, childrenByParent)]);
}

/**
 * Build homepage featured category sections from category rows + live Business labels.
 * Includes parent-level and leaf categories (not only subcategory hits), sorted by
 * onboarded merchant count, capped at {@link HOME_FEATURED_GROUP_LIMIT}.
 */
export function buildFeaturedCategoryGroups(
  parents: FeaturedGroupParentRow[],
  children: FeaturedGroupChildRow[],
  businessLabels: string[],
  limit = HOME_FEATURED_GROUP_LIMIT,
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
      const subs = childrenByParent.get(parent.id) ?? [];
      const parentIcon = dbSymbol(parent.symbol) ?? '';

      if (subs.length === 0) {
        if (merchantCount === 0) return null;

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

      const childSubs = subs
        .map((child) =>
          mapChildSubcategory(
            child,
            parent,
            countBusinessesForCategoryTree(
              child.name,
              collectDescendantNames(child.id, childrenByParent),
              businessLabels
            )
          )
        )
        .sort((a, b) => {
          const aCount = a.businessCount ?? 0;
          const bCount = b.businessCount ?? 0;
          const aHas = aCount > 0 ? 1 : 0;
          const bHas = bCount > 0 ? 1 : 0;
          if (bHas !== aHas) return bHas - aHas;
          if (bCount !== aCount) return bCount - aCount;
          return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
        });

      const hasSubMerchants = childSubs.some((sub) => (sub.businessCount ?? 0) > 0);
      if (merchantCount === 0 && !hasSubMerchants) return null;

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

  return groups
    .sort(
      (a, b) =>
        b.merchantCount - a.merchantCount || a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
    )
    .slice(0, Math.max(1, limit));
}

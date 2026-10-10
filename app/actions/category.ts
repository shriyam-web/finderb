'use server';

import { createDataClient } from '@/utils/supabase/server';
import { categoryBrowseHref, categoryHref, dbBanner, dbSymbol } from '@/lib/categoryDisplay';
import {
  escapeIlikePattern,
  getSearchTermsForQuery,
  sortBySearchRelevance,
} from '@/lib/searchMatch';
import { enforceRateLimit } from '@/lib/security/enforceRateLimit.server';
import {
  attachDescendantBusinessCounts,
  countBusinessesForCategoryTree,
  countBusinessesForSubCategory,
  countBusinessesForTopLevelCategory,
  fetchActiveBusinessCategoryLabels,
} from '@/lib/categoryBusinessCounts';
import { buildFeaturedCategoryGroups } from '@/lib/featuredCategoryGroups';

export async function getCategories(topLevelOnly = true) {
  try {
    const supabase = await createDataClient();

    const [{ data: categories, error }, businessLabels] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('status', 'Active')
        .order('position', { ascending: true })
        .order('items_count', { ascending: false }),
      fetchActiveBusinessCategoryLabels(supabase),
    ]);

    if (error) {
      throw error;
    }

    const mappedCategories = (categories ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: dbSymbol(c.symbol),
      image: dbBanner(c.banner),
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      businessCount: 0,
      color: '#3B82F6',
      level: typeof c.level === 'number' ? c.level : c.parent_id ? 2 : 1,
      parent_id: c.parent_id ?? null,
    }));

    const scoped = topLevelOnly
      ? mappedCategories.filter((c) => !c.parent_id)
      : mappedCategories;

    return {
      success: true,
      categories: attachDescendantBusinessCounts(scoped, mappedCategories, businessLabels),
    };
  } catch (error: any) {
    console.error('Get Categories Error:', error);
    return { success: false, error: error.message || 'Failed to fetch categories' };
  }
}

export async function getSubCategories(parentId: string) {
  try {
    const supabase = await createDataClient();

    const [
      { data: subCategories, error },
      businessLabels,
    ] = await Promise.all([
      supabase
        .from('categories')
        .select('*')
        .eq('parent_id', parentId)
        .eq('status', 'Active')
        .order('items_count', { ascending: false }),
      fetchActiveBusinessCategoryLabels(supabase),
    ]);

    if (error) {
      throw error;
    }

    const childIds = (subCategories ?? []).map((c: { id: string }) => c.id);
    const { data: grandchildren } =
      childIds.length > 0
        ? await supabase
            .from('categories')
            .select('id, name, parent_id')
            .in('parent_id', childIds)
            .eq('status', 'Active')
        : { data: [] as Array<{ id: string; name: string; parent_id: string }> };

    const grandchildNamesByParent = new Map<string, string[]>();
    for (const row of grandchildren ?? []) {
      const list = grandchildNamesByParent.get(row.parent_id) ?? [];
      list.push(row.name);
      grandchildNamesByParent.set(row.parent_id, list);
    }

    const mappedSubCategories = (subCategories ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      image: dbBanner(c.banner),
      icon: dbSymbol(c.symbol),
      businessCount: countBusinessesForCategoryTree(
        c.name,
        grandchildNamesByParent.get(c.id) ?? [],
        businessLabels
      ),
      level: typeof c.level === 'number' ? c.level : 2,
      parent_id: c.parent_id ?? parentId,
    }));

    return { success: true, subCategories: mappedSubCategories };
  } catch (error: any) {
    console.error('Get SubCategories Error:', error);
    return { success: false, error: error.message || 'Failed to fetch subcategories' };
  }
}

function mapSubcategory(
  child: {
    id: string;
    name: string;
    slug: string | null;
    symbol: string | null;
    banner: string | null;
    items_count: number | null;
  },
  parent: { id: string; slug?: string | null; name?: string | null }
) {
  return {
    id: child.id,
    name: child.name,
    slug: child.slug,
    icon: dbSymbol(child.symbol),
    image: dbBanner(child.banner),
    businessCount: child.items_count || 0,
    href: categoryBrowseHref({ slug: parent.slug, name: parent.name }, child),
  };
}

/** Top-level categories with onboarded merchants (parent or subcategory), up to 6. */
export async function getFeaturedGroups() {
  try {
    const supabase = await createDataClient();

    const { data: parents, error: parentError } = await supabase
      .from('categories')
      .select('id, name, slug, banner, symbol, position, items_count')
      .is('parent_id', null)
      .eq('status', 'Active')
      .order('position', { ascending: true })
      .order('items_count', { ascending: false });

    if (parentError) throw parentError;
    if (!parents?.length) {
      return { success: true, groups: [] };
    }

    const parentIds = parents.map((p) => p.id);
    const [{ data: children, error: childError }, businessLabels] = await Promise.all([
      supabase
        .from('categories')
        .select('id, name, slug, banner, symbol, items_count, parent_id, position')
        .in('parent_id', parentIds)
        .eq('status', 'Active')
        .order('position', { ascending: true })
        .order('items_count', { ascending: false }),
      fetchActiveBusinessCategoryLabels(supabase),
    ]);

    if (childError) throw childError;

    const childIds = (children ?? []).map((c) => c.id);
    const { data: grandchildren, error: grandchildError } =
      childIds.length > 0
        ? await supabase
            .from('categories')
            .select('id, name, slug, banner, symbol, items_count, parent_id, position')
            .in('parent_id', childIds)
            .eq('status', 'Active')
        : { data: [] as typeof children, error: null };

    if (grandchildError) throw grandchildError;

    const groups = buildFeaturedCategoryGroups(
      parents,
      children ?? [],
      businessLabels,
      undefined,
      grandchildren ?? []
    );

    return { success: true, groups };
  } catch (error: any) {
    console.error('Get Featured Groups Error:', error);
    return { success: false, error: error.message || 'Failed to fetch featured groups' };
  }
}

export type CategoryBreadcrumb = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  href: string;
};

export async function findCategoryForBreadcrumb(categoryName: string) {
  const name = categoryName?.trim();
  if (!name) {
    return { success: true as const, category: null };
  }

  try {
    const supabase = await createDataClient();
    const pattern = escapeIlikePattern(name);

    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, parent_id')
      .eq('status', 'Active')
      .ilike('name', pattern)
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return {
        success: true as const,
        category: {
          id: '',
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-'),
          parentId: null,
          href: `/categories?search=${encodeURIComponent(name)}`,
        } satisfies CategoryBreadcrumb,
      };
    }

    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, '-');
    const href = categoryHref(slug, data.name);

    return {
      success: true as const,
      category: {
        id: data.id,
        name: data.name,
        slug,
        parentId: data.parent_id,
        href,
      } satisfies CategoryBreadcrumb,
    };
  } catch (error: any) {
    console.error('Find Category For Breadcrumb Error:', error);
    return {
      success: true as const,
      category: {
        id: '',
        name,
        slug: name.toLowerCase().replace(/\s+/g, '-'),
        parentId: null,
        href: `/categories?search=${encodeURIComponent(name)}`,
      } satisfies CategoryBreadcrumb,
    };
  }
}

export type CategorySearchHit = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  image: string | null;
  businessCount: number;
  parentId: string | null;
  parentName: string | null;
};

/** Search all active categories and subcategories by name (supports natural language). */
export async function searchCategoriesByQuery(query: string) {
  const terms = getSearchTermsForQuery(query);
  if (terms.length === 0) {
    return { success: true as const, results: [] as CategorySearchHit[] };
  }

  const searchLimit = await enforceRateLimit('search');
  if (!searchLimit.ok) {
    return { success: false as const, error: searchLimit.error };
  }

  try {
    const supabase = await createDataClient();
    const orFilter = terms
      .flatMap((term) => {
        const pattern = `%${escapeIlikePattern(term)}%`;
        return [`name.ilike.${pattern}`, `slug.ilike.${pattern}`];
      })
      .join(',');

    const { data: rows, error } = await supabase
      .from('categories')
      .select('id, name, slug, symbol, banner, parent_id, items_count')
      .eq('status', 'Active')
      .or(orFilter)
      .order('items_count', { ascending: false })
      .limit(80);

    if (error) throw error;
    if (!rows?.length) {
      return { success: true as const, results: [] as CategorySearchHit[] };
    }

    const parentIds = [
      ...new Set(rows.map((r) => r.parent_id).filter((id): id is string => Boolean(id))),
    ];

    const parentNameById = new Map<string, string>();
    if (parentIds.length > 0) {
      const { data: parents } = await supabase
        .from('categories')
        .select('id, name')
        .in('id', parentIds);
      for (const p of parents ?? []) {
        parentNameById.set(p.id, p.name);
      }
    }

    const businessLabels = await fetchActiveBusinessCategoryLabels(supabase);

    const results: CategorySearchHit[] = rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      icon: dbSymbol(c.symbol),
      image: dbBanner(c.banner),
      businessCount: c.parent_id
        ? countBusinessesForSubCategory(
            c.name,
            parentNameById.get(c.parent_id) ?? '',
            businessLabels
          )
        : countBusinessesForTopLevelCategory(c.name, businessLabels),
      parentId: c.parent_id,
      parentName: c.parent_id ? parentNameById.get(c.parent_id) ?? null : null,
    }));

    const ranked = sortBySearchRelevance(results, query, (hit) => ({
      name: hit.name,
      slug: hit.slug,
      parentName: hit.parentName,
    }));

    return { success: true as const, results: ranked };
  } catch (error: any) {
    console.error('Search Categories Error:', error);
    return {
      success: false as const,
      error: error.message || 'Failed to search categories',
      results: [] as CategorySearchHit[],
    };
  }
}

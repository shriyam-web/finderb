'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { categoryHref, dbBanner, dbSymbol } from '@/lib/categoryDisplay';

export async function getCategories(topLevelOnly = true) {
  try {
    const supabase = createClient(await cookies());

    let query = supabase
      .from('categories')
      .select('*')
      .eq('status', 'Active');

    if (topLevelOnly) {
      query = query.is('parent_id', null);
    }

    const { data: categories, error } = await query
      .order('position', { ascending: true })
      .order('items_count', { ascending: false });

    if (error) {
      throw error;
    }

    // Map DB fields to the expected Category interface if necessary
    const mappedCategories = categories.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: dbSymbol(c.symbol),
      image: dbBanner(c.banner),
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      businessCount: c.items_count || 0,
      color: '#3B82F6',
    }));

    return { success: true, categories: mappedCategories };
  } catch (error: any) {
    console.error('Get Categories Error:', error);
    return { success: false, error: error.message || 'Failed to fetch categories' };
  }
}

export async function getSubCategories(parentId: string) {
  try {
    const supabase = createClient(await cookies());

    const { data: subCategories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('parent_id', parentId)
      .eq('status', 'Active')
      .order('items_count', { ascending: false });

    if (error) {
      throw error;
    }

    const mappedSubCategories = subCategories.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      image: dbBanner(c.banner),
      icon: dbSymbol(c.symbol),
      businessCount: c.items_count || 0,
    }));

    return { success: true, subCategories: mappedSubCategories };
  } catch (error: any) {
    console.error('Get SubCategories Error:', error);
    return { success: false, error: error.message || 'Failed to fetch subcategories' };
  }
}

/** Only show parent groups with more than one active subcategory. */
const MIN_SUBCATEGORIES_PER_GROUP = 2;

function mapSubcategory(child: {
  id: string;
  name: string;
  slug: string | null;
  symbol: string | null;
  banner: string | null;
  items_count: number | null;
}) {
  return {
    id: child.id,
    name: child.name,
    slug: child.slug,
    icon: dbSymbol(child.symbol),
    image: dbBanner(child.banner),
    businessCount: child.items_count || 0,
    href: categoryHref(child.slug, child.name),
  };
}

/** Top-level categories from DB that have multiple active subcategories. */
export async function getFeaturedGroups() {
  try {
    const supabase = createClient(await cookies());

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
    const { data: children, error: childError } = await supabase
      .from('categories')
      .select('id, name, slug, banner, symbol, items_count, parent_id, position')
      .in('parent_id', parentIds)
      .eq('status', 'Active')
      .order('position', { ascending: true })
      .order('items_count', { ascending: false });

    if (childError) throw childError;

    const childrenByParent = new Map<string, NonNullable<typeof children>>();
    for (const child of children ?? []) {
      const list = childrenByParent.get(child.parent_id) ?? [];
      list.push(child);
      childrenByParent.set(child.parent_id, list);
    }

    const groups = parents
      .map((parent) => {
        const subs = childrenByParent.get(parent.id) ?? [];
        if (subs.length < MIN_SUBCATEGORIES_PER_GROUP) return null;

        return {
          id: parent.id,
          title: parent.name,
          slug: parent.slug,
          icon: dbSymbol(parent.symbol),
          subcategories: subs.map(mapSubcategory),
        };
      })
      .filter((g): g is NonNullable<typeof g> => g !== null);

    return { success: true, groups };
  } catch (error: any) {
    console.error('Get Featured Groups Error:', error);
    return { success: false, error: error.message || 'Failed to fetch featured groups' };
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

/** Search all active categories and subcategories by name (case-insensitive). */
export async function searchCategoriesByQuery(query: string) {
  const needle = query.trim();
  if (!needle) {
    return { success: true as const, results: [] as CategorySearchHit[] };
  }

  try {
    const supabase = createClient(await cookies());
    const pattern = `%${needle.replace(/[%_]/g, '\\$&')}%`;

    const { data: rows, error } = await supabase
      .from('categories')
      .select('id, name, slug, symbol, banner, parent_id, items_count')
      .eq('status', 'Active')
      .ilike('name', pattern)
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

    const results: CategorySearchHit[] = rows.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      icon: dbSymbol(c.symbol),
      image: dbBanner(c.banner),
      businessCount: c.items_count || 0,
      parentId: c.parent_id,
      parentName: c.parent_id ? parentNameById.get(c.parent_id) ?? null : null,
    }));

    return { success: true as const, results };
  } catch (error: any) {
    console.error('Search Categories Error:', error);
    return {
      success: false as const,
      error: error.message || 'Failed to search categories',
      results: [] as CategorySearchHit[],
    };
  }
}

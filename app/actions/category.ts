'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

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
      icon: c.symbol && c.symbol !== 'Not Set' ? c.symbol : 'Grid',
      image: c.banner && c.banner !== 'Not Set' ? c.banner : 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800',
      slug: c.slug || c.name.toLowerCase().replace(/\s+/g, '-'),
      businessCount: c.items_count || 0,
      color: '#3B82F6' // Default color
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
      image: c.banner && c.banner !== 'Not Set' ? c.banner : 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=800',
      icon: c.symbol && c.symbol !== 'Not Set' ? c.symbol : 'Grid',
      businessCount: c.items_count || 0,
    }));

    return { success: true, subCategories: mappedSubCategories };
  } catch (error: any) {
    console.error('Get SubCategories Error:', error);
    return { success: false, error: error.message || 'Failed to fetch subcategories' };
  }
}

export async function getFeaturedGroups(categoryNames: string[]) {
  try {
    const supabase = createClient(await cookies());

    // 1. Fetch parent categories
    const { data: parents, error: parentError } = await supabase
      .from('categories')
      .select('id, name, slug, banner')
      .or(categoryNames.map(name => `name.ilike.${name}`).join(','))
      .is('parent_id', null)
      .eq('status', 'Active');

    if (parentError) throw parentError;

    // 2. For each parent, fetch all subcategories
    const groups = await Promise.all(parents.map(async (parent) => {
      const { data: children, error: childError } = await supabase
        .from('categories')
        .select('id, name, slug, banner, symbol, items_count')
        .eq('parent_id', parent.id)
        .eq('status', 'Active')
        .order('items_count', { ascending: false });

      if (childError) throw childError;

      return {
        title: parent.name,
        slug: parent.slug,
        subcategories: children.map(child => ({
          name: child.name,
          slug: child.slug,
          image: child.banner && child.banner !== 'Not Set' ? child.banner : null,
          icon: child.symbol && child.symbol !== 'Not Set' ? child.symbol : 'Grid',
          businessCount: child.items_count || 0,
          href: `/categories/${child.slug || child.name.toLowerCase().replace(/\s+/g, '-')}`
        }))
      };
    }));

    return { success: true, groups };
  } catch (error: any) {
    console.error('Get Featured Groups Error:', error);
    return { success: false, error: error.message || 'Failed to fetch featured groups' };
  }
}

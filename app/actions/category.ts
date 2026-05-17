'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getCategories() {
  try {
    const supabase = createClient(await cookies());

    const { data: categories, error } = await supabase
      .from('categories')
      .select('*')
      .eq('status', 'Active')
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
      businessCount: c.items_count || 0,
    }));

    return { success: true, subCategories: mappedSubCategories };
  } catch (error: any) {
    console.error('Get SubCategories Error:', error);
    return { success: false, error: error.message || 'Failed to fetch subcategories' };
  }
}

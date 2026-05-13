'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function getBlogs() {
  try {
    const supabase = createClient(await cookies());

    const { data: blogs, error } = await supabase
      .from('blogs')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(6);

    if (error) {
      throw error;
    }

    const mappedBlogs = blogs.map((b: any) => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      excerpt: b.excerpt || b.content.substring(0, 150) + '...',
      image: b.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
      date: b.published_at ? new Date(b.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
      author: b.author || 'FinderB Admin'
    }));

    return { success: true, blogs: mappedBlogs };
  } catch (error: any) {
    console.error('Get Blogs Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

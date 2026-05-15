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

export async function getBlogBySlug(slugOrId: string) {
  try {
    const supabase = createClient(await cookies());

    // Try finding by slug first
    let { data: blog, error: slugError } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', slugOrId)
      .eq('status', 'published')
      .maybeSingle();

    // If not found by slug, try by ID
    if (!blog) {
      // Basic check to see if it could be a UUID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slugOrId);
      const isNumeric = /^\d+$/.test(slugOrId);
      
      if (isUuid || isNumeric) {
        const { data: blogById } = await supabase
          .from('blogs')
          .select('*')
          .eq('id', slugOrId)
          .eq('status', 'published')
          .maybeSingle();
        
        blog = blogById;
      }
    }

    if (!blog) return { success: false, error: 'Blog not found' };

    const mappedBlog = {
      id: blog.id,
      title: blog.title,
      slug: blog.slug,
      excerpt: blog.excerpt || (blog.content ? blog.content.substring(0, 150) + '...' : ''),
      content: blog.content || '',
      image: blog.image_url || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800',
      date: blog.published_at ? new Date(blog.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently',
      author: blog.author || 'FinderB Admin'
    };

    return { success: true, blog: mappedBlog };
  } catch (error: any) {
    console.error('Get Blog Error:', error);
    return { success: false, error: error.message || 'An unexpected error occurred' };
  }
}

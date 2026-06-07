'use server';

import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { stripHtml } from '@/lib/stripHtml';

function plainExcerpt(excerpt: string | null | undefined, content: string | null | undefined, maxLen = 150): string {
  const raw = excerpt || (content ? content.substring(0, maxLen) + '...' : '');
  return stripHtml(raw);
}

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
      excerpt: plainExcerpt(b.excerpt, b.content),
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
  if (!slugOrId) return { success: false, error: 'No identifier provided' };

  const identifier = slugOrId.trim();

  try {
    const supabase = createClient(await cookies());

    // 1. Try finding by slug first (most common for detailed pages)
    let { data: blog } = await supabase
      .from('blogs')
      .select('*')
      .eq('slug', identifier)
      .eq('status', 'published')
      .maybeSingle();

    // 2. If not found by slug, try by ID
    if (!blog) {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
      const isNumeric = /^\d+$/.test(identifier);
      
      // If it looks like a UUID or a numeric ID, try querying the ID column
      // For other string IDs, we also try them but only if they don't look like a typical slug
      // to avoid unnecessary DB errors if the column is UUID
      if (isUuid || isNumeric || (identifier.length > 0 && !identifier.includes('-'))) {
        try {
          const { data: blogById } = await supabase
            .from('blogs')
            .select('*')
            .eq('id', identifier)
            .eq('status', 'published')
            .maybeSingle();
          
          if (blogById) {
            blog = blogById;
          }
        } catch {
          // Ignore cast errors if id column is UUID and slugOrId is not
          console.log('Query by ID failed, likely incompatible type');
        }
      }
    }

    if (!blog) {
      console.log(`Blog not found for identifier: ${identifier}`);
      return { success: false, error: 'Blog not found' };
    }

    const mappedBlog = {
      id: blog.id,
      title: blog.title || 'Untitled Story',
      slug: blog.slug,
      excerpt: plainExcerpt(blog.excerpt, blog.content),
      content: blog.content || 'Story content is currently not available.',
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

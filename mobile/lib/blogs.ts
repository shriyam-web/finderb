import { isSupabaseConfigured, supabase } from './supabase';

export type BlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  date: string;
  author: string;
};

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=800';

function stripHtml(raw: string): string {
  return raw
    .replace(/<\/p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

function plainExcerpt(
  excerpt: string | null | undefined,
  content: string | null | undefined,
  maxLen = 150,
): string {
  const raw = excerpt || (content ? `${content.substring(0, maxLen)}...` : '');
  const plain = stripHtml(raw).replace(/\n+/g, ' ').trim();
  if (plain.length <= maxLen) return plain;
  return `${plain.slice(0, maxLen - 1).trim()}…`;
}

function formatBlogDate(value: string | null | undefined): string {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function mapBlogRow(row: Record<string, unknown>, includeContent = false): BlogPost {
  const excerpt = plainExcerpt(
    typeof row.excerpt === 'string' ? row.excerpt : null,
    typeof row.content === 'string' ? row.content : null,
  );
  return {
    id: String(row.id),
    title: String(row.title || 'Untitled').trim() || 'Untitled',
    slug: String(row.slug || row.id || '').trim(),
    excerpt,
    content: includeContent
      ? typeof row.content === 'string'
        ? row.content
        : ''
      : '',
    image:
      (typeof row.image_url === 'string' && row.image_url.trim()) || FALLBACK_IMAGE,
    date: formatBlogDate(
      typeof row.published_at === 'string' ? row.published_at : null,
    ),
    author:
      (typeof row.author === 'string' && row.author.trim()) || 'FinderB Admin',
  };
}

export function blogHtmlToParagraphs(html: string): string[] {
  return stripHtml(html)
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export async function fetchBlogs(limit = 12): Promise<{
  blogs: BlogPost[];
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { blogs: [], error: 'Supabase is not configured' };
  }

  const { data, error } = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, content, image_url, published_at, author, status')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(Math.min(Math.max(limit, 1), 40));

  if (error) {
    return { blogs: [], error: error.message };
  }

  return {
    blogs: (data ?? []).map((row) =>
      mapBlogRow(row as Record<string, unknown>, false),
    ),
  };
}

export async function fetchBlogBySlug(slugOrId: string): Promise<{
  blog: BlogPost | null;
  error?: string;
}> {
  if (!isSupabaseConfigured || !supabase) {
    return { blog: null, error: 'Supabase is not configured' };
  }

  const key = slugOrId.trim();
  if (!key) return { blog: null, error: 'Missing blog id' };

  const bySlug = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, content, image_url, published_at, author, status')
    .eq('slug', key)
    .eq('status', 'published')
    .maybeSingle();

  if (bySlug.data) {
    return { blog: mapBlogRow(bySlug.data as Record<string, unknown>, true) };
  }

  const byId = await supabase
    .from('blogs')
    .select('id, title, slug, excerpt, content, image_url, published_at, author, status')
    .eq('id', key)
    .eq('status', 'published')
    .maybeSingle();

  if (byId.data) {
    return { blog: mapBlogRow(byId.data as Record<string, unknown>, true) };
  }

  return { blog: null, error: bySlug.error?.message || byId.error?.message || 'Blog not found' };
}

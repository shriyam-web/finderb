import type { Metadata } from 'next';
import {
  buildBreadcrumbJsonLd,
  buildJsonLdGraph,
  buildPageMetadata,
  NO_INDEX_ROBOTS,
  resolveAbsoluteUrl,
  truncate,
} from '@/lib/seoUtils';

export type BlogSeoInput = {
  id: string;
  title: string;
  slug?: string | null;
  excerpt?: string | null;
  content?: string | null;
  image?: string | null;
  author?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
};

export function getBlogCanonicalPath(blog: Pick<BlogSeoInput, 'id' | 'slug'>): string {
  return `/blog/${blog.slug || blog.id}`;
}

export function buildBlogIndexMetadata(): Metadata {
  return buildPageMetadata({
    title: 'Blog — Local Business Guides & City Insights',
    description:
      'Read FinderB blog articles on local discovery, city guides, business tips, and trusted service recommendations across India.',
    canonicalPath: '/blog',
    keywords: ['FinderB blog', 'local business guides', 'city insights India'],
  });
}

export function buildBlogArticleMetadata(blog: BlogSeoInput | null): Metadata {
  if (!blog) {
    return buildPageMetadata({
      title: 'Article not found',
      description: 'This blog article could not be found on FinderB.',
      canonicalPath: '/blog',
      robots: NO_INDEX_ROBOTS,
    });
  }

  const canonicalPath = getBlogCanonicalPath(blog);
  const description = truncate(
    blog.excerpt ||
      (blog.content ? blog.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '') ||
      `Read ${blog.title} on the FinderB blog.`,
    160
  );

  return buildPageMetadata({
    title: blog.title,
    description,
    canonicalPath,
    ogImage: blog.image || '/brands/fb-mark-240.png',
    keywords: ['FinderB blog', blog.title, 'local business', 'India'],
  });
}

export function buildBlogArticleJsonLd(blog: BlogSeoInput) {
  const url = resolveAbsoluteUrl(getBlogCanonicalPath(blog));
  const image = blog.image ? resolveAbsoluteUrl(blog.image) : resolveAbsoluteUrl('/brands/fb-mark-240.png');
  const published = blog.publishedAt || blog.updatedAt || undefined;
  const modified = blog.updatedAt || published;
  const authorName = blog.author?.trim();
  const author =
    !authorName || /finderb/i.test(authorName)
      ? { '@type': 'Organization', name: 'FinderB', url: resolveAbsoluteUrl('/') }
      : { '@type': 'Person', name: authorName };

  return buildJsonLdGraph(
    {
      '@type': 'Article',
      '@id': url,
      headline: blog.title,
      description: truncate(blog.excerpt || blog.title, 200),
      image: [image],
      ...(published ? { datePublished: published } : {}),
      ...(modified ? { dateModified: modified } : {}),
      author,
      publisher: {
        '@type': 'Organization',
        name: 'FinderB',
        logo: {
          '@type': 'ImageObject',
          url: resolveAbsoluteUrl('/brands/fb-mark-240.png'),
        },
      },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      url,
    },
    buildBreadcrumbJsonLd([
      { name: 'Home', path: '/' },
      { name: 'Blog', path: '/blog' },
      { name: blog.title, path: getBlogCanonicalPath(blog) },
    ])
  );
}

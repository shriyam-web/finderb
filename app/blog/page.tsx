import type { Metadata } from 'next';
import { getBlogs } from '@/app/actions/blog';
import BlogListingClient from '@/components/blog/BlogListingClient';
import JsonLd from '@/components/JsonLd';
import { buildBlogIndexMetadata } from '@/lib/blogSeo';
import { buildBreadcrumbJsonLd, buildJsonLdGraph, resolveAbsoluteUrl } from '@/lib/seoUtils';

export const metadata: Metadata = buildBlogIndexMetadata();

export default async function BlogListingPage() {
  const result = await getBlogs();
  const blogs = result.success && result.blogs ? result.blogs : [];

  const jsonLd = buildJsonLdGraph({
    '@type': 'CollectionPage',
    '@id': resolveAbsoluteUrl('/blog'),
    name: 'FinderB Blog',
    description: 'Local business guides, city insights, and discovery tips from FinderB.',
    url: resolveAbsoluteUrl('/blog'),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: blogs.map((blog, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: resolveAbsoluteUrl(`/blog/${blog.slug || blog.id}`),
        name: blog.title,
      })),
    },
  }, buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'Blog', path: '/blog' },
  ]));

  return (
    <>
      <JsonLd data={jsonLd} />
      <BlogListingClient initialBlogs={blogs} />
    </>
  );
}

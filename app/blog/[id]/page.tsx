import type { Metadata } from 'next';
import { getBlogBySlug } from '@/app/actions/blog';
import BlogDetailClient from '@/components/blog/BlogDetailClient';
import JsonLd from '@/components/JsonLd';
import RelatedBlogPosts from '@/components/seo/RelatedBlogPosts';
import { buildBlogArticleJsonLd, buildBlogArticleMetadata } from '@/lib/blogSeo';

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const result = await getBlogBySlug(id);
  return buildBlogArticleMetadata(
    result.success && result.blog
      ? {
          id: result.blog.id,
          title: result.blog.title,
          slug: result.blog.slug,
          excerpt: result.blog.excerpt,
          content: result.blog.content,
          image: result.blog.image,
          author: result.blog.author,
        }
      : null
  );
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { id } = await params;
  const result = await getBlogBySlug(id);
  const article = result.success && result.blog ? result.blog : null;
  const jsonLd = article
    ? buildBlogArticleJsonLd({
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        image: article.image,
        author: article.author,
      })
    : null;

  return (
    <>
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
      <BlogDetailClient slugOrId={id} initialArticle={article} />
      {article ? <RelatedBlogPosts currentSlugOrId={id} /> : null}
    </>
  );
}

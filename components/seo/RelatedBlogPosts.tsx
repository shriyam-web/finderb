import Link from 'next/link';
import { getBlogs } from '@/app/actions/blog';

type RelatedBlogPostsProps = {
  currentSlugOrId: string;
};

export default async function RelatedBlogPosts({ currentSlugOrId }: RelatedBlogPostsProps) {
  const result = await getBlogs();
  const blogs = (result.success && result.blogs ? result.blogs : []).filter(
    (blog) => (blog.slug || blog.id) !== currentSlugOrId
  );

  if (!blogs.length) return null;

  return (
    <section className="border-t border-gray-100 bg-[#f8fafc] py-10">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <h2 className="mb-4 text-lg font-bold text-[#1e293b]">Related articles</h2>
        <ul className="space-y-3">
          {blogs.slice(0, 4).map((blog) => (
            <li key={blog.id}>
              <Link
                href={`/blog/${blog.slug || blog.id}`}
                className="text-sm font-medium text-[#2563eb] hover:underline"
              >
                {blog.title}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

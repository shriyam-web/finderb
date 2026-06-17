import type { Metadata } from 'next';
import Link from 'next/link';
import { getSitemapSections } from '@/lib/sitemapData';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Sitemap',
  description: 'Browse all FinderB pages — categories, business listings, blog posts, and more.',
  alternates: {
    canonical: '/sitemap',
  },
};

export default async function SitemapPage() {
  const sections = await getSitemapSections();

  return (
    <div className="min-h-screen bg-accent/30 pt-24 pb-16 lg:pt-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-black text-primary mb-3">Sitemap</h1>
          <p className="text-gray-500 font-medium">
            All public pages on FinderB. The XML sitemap for search engines is available at{' '}
            <Link href="/sitemap.xml" className="text-blue-600 hover:underline">
              /sitemap.xml
            </Link>
            .
          </p>
        </div>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title} className="bg-white border border-gray-100 rounded-2xl p-6 md:p-8">
              <h2 className="text-lg font-black text-gray-900 mb-4">{section.title}</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {section.links.map((link) => (
                  <li key={`${section.title}-${link.href}`}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

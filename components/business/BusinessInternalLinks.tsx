import Link from 'next/link';
import type { Business } from '@/lib/mockData';
import { getBusinessLocationLabel } from '@/lib/businessBreadcrumb';
import { buildCityCategorySearchPath } from '@/lib/businessSeo';
import { getBusinessProfilePath } from '@/lib/businessSlug';
import { categoryHref } from '@/lib/categoryDisplay';
import { categoryCityHref, slugifyCity } from '@/lib/categoryCity';

type BusinessInternalLinksProps = {
  business: Business;
  categorySlug?: string | null;
  relatedCategories: { name: string; href: string }[];
  sameCategoryBusinesses: Business[];
  sameCityBusinesses: Business[];
};

function LinkList({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  if (!links.length) return null;

  return (
    <nav aria-label={title} className="rounded-xl border border-stone-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-[#153551]">{title}</h3>
      <ul className="mt-3 space-y-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-[#215481] hover:underline">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function BusinessInternalLinks({
  business,
  categorySlug,
  relatedCategories,
  sameCategoryBusinesses,
  sameCityBusinesses,
}: BusinessInternalLinksProps) {
  const location = getBusinessLocationLabel(business);
  const categoryPath = business.category
    ? categorySlug
      ? categoryHref(categorySlug, business.category)
      : buildCityCategorySearchPath(business.category, business.city)
    : '/categories';

  const categoryCityPath =
    business.category && categorySlug && business.city
      ? categoryCityHref(categorySlug, slugifyCity(business.city))
      : buildCityCategorySearchPath(business.category, business.city, categorySlug);

  return (
    <section className="border-t border-stone-200 py-10">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:grid-cols-2 lg:max-w-7xl lg:grid-cols-4 sm:px-6">
        <LinkList
          title={`More ${business.category} businesses`}
          links={sameCategoryBusinesses.map((item) => ({
            label: item.name,
            href: getBusinessProfilePath(item),
          }))}
        />

        <LinkList
          title={location ? `Businesses in ${location}` : 'Businesses in this city'}
          links={sameCityBusinesses.map((item) => ({
            label: item.name,
            href: getBusinessProfilePath(item),
          }))}
        />

        <LinkList
          title="Explore categories"
          links={relatedCategories.map((item) => ({
            label: item.name,
            href: item.href,
          }))}
        />

        <LinkList
          title="Location discovery"
          links={[
            { label: `All ${business.category} listings`, href: categoryPath },
            ...(location
              ? [{ label: `${business.category} in ${location}`, href: categoryCityPath }]
              : []),
            { label: 'Browse all categories', href: '/categories' },
            { label: 'FinderB home', href: '/' },
          ]}
        />
      </div>
    </section>
  );
}
